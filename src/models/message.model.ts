import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  isRead: boolean;
}

const MessageSchema: Schema = new Schema({
  // ⚠️ Match controller: 'chatId'
  chatId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Chat', 
      required: true 
  },
  
  // ⚠️ Match controller: 'sender' (Backend often uses 'sender' or 'senderId')
  // In your controller you used: sender: senderId
  sender: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
  },

  // ⚠️ Match controller: 'text' (Not 'content' or 'message')
  text: { 
      type: String, 
      required: true 
  },

  isRead: { 
      type: Boolean, 
      default: false 
  }
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);