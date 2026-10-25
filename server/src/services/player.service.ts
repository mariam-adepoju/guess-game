import type { Server, Socket } from "socket.io";
import { EVENTS } from "../sockets/events.js";
import { rooms, sendRoomUpdate } from "./room.service.js";
import { clearRoundTimer, resetRound } from "./round.service.js";

export function removePlayer(
  io: Server,
  socket: Socket,
  disconnecting = false,
): void {
  const roomCode = socket.data.roomCode as string | undefined;
  const playerId = socket.data.playerId as string | undefined;
  if (!roomCode || !playerId) return;
  const room = rooms.get(roomCode);

  if (!room) {
    delete socket.data.roomCode;
    delete socket.data.playerId;
    return;
  }

  const leavingPlayer = room.players.find(
    (player) => player.playerId === playerId,
  );

  const wasGameMaster = leavingPlayer?.isGameMaster ?? false;
  room.players = room.players.filter((player) => player.playerId !== playerId);

  if (room.round) {
    delete room.round.attemptsRemaining[playerId];
  }

  if (!disconnecting) {
    socket.leave(roomCode);
  }

  delete socket.data.roomCode;
  delete socket.data.playerId;

  if (room.players.length === 0) {
    clearRoundTimer(room);
    rooms.delete(roomCode);

    console.info(`Room ${roomCode} deleted: no players remain`);
    return;
  }

  if (wasGameMaster) {
    // The current question belongs to the Game Master who left.
    const roundWasPlaying = room.status === "playing";
    resetRound(room);
    room.players.forEach((player, index) => {
      player.isGameMaster = index === 0;
    });

    if (roundWasPlaying) {
      io.to(roomCode).emit(EVENTS.GAME_CANCELLED, {
        message: "The Game Master left. The current round was cancelled.",
      });
    }
  }

  sendRoomUpdate(io, room);
}
