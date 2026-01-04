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
  password: string;
  roles: Role[];
  approved: Status;
  //Added these 3 new fields
  bio?: string;
  location?: string;
  avatar?: string;
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
  password: { type: String, required: true },
  roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
  approved: {
    type: String,
    enum: Object.values(Status),
    default: Status.PENDING
  },
  //Added Schema definitions here
  bio: { type: String, default: "" },
  location: { type: String, default: "Colombo, Sri Lanka" },
  avatar: { type: String, default: "" },
  
}, { timestamps: true }); // Automatically manages createdAt and updatedAt

export const User = mongoose.model<IUser>("User", userSchema);
export default User;