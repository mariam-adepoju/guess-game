import type { Socket } from "socket.io";
import { sendError } from "../services/room.service.js";
import { EVENTS } from "./events.js";

type EventLimit = { max: number; windowMs: number };
type Bucket = { startedAt: number; count: number };

const EVENT_LIMITS: Record<string, EventLimit> = {
  [EVENTS.ROOM_CREATE]: { max: 5, windowMs: 60_000 },
  [EVENTS.ROOM_JOIN]: { max: 10, windowMs: 60_000 },
  [EVENTS.ROOM_LEAVE]: { max: 10, windowMs: 10_000 },
  [EVENTS.GAME_CONFIGURE]: { max: 10, windowMs: 60_000 },
  [EVENTS.GAME_START]: { max: 10, windowMs: 60_000 },
  [EVENTS.GAME_GUESS]: { max: 8, windowMs: 10_000 },
};

export function applySocketRateLimits(socket: Socket): void {
  const buckets = new Map<string, Bucket>();
  socket.use(([eventName], next) => {
    if (typeof eventName !== "string") {
      next();
      return;
    }

    const limit = EVENT_LIMITS[eventName];
    if (!limit) {
      next();
      return;
    }

    const now = Date.now();
    const bucket = buckets.get(eventName);
    if (!bucket || now - bucket.startedAt >= limit.windowMs) {
      buckets.set(eventName, { startedAt: now, count: 1 });
      next();
      return;
    }

    if (bucket.count >= limit.max) {
      sendError(
        socket,
        "You're sending actions too quickly. Please wait and try again.",
      );
      return;
    }

    bucket.count += 1;
    next();
  });
  socket.on("disconnect", () => buckets.clear());
}
