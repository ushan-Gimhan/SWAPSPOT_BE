import { Request, Response } from 'express';
import mongoose from 'mongoose'; 
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { io } from '../index'; 

// Helper to validate Mongo IDs (Prevents server crashes)
const isValidId = (id: any) => mongoose.Types.ObjectId.isValid(id);

// Create or Get Existing Chat
export const accessChat = async (req: Request, res: Response) => {
  try {
    const { userId, itemId } = req.body; 
    
    // Robust User Extraction
    const userPayload = (req as any).user;
    if (!userPayload) return res.status(401).json({ message: "User not authenticated" });
    const myId = userPayload.id || userPayload._id || userPayload.sub;

    console.log(`🔹 Chat Request: Me[${myId}] -> Other[${userId}] Item[${itemId}]`);

    // Validation Checks
    if (!userId || !isValidId(userId)) {
        return res.status(400).json({ message: "Invalid Target User ID" });
    }
    
    //Handle empty string itemId by converting to undefined
    const validItemId = (itemId && isValidId(itemId)) ? itemId : undefined;

    if (myId === userId) {
        return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    //Find Existing Chat
    let query: any = {
        $and: [
            { participants: { $elemMatch: { $eq: myId } } },
            { participants: { $elemMatch: { $eq: userId } } },
        ],
    };

    // Only filter by item if a valid item ID exists
    if (validItemId) {
        query.$and.push({ itemId: validItemId });
    }

    let isChat = await Chat.findOne(query)
        .populate("participants", "-password")
        .populate("itemId", "title price images");

    if (isChat) {
        res.send(isChat);
    } else {
        //Create New Chat
        const chatData = {
            participants: [myId, userId],
            itemId: validItemId, // Safe to pass undefined
            lastMessage: "" // Initialize
        };

        const createdChat = await Chat.create(chatData);
        
        const fullChat = await Chat.findById(createdChat._id)
            .populate("participants", "-password")
            .populate("itemId", "title price images");

        res.status(200).json(fullChat);
    }

  } catch (error: any) {
    console.error("🔥 ACCESS CHAT ERROR:", error.message);
    res.status(500).json({ message: "Error accessing chat", error: error.message });
  }
};

//Fetch All Chats for Sidebar
export const fetchMyChats = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    const myId = userPayload.id || userPayload._id || userPayload.sub;

    const chats = await Chat.find({ participants: { $elemMatch: { $eq: myId } } })
      .populate("participants", "-password")
      .populate("itemId", "title price images")
      .sort({ updatedAt: -1 });
      
    res.status(200).json(chats);
  } catch (error: any) {
    console.error("🔥 FETCH CHATS ERROR:", error.message);
    res.status(500).json({ message: "Error fetching chats", error: error.message });
  }
};

// Send Message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, content } = req.body;
    
    //Robust User Extraction
    const userPayload = (req as any).user;
    const senderId = userPayload.id || userPayload._id || userPayload.sub;

    // Validation
    if (!content || !chatId) {
      return res.status(400).json({ message: "Invalid data passed into request" });
    }

    if (!isValidId(chatId)) {
        return res.status(400).json({ message: "Invalid Chat ID" });
    }

    //Save Message to DB (Matches Schema)
    let newMessage = await Message.create({
      sender: senderId,   // Schema field: 'sender'
      text: content,      // Schema field: 'text'
      chatId: chatId,
    });

    //Update Chat's 'lastMessage' (Matches Schema)
    await Chat.findByIdAndUpdate(chatId, { 
        lastMessage: content 
    });

    //Populate info for Frontend return
    newMessage = await newMessage.populate("sender", "fullName avatar");
    newMessage = await newMessage.populate("chatId");

    // F. REAL-TIME: Emit to Socket.io Room
    if(io) {
        io.to(chatId).emit("new message", newMessage);
    }

    res.json(newMessage);
  } catch (error: any) {
    console.error("🔥 SEND MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// 4. Fetch Messages for a specific Chat
export const allMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    if (!isValidId(chatId)) {
        return res.status(400).json({ message: "Invalid Chat ID" });
    }

    const messages = await Message.find({ chatId: chatId })
      .populate("sender", "fullName avatar email")
      .sort({ createdAt: 1 }); // Oldest first (chronological order)

    res.json(messages);
  } catch (error: any) {
    console.error("🔥 FETCH MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
};