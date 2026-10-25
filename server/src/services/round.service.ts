import type { Server } from "socket.io";

import PlayerModel from "../models/player.model.js";
import GameRoundModel from "../models/gameRound.model.js";
import type { GameRoom, Round, RoomPlayer } from "../types/game.types.js";
import { EVENTS } from "../sockets/events.js";
import { sendRoomUpdate } from "./room.service.js";

export const DEFAULT_DURATION_SECONDS = 60;
export const MAX_ATTEMPTS = 3;
export const WINNING_POINTS = 10;

export type GameEndReason = "correct_guess" | "timeout";

type PersistInput = {
  roomCode: string;
  round: Round;
  reason: GameEndReason;
  winner?: RoomPlayer;
  guessers: Pick<RoomPlayer, "playerId" | "displayName">[];
  points: number;
};

/** Lowercase, strip accents, collapse whitespace so "  Café  " matches "cafe". */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function clearRoundTimer(room: GameRoom): void {
  if (room.round) {
    clearTimeout(room.round.timer);
  }
}

export function resetRound(room: GameRoom): void {
  clearRoundTimer(room);
  room.status = "waiting";
  room.round = undefined;
  room.draft = undefined;
}

export function rotateGameMaster(room: GameRoom): void {
  if (room.players.length === 0) return;

  const currentIndex = room.players.findIndex((player) => player.isGameMaster);
  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % room.players.length;

  room.players.forEach((player, index) => {
    player.isGameMaster = index === nextIndex;
  });
}
// Saves the finished round and updates career stats.
//  Uses upserts so it works whether or not the Player document already exists.
async function persistRound(r: PersistInput): Promise<void> {
  await GameRoundModel.create({
    roomCode: r.roomCode,
    question: r.round.question,
    answer: r.round.answer,
    winnerPlayerId: r.winner?.playerId ?? null,
    winnerName: r.winner?.displayName ?? null,
    endReason: r.reason,
    pointsAwarded: r.points,
    durationSeconds: r.round.durationSeconds,
  });

  if (r.guessers.length > 0) {
    await PlayerModel.bulkWrite(
      r.guessers.map((p) => ({
        updateOne: {
          filter: { _id: p.playerId },
          update: {
            $setOnInsert: { displayName: p.displayName },
            $inc: { gamesPlayed: 1 },
          },
          upsert: true,
        },
      })),
    );
  }

  if (r.winner) {
    await PlayerModel.updateOne(
      { _id: r.winner.playerId },
      {
        $setOnInsert: { displayName: r.winner.displayName },
        $inc: { gamesWon: 1 },
      },
      { upsert: true },
    );
  }
}

export function finishRound(
  io: Server,
  room: GameRoom,
  reason: GameEndReason,
  winner?: RoomPlayer,
): void {
  const round = room.round;

  // Idempotent: a timeout and a correct guess can't both end the same round.
  if (room.status !== "playing" || !round) return;
  clearTimeout(round.timer);

  const points = winner ? WINNING_POINTS : 0;
  if (winner) winner.score += points;

  const guessers = room.players
    .filter((player) => !player.isGameMaster)
    .map(({ playerId, displayName }) => ({ playerId, displayName }));

  // Reveal the answer only now that the round is over.
  io.to(room.roomCode).emit(EVENTS.GAME_ENDED, {
    reason,
    question: round.question,
    answer: round.answer,
    winner: winner
      ? { playerId: winner.playerId, displayName: winner.displayName }
      : null,
    pointsAwarded: points,
  });

  // Advance state synchronously so nothing can interleave with the DB work.
  rotateGameMaster(room);
  resetRound(room);

  sendRoomUpdate(io, room);
  io.to(room.roomCode).emit(EVENTS.NEXT_ROUND, {
    message: "The next Game Master can configure a new question.",
  });

  void persistRound({
    roomCode: room.roomCode,
    round,
    reason,
    winner,
    guessers,
    points,
  }).catch((error) =>
    console.error("Failed to persist completed round:", error),
  );
}
