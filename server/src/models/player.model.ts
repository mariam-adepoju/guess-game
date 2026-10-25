import mongoose, { Schema, type InferSchemaType } from "mongoose";

const playerSchema = new Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    gamesPlayed: { type: Number, default: 0, min: 0 },
    gamesWon: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export type Player = InferSchemaType<typeof playerSchema>;
const PlayerModel = mongoose.model("Player", playerSchema);
export default PlayerModel;
