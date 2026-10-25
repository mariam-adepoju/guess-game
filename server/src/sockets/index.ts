import type { Server } from "socket.io";

import { registerRoomHandlers } from "./handlers/room.handlers.js";
import { registerGameHandlers } from "./handlers/game.handlers.js";
import { applySocketRateLimits } from "./rate-limit.js";

/** Register all Socket.IO handlers used by the application. */
export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    console.info(`Client connected: ${socket.id}`);

    applySocketRateLimits(socket);
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
  });
}
