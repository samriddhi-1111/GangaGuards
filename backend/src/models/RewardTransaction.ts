import mongoose, { Document, Schema, Types } from "mongoose";

export type RewardType = "CLEANING";

export interface IRewardTransaction extends Document {
  userId: Types.ObjectId;
  incidentId: Types.ObjectId;
  pointsEarned: number;
  type: RewardType;
  timestamp: Date;
}

const RewardTransactionSchema = new Schema<IRewardTransaction>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  incidentId: {
    type: Schema.Types.ObjectId,
    ref: "GarbageIncident",
    required: true
  },
  pointsEarned: { type: Number, required: true },
  type: { type: String, enum: ["CLEANING"], default: "CLEANING", index: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

export const RewardTransaction = mongoose.model<IRewardTransaction>(
  "RewardTransaction",
  RewardTransactionSchema
);


