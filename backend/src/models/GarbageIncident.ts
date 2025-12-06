import mongoose, { Document, Schema, Types } from "mongoose";

export type IncidentStatus = "PENDING" | "CLAIMED" | "CLEANED";

export interface IGarbageIncident extends Document {
  imageBeforeUrl: string;
  imageAfterUrl?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  addressText?: string;
  status: IncidentStatus;
  createdBy?: Types.ObjectId | null;
  claimedBy?: Types.ObjectId | null;
  cleanedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const GeoJSONPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  { _id: false }
);

const GarbageIncidentSchema = new Schema<IGarbageIncident>(
  {
    imageBeforeUrl: { type: String, required: true },
    imageAfterUrl: { type: String },
    location: { type: GeoJSONPointSchema, index: "2dsphere" },
    addressText: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "CLAIMED", "CLEANED"],
      default: "PENDING",
      index: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    claimedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cleanedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export const GarbageIncident = mongoose.model<IGarbageIncident>(
  "GarbageIncident",
  GarbageIncidentSchema
);


