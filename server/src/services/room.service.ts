import type { Server, Socket } from "socket.io";
import { randomBytes } from "node:crypto";
import type { GameRoom, RoomPlayer } from "../types/game.types.js";
import { EVENTS } from "../sockets/events.js";

export const MAX_PLAYERS_PER_ROOM = 10;
export const MAX_ROOMS = 500;
export const rooms = new Map<string, GameRoom>();

export function generateRoomCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

export function sendError(socket: Socket, message: string): void {
  socket.emit(EVENTS.GAME_ERROR, { message });
}

export function getRoomForSocket(socket: Socket): GameRoom | undefined {
  const roomCode = socket.data.roomCode as string | undefined;
  return roomCode ? rooms.get(roomCode) : undefined;
}

export function getPlayerForSocket(
  room: GameRoom,
  socket: Socket,
): RoomPlayer | undefined {
  return room.players.find((player) => player.socketId === socket.id);
}

export function isGameMaster(room: GameRoom, socket: Socket): boolean {
  return getPlayerForSocket(room, socket)?.isGameMaster === true;
}

export function uniqueRoomCode(): string {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  return code;
}

export function createRoom(
  roomCode: string,
  gm: Omit<RoomPlayer, "score">,
): GameRoom {
  return {
    roomCode,
    players: [{ ...gm, score: 0 }],
    status: "waiting",
    createdAt: Date.now(),
  };
}

export function sendRoomUpdate(io: Server, room: GameRoom): void {
  io.to(room.roomCode).emit(EVENTS.ROOM_UPDATE, {
    roomCode: room.roomCode,
    status: room.status,
    playerCount: room.players.length,
    players: room.players.map((player) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      score: player.score,
      isGameMaster: player.isGameMaster,
    })),
  });
}
