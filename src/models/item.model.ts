import mongoose, { Document, Schema } from "mongoose";

// 1. FIX: Updated Enum to match Frontend <option> values exactly
export enum ItemCondition {
  BRAND_NEW = "Brand New",
  LIKE_NEW = "Like New",
  USED_GOOD = "Used - Good",
  USED_FAIR = "Used - Fair",
  FOR_PARTS = "For Parts" // Changed from POOR to match likely frontend option
}

// 2. Trade Mode
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
      lowercase: true, // Note: "Tech & Electronics" becomes "tech & electronics"
      trim: true
    },
    price: { 
      type: Number, 
      default: 0 
    },
    condition: {
      type: String,
      // FIX: This now validates against "Like New", "Brand New", etc.
      enum: Object.values(ItemCondition), 
      required: [true, "Condition is required"]
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
  },
  { 
    timestamps: true 
  }
);

export const Item = mongoose.model<IItem>("Item", itemSchema);