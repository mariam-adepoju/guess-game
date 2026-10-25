import { io, type Socket } from "socket.io-client";
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export function createGameSocket(): Socket {
  return io(SERVER_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
}
