import mongoose, { Document, Schema } from "mongoose";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER"

}
export enum Status {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password?: string; // Made optional for Google OAuth users
  roles: Role[];
  approved: Status;
  bio?: string;
  location?: string;
  avatar?: string;
  googleId?: string; // Added googleId to interface
  createdAt: Date;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  location?: string;
  avatar?: string;
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true, required: true },
  password: { type: String, required: false }, // Set to false to allow Google users
  roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
  approved: {
    type: String,
    enum: Object.values(Status),
    default: Status.PENDING
  },
  bio: { type: String, default: "" },
  location: { type: String, default: "Colombo, Sri Lanka" },
  avatar: { type: String, default: "" },
  googleId: { type: String, unique: true, sparse: true }, // Added googleId to schema
  
}, { timestamps: true });

export const User = mongoose.model<IUser>("User", userSchema);
export default User;