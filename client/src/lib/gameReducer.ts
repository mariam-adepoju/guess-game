import type {
  ActiveRound,
  ChatMessage,
  GameEnded,
  GameRoom,
  GameStarted,
  GuessMade,
  NewChatMessage,
} from "../types/game.types";
import { MAX_MESSAGES } from "../constants/game";

export type GameState = {
  room: GameRoom | null;
  playerId: string;
  /** True once the server confirmed the Game Master's question. */
  questionSaved: boolean;
  round: ActiveRound | null;
  /** The current player's remaining attempts, or null when not guessing. */
  attemptsLeft: number | null;
  messages: ChatMessage[];
  nextMessageId: number;
  error: string;
};

export const initialGameState: GameState = {
  room: null,
  playerId: "",
  questionSaved: false,
  round: null,
  attemptsLeft: null,
  messages: [],
  nextMessageId: 1,
  error: "",
};

export type GameAction =
  | { type: "room_entered"; roomCode: string; playerId: string }
  | { type: "room_updated"; room: GameRoom }
  | { type: "question_saved" }
  | { type: "round_started"; round: GameStarted; clockOffset: number }
  | { type: "guess_made"; guess: GuessMade }
  | { type: "round_ended"; result: GameEnded }
  | { type: "round_cancelled"; message: string }
  | { type: "error_set"; message: string }
  | { type: "error_cleared" }
  | { type: "disconnected" }
  | { type: "reset" };

function addMessages(
  state: GameState,
  incoming: NewChatMessage[],
): Pick<GameState, "messages" | "nextMessageId"> {
  let nextId = state.nextMessageId;
  const added = incoming.map(
    (message) => ({ ...message, id: nextId++ }) as ChatMessage,
  );

  return {
    messages: [...state.messages, ...added].slice(-MAX_MESSAGES),
    nextMessageId: nextId,
  };
}

/** Turns a room:update into "X joined / X left / X is now the Game Master" chat lines. */
function describePlayerChanges(
  previous: GameRoom,
  next: GameRoom,
  myPlayerId: string,
): NewChatMessage[] {
  const notes: NewChatMessage[] = [];
  const previousIds = new Set(previous.players.map((p) => p.playerId));
  const nextIds = new Set(next.players.map((p) => p.playerId));

  for (const player of next.players) {
    if (!previousIds.has(player.playerId)) {
      notes.push({
        kind: "system",
        text: `${player.displayName} joined the room.`,
      });
    }
  }

  for (const player of previous.players) {
    if (!nextIds.has(player.playerId)) {
      notes.push({
        kind: "system",
        text: `${player.displayName} left the room.`,
      });
    }
  }

  const previousMasterId = previous.players.find(
    (p) => p.isGameMaster,
  )?.playerId;
  const nextMaster = next.players.find((p) => p.isGameMaster);

  if (nextMaster && nextMaster.playerId !== previousMasterId) {
    notes.push({
      kind: "system",
      text:
        nextMaster.playerId === myPlayerId
          ? "You are now the Game Master. Set a question to begin."
          : `${nextMaster.displayName} is now the Game Master.`,
    });
  }

  return notes;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "room_entered": {
      const fresh: GameState = {
        ...initialGameState,
        playerId: action.playerId,
      };
      return {
        ...fresh,
        ...addMessages(fresh, [
          { kind: "system", text: `You joined room ${action.roomCode}.` },
        ]),
      };
    }

    case "room_updated": {
      const notes = state.room
        ? describePlayerChanges(state.room, action.room, state.playerId)
        : [];
      return { ...state, room: action.room, ...addMessages(state, notes) };
    }

    case "question_saved":
      return {
        ...state,
        questionSaved: true,
        error: "",
        ...addMessages(state, [
          {
            kind: "system",
            text: "Question saved. Start the game when everyone is ready.",
          },
        ]),
      };

    case "round_started":
      return {
        ...state,
        round: { ...action.round, clockOffset: action.clockOffset },
        attemptsLeft: action.round.attemptsRemaining[state.playerId] ?? null,
        questionSaved: false,
        error: "",
        ...addMessages(state, [
          {
            kind: "system",
            text: `Round started. You have ${action.round.durationSeconds} seconds.`,
          },
          { kind: "question", text: action.round.question },
        ]),
      };

    case "guess_made": {
      const { guess } = action;
      const isMine = guess.playerId === state.playerId;

      return {
        ...state,
        attemptsLeft: isMine ? guess.attemptsRemaining : state.attemptsLeft,
        ...addMessages(state, [
          {
            kind: "guess",
            playerId: guess.playerId,
            displayName: guess.displayName,
            text: guess.guess,
            correct: guess.correct,
          },
        ]),
      };
    }

    case "round_ended":
      return {
        ...state,
        round: null,
        attemptsLeft: null,
        error: "",
        ...addMessages(state, [{ kind: "result", result: action.result }]),
      };

    case "round_cancelled":
      return {
        ...state,
        round: null,
        attemptsLeft: null,
        questionSaved: false,
        ...addMessages(state, [{ kind: "system", text: action.message }]),
      };

    case "error_set":
      return { ...state, error: action.message };

    case "error_cleared":
      return state.error ? { ...state, error: "" } : state;

    case "disconnected":
      return {
        ...initialGameState,
        error: "Connection lost. Join a room again to keep playing.",
      };

    case "reset":
      return initialGameState;
  }
}
