import mongoose, { Document, Schema } from "mongoose"

export enum ItemCondition {
  NEW = "NEW",
  LIKE_NEW = "LIKE_NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR"
}

export enum TradeMode {
  SELL = "SELL",
  TRADE = "TRADE",
  BOTH = "BOTH"
}

export interface IItem extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId // Reference to the User
  title: string
  description: string
  category: string
  price: number
  condition: ItemCondition
  images: string[]
  mode: TradeMode
  isActive: boolean
  createdAt: Date
}

const itemSchema = new Schema<IItem>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    category: { 
      type: String, 
      required: true,
      lowercase: true 
    },
    price: { 
      type: Number, 
      default: 0 
    },
    condition: {
      type: String,
      enum: Object.values(ItemCondition),
      required: true
    },
    images: { 
      type: [String], 
      default: [] 
    },
    mode: {
      type: String,
      enum: Object.values(TradeMode),
      default: TradeMode.SELL
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true // This automatically creates the 'createdAt' and 'updatedAt' fields
  }
)

export const Item = mongoose.model<IItem>("Item", itemSchema)