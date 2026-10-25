import mongoose, { Schema, type InferSchemaType } from "mongoose";
export const END_REASONS = ["correct_guess", "timeout"] as const;

const gameRoundSchema = new Schema(
  {
    roomCode: {
      type: String,
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    winnerPlayerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    winnerName: {
      type: String,
      default: null,
    },

    endReason: {
      type: String,
      enum: END_REASONS,
      required: true,
    },

    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

export type GameRound = InferSchemaType<typeof gameRoundSchema>;
const GameRoundModel = mongoose.model("GameRound", gameRoundSchema);
export default GameRoundModel;
