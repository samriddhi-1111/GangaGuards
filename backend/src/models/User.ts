import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "NORMAL_USER" | "SAFAI_KARMI" | "SANSTHA";

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  firebaseUid: string;
  profileImageUrl?: string;
  role: UserRole;
  points: number;
  totalCleaned: number;
  lastLogin?: Date;
  lastLogout?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, index: true },
    firebaseUid: { type: String, required: true, unique: true, index: true },
    profileImageUrl: { type: String },
    role: {
      type: String,
      enum: ["NORMAL_USER", "SAFAI_KARMI", "SANSTHA"],
      default: "NORMAL_USER"
    },
    points: { type: Number, default: 0 },
    totalCleaned: { type: Number, default: 0 },
    lastLogin: { type: Date },
    lastLogout: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = mongoose.model<IUser>("User", UserSchema);


