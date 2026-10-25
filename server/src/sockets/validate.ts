import type { Socket } from "socket.io";
import type { z } from "zod";
import { sendError } from "../services/room.service.js";

export function onValidated<T>(
  socket: Socket,
  event: string,
  schema: z.ZodType<T>,
  handler: (data: T) => void | Promise<void>,
): void {
  socket.on(event, async (payload: unknown) => {
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      // Type errors (missing or non-object payload) get a generic message.
      sendError(
        socket,
        !issue || issue.code === "invalid_type"
          ? "Invalid request."
          : issue.message,
      );
      return;
    }

    try {
      await handler(parsed.data);
    } catch (error) {
      console.error(`${event} failed:`, error);
      sendError(socket, "Something went wrong.");
    }
  });
}

/** For events with no payload, such as game:start. */
export function onSafe(
  socket: Socket,
  event: string,
  handler: () => void,
): void {
  socket.on(event, () => {
    try {
      handler();
    } catch (error) {
      console.error(`${event} failed:`, error);
      sendError(socket, "Something went wrong.");
    }
  });
}
