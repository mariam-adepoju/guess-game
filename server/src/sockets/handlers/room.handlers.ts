import mongoose from "mongoose";
import type { Server, Socket } from "socket.io";

import { EVENTS } from "../events.js";
import { createRoomSchema, joinRoomSchema } from "../schemas.js";
import { onValidated } from "../validate.js";
import { removePlayer } from "../../services/player.service.js";
import {
  MAX_PLAYERS_PER_ROOM,
  MAX_ROOMS,
  createRoom,
  rooms,
  sendError,
  sendRoomUpdate,
  uniqueRoomCode,
} from "../../services/room.service.js";

export function registerRoomHandlers(io: Server, socket: Socket): void {
  // CREATE ROOM
  onValidated(
    socket,
    EVENTS.ROOM_CREATE,
    createRoomSchema,
    async ({ displayName }) => {
      if (socket.data.roomCode) {
        return sendError(socket, "Leave your current room first.");
      }
      if (rooms.size >= MAX_ROOMS) {
        return sendError(socket, "The server is busy. Please try again later.");
      }

      // Claim all state synchronously, before the first await.
      const roomCode = uniqueRoomCode();
      const playerId = new mongoose.Types.ObjectId().toString();
      const room = createRoom(roomCode, {
        playerId,
        socketId: socket.id,
        displayName,
        isGameMaster: true,
      });

      rooms.set(roomCode, room);
      socket.data.roomCode = roomCode;
      socket.data.playerId = playerId;
      await socket.join(roomCode);

      socket.emit(EVENTS.ROOM_CREATED, { roomCode, playerId });
      sendRoomUpdate(io, room);
      console.info(`Room ${roomCode} created by ${displayName}`);
    },
  );

  // JOIN ROOM
  onValidated(
    socket,
    EVENTS.ROOM_JOIN,
    joinRoomSchema,
    async ({ roomCode, displayName }) => {
      if (socket.data.roomCode) {
        return sendError(socket, "Leave your current room first.");
      }

      const room = rooms.get(roomCode);

      if (!room) return sendError(socket, "Room not found.");
      if (room.status !== "waiting") {
        return sendError(socket, "This game has already started.");
      }
      if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
        return sendError(
          socket,
          `This room is full (max ${MAX_PLAYERS_PER_ROOM} players).`,
        );
      }

      const nameTaken = room.players.some(
        (player) =>
          player.displayName.toLowerCase() === displayName.toLowerCase(),
      );
      if (nameTaken) {
        return sendError(socket, "That name is already used in this room.");
      }
      // Check and claim in the same synchronous block: no await in between.
      const playerId = new mongoose.Types.ObjectId().toString();

      room.players.push({
        playerId,
        socketId: socket.id,
        displayName,
        score: 0,
        isGameMaster: false,
      });
      socket.data.roomCode = roomCode;
      socket.data.playerId = playerId;

      await socket.join(roomCode);

      socket.emit(EVENTS.ROOM_JOINED, { roomCode, playerId });
      sendRoomUpdate(io, room);
      console.info(`${displayName} joined room ${roomCode}`);
    },
  );

  // LEAVE ROOM
  socket.on(EVENTS.ROOM_LEAVE, () => {
    try {
      removePlayer(io, socket);
    } catch (error) {
      console.error("room:leave failed:", error);
      sendError(socket, "Unable to leave the room.");
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    try {
      removePlayer(io, socket, true);
    } catch (error) {
      console.error("Disconnect cleanup failed:", error);
    }
    console.info(`Client disconnected: ${socket.id}`);
  });
}
