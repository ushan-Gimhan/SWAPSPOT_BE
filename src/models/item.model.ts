import mongoose, { Document, Schema } from "mongoose";

// 1. Condition Enum (Matches Frontend <select> values exactly)
export enum ItemCondition {
  BRAND_NEW = "Brand New",
  LIKE_NEW = "Like New",
  USED_GOOD = "Used - Good",
  USED_FAIR = "Used - Fair",
  FOR_PARTS = "For Parts"
}

// 2. Trade Mode Enum (Matches Frontend logic)
export enum TradeMode {
  SELL = "SELL",
  EXCHANGE = "EXCHANGE",
  CHARITY = "CHARITY"
}

export interface IItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: ItemCondition;
  images: string[];
  mode: TradeMode;
  seeking?: string; 
  aiSuggestedPrice?: number; 
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  status?: string; // For future use (e.g., SOLD, EXCHANGED)
}

const itemSchema = new Schema<IItem>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "Item must belong to a user"] 
    },
    title: { 
      type: String, 
      required: [true, "Title is required"], 
      trim: true 
    },
    description: { 
      type: String, 
      required: [true, "Description is required"] 
    },
    category: { 
      type: String, 
      required: [true, "Category is required"],
      lowercase: true, 
      trim: true
    },
    price: { 
      type: Number, 
      default: 0 
    },
    condition: {
      type: String,
      enum: Object.values(ItemCondition) as string[], // Cast to string[] for TS safety
      required: [true, "Condition is required"]
    },
    images: { 
      type: [String], // Array of Strings (URLs from ImgBB)
      default: [] 
    },
    mode: {
      type: String,
      enum: Object.values(TradeMode) as string[], // Cast to string[] for TS safety
      default: TradeMode.SELL
    },
    seeking: {
      type: String,
      default: ""
    },
    aiSuggestedPrice: {
      type: Number
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  }
);

export const Item = mongoose.model<IItem>("Item", itemSchema);