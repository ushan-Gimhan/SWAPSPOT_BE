import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  itemId?: mongoose.Types.ObjectId;
  lastMessage?: string; // Optional: For showing "last sent" in list
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
  // MUST be named 'participants' to match controller
  participants: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
  }],
  
  // MUST be named 'itemId' to match controller
  itemId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Item',
      required: false // Optional, so general chats don't break
  },

  lastMessage: { 
      type: String, 
      default: "" 
  }
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt
});

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);