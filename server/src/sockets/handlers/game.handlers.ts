import type { Server, Socket } from "socket.io";

import { EVENTS } from "../events.js";
import { configureSchema, guessSchema } from "../schemas.js";
import { onValidated } from "../validate.js";
import {
  DEFAULT_DURATION_SECONDS,
  MAX_ATTEMPTS,
  finishRound,
  normalizeAnswer,
} from "../../services/round.service.js";
import {
  getPlayerForSocket,
  getRoomForSocket,
  isGameMaster,
  sendError,
} from "../../services/room.service.js";

type FinishRoundHandler = typeof finishRound;

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  finishRoundHandler: FinishRoundHandler = finishRound,
): void {
  // CONFIGURE QUESTION AND ANSWER (Game Master only)
  onValidated(
    socket,
    EVENTS.GAME_CONFIGURE,
    configureSchema,
    ({ question, answer }) => {
      const room = getRoomForSocket(socket);

      if (!room)
        return sendError(socket, "Join a room before setting up a game.");
      if (!isGameMaster(room, socket)) {
        return sendError(
          socket,
          "Only the Game Master can configure the game.",
        );
      }
      if (room.status !== "waiting") {
        return sendError(
          socket,
          "The game is not accepting a new question now.",
        );
      }

      room.draft = { question, answer };
      // Confirm to the Game Master only. Players see the question at game:started,
      // and nobody receives the answer until the round ends.
      socket.emit(EVENTS.GAME_CONFIGURED, {
        question,
        durationSeconds: DEFAULT_DURATION_SECONDS,
      });
    },
  );

  // START ROUND
  socket.on(EVENTS.GAME_START, () => {
    const room = getRoomForSocket(socket);

    if (!room) return sendError(socket, "Join a room before starting a game.");
    if (!isGameMaster(room, socket)) {
      return sendError(socket, "Only the Game Master can start the game.");
    }
    if (room.status !== "waiting") {
      return sendError(socket, "This game cannot be started right now.");
    }
    if (room.players.length < 3) {
      return sendError(socket, "At least 3 players are required to start.");
    }

    const draft = room.draft;
    if (!draft) {
      return sendError(socket, "Configure a question and answer first.");
    }

    const durationSeconds = DEFAULT_DURATION_SECONDS;
    const endsAt = Date.now() + durationSeconds * 1000;
    const attemptsRemaining = Object.fromEntries(
      room.players
        .filter((player) => !player.isGameMaster)
        .map((player) => [player.playerId, MAX_ATTEMPTS]),
    );

    room.status = "playing";
    room.draft = undefined;
    room.round = {
      question: draft.question,
      answer: draft.answer,
      durationSeconds,
      endsAt,
      attemptsRemaining,
      timer: setTimeout(() => {
        finishRoundHandler(io, room, "timeout");
      }, durationSeconds * 1000),
    };

    io.to(room.roomCode).emit(EVENTS.GAME_STARTED, {
      question: draft.question,
      durationSeconds,
      endsAt,
      serverTime: Date.now(),
      attemptsRemaining,
    });
  });

  // SUBMIT GUESS
  onValidated(socket, EVENTS.GAME_GUESS, guessSchema, ({ guess }) => {
    const room = getRoomForSocket(socket);
    const round = room?.round;

    if (!room || room.status !== "playing" || !round) {
      return sendError(socket, "There is no active round to guess in.");
    }

    // A late guess must not win if the timeout callback was delayed.
    if (Date.now() >= round.endsAt) {
      finishRoundHandler(io, room, "timeout");
      return;
    }

    const player = getPlayerForSocket(room, socket);

    if (!player) return sendError(socket, "You are not a player in this room.");
    if (player.isGameMaster) {
      return sendError(
        socket,
        "The Game Master cannot guess their own answer.",
      );
    }

    const attempts = round.attemptsRemaining[player.playerId] ?? 0;
    if (attempts <= 0) {
      return sendError(socket, "You have used all your attempts.");
    }

    const remaining = attempts - 1;
    round.attemptsRemaining[player.playerId] = remaining;

    const isCorrect = normalizeAnswer(guess) === normalizeAnswer(round.answer);

    socket.emit(EVENTS.GAME_GUESS_RESULT, {
      correct: isCorrect,
      attemptsRemaining: remaining,
    });

    io.to(room.roomCode).emit(EVENTS.GAME_GUESS_MADE, {
      playerId: player.playerId,
      displayName: player.displayName,
      guess,
      correct: isCorrect,
      attemptsRemaining: remaining,
    });

    if (isCorrect) {
      finishRoundHandler(io, room, "correct_guess", player);
    }
  });
}
