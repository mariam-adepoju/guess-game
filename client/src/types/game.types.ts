export type RoomStatus = "waiting" | "playing";

export type RoomPlayer = {
  playerId: string;
  displayName: string;
  score: number;
  isGameMaster: boolean;
};

export type GameRoom = {
  roomCode: string;
  status: RoomStatus;
  playerCount: number;
  players: RoomPlayer[];
};

export type RoomResponse = {
  roomCode: string;
  playerId: string;
};

export type GameStarted = {
  question: string;
  durationSeconds: number;
  endsAt: number;
  /** Server clock when the round started; lets the client correct for clock skew. */
  serverTime?: number;
  attemptsRemaining: Record<string, number>;
};

/** A started round plus the offset between the server clock and this browser's clock. */
export type ActiveRound = GameStarted & { clockOffset: number };

export type GameError = {
  message: string;
};

export type GuessMade = {
  playerId: string;
  displayName: string;
  guess: string;
  correct: boolean;
  attemptsRemaining: number;
};

export type GameEnded = {
  reason: "correct_guess" | "timeout";
  question: string;
  answer: string;
  winner: {
    playerId: string;
    displayName: string;
  } | null;
  pointsAwarded: number;
};

export type ChatMessage =
  | { id: number; kind: "system"; text: string }
  | { id: number; kind: "question"; text: string }
  | {
      id: number;
      kind: "guess";
      playerId: string;
      displayName: string;
      text: string;
      correct: boolean;
    }
  | { id: number; kind: "result"; result: GameEnded };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** A chat message before the reducer assigns its id. */
export type NewChatMessage = DistributiveOmit<ChatMessage, "id">;
