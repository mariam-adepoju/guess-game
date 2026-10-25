import { z } from "zod";
import { normalizeAnswer } from "../services/round.service.js";

const displayName = z
  .string()
  .trim()
  .min(2, "Display name must be between 2 and 30 characters.")
  .max(30, "Display name must be between 2 and 30 characters.")
  .regex(
    /^[\p{L}\p{N} _.'-]+$/u,
    "Display name contains unsupported characters.",
  );

export const createRoomSchema = z.object({ displayName });

export const joinRoomSchema = z.object({
  displayName,
  roomCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-F0-9]{6}$/, "Enter a valid 6-character room code."),
});

export const configureSchema = z.object({
  question: z
    .string()
    .trim()
    .min(5, "The question must be between 5 and 500 characters.")
    .max(500, "The question must be between 5 and 500 characters."),
  answer: z
    .string()
    .trim()
    .min(1, "The answer must be between 1 and 200 characters.")
    .max(200, "The answer must be between 1 and 200 characters.")
    .refine(
      (value) => normalizeAnswer(value).length > 0,
      "The answer must contain letters or numbers.",
    ),
});

export const guessSchema = z.object({
  guess: z
    .string()
    .trim()
    .min(1, "Enter a guess.")
    .max(200, "Your guess must be at most 200 characters."),
});
