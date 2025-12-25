import mongoose, { Document, Schema } from "mongoose"

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
  _id: mongoose.Types.ObjectId
  fullName: string
  email: string
  password: string
  roles: Role[]
  approved: Status
}

const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, required: true },
  roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
  approved: {
    type: String,
    enum: Object.values(Status),
    default: Status.PENDING
  }
})

export const User = mongoose.model<IUser>("User", userSchema)