export type RoomPlayer = {
  playerId: string;
  socketId: string;
  displayName: string;
  score: number;
  isGameMaster: boolean;
};

export type Round = {
  question: string;
  answer: string;
  durationSeconds: number;
  endsAt: number;
  attemptsRemaining: Record<string, number>;
  timer: ReturnType<typeof setTimeout>;
};

export type GameRoom = {
  roomCode: string;
  players: RoomPlayer[];
  status: "waiting" | "playing";
  createdAt: number;
  draft?: { question: string; answer: string };
  round?: Round;
};
