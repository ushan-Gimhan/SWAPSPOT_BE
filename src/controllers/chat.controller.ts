import { Request, Response } from "express";
import mongoose from "mongoose";
import { Chat } from "../models/chat.model";
import { Message } from "../models/message.model";

// Helper to validate Mongo IDs
const isValidId = (id: any) => mongoose.Types.ObjectId.isValid(id);

// ------------------- ACCESS CHAT -------------------
export const accessChat = async (req: Request, res: Response) => {
  try {
    const { userId, itemId } = req.body;
    const userPayload = (req as any).user;
    if (!userPayload)
      return res.status(401).json({ message: "User not authenticated" });

    const myId = userPayload._id || userPayload.id || userPayload.sub;
    if (!userId || !isValidId(userId))
      return res.status(400).json({ message: "Invalid Target User ID" });

    const validItemId = itemId && isValidId(itemId) ? itemId : undefined;
    if (myId === userId)
      return res.status(400).json({ message: "You cannot chat with yourself" });

    const query: any = {
      $and: [
        { participants: { $elemMatch: { $eq: myId } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    };
    if (validItemId) query.$and.push({ itemId: validItemId });

    // Check if chat exists
    let isChat = await Chat.findOne(query)
      .populate("participants", "-password")
      .populate("itemId", "title price images")
      .lean();

    if (isChat) {
      isChat.participants = isChat.participants.map((p: any) => ({
        ...p,
        fullName: p.fullName || p["full Name"] || "User",
        role: p.roles?.[0] || "USER",
      }));
      return res.status(200).json(isChat);
    }

    // Create new chat
    const createdChat = await Chat.create({
      participants: [myId, userId],
      itemId: validItemId,
      lastMessage: "",
    });

    const fullChat = await Chat.findById(createdChat._id)
      .populate("participants", "-password")
      .populate("itemId", "title price images")
      .lean();

    if (!fullChat)
      return res.status(500).json({ message: "Failed to create chat" });

    fullChat.participants = fullChat.participants.map((p: any) => ({
      ...p,
      fullName: p.fullName || p["full Name"] || "User",
      role: p.roles?.[0] || "USER",
    }));

    res.status(200).json(fullChat);
  } catch (error: any) {
    console.error("🔥 ACCESS CHAT ERROR:", error.message);
    res.status(500).json({ message: "Error accessing chat", error: error.message });
  }
};

// ------------------- FETCH ALL CHATS -------------------
export const fetchMyChats = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    const myId = userPayload._id || userPayload.id || userPayload.sub;

    const chats = await Chat.find({ participants: { $elemMatch: { $eq: myId } } })
      .populate("participants", "-password")
      .populate("itemId", "title price images")
      .sort({ updatedAt: -1 })
      .lean();

    const fixedChats = chats.map((chat: any) => ({
      ...chat,
      participants: chat.participants.map((p: any) => ({
        ...p,
        fullName: p.fullName || p["full Name"] || "User",
        role: p.roles?.[0] || "USER",
      })),
    }));

    res.status(200).json(fixedChats);
  } catch (error: any) {
    console.error("🔥 FETCH CHATS ERROR:", error.message);
    res.status(500).json({ message: "Error fetching chats", error: error.message });
  }
};

// ------------------- SEND MESSAGE -------------------
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, content } = req.body;
    const userPayload = (req as any).user;
    const senderId = userPayload._id || userPayload.id || userPayload.sub;

    if (!content || !chatId || !isValidId(chatId))
      return res.status(400).json({ message: "Invalid data" });

    const newMessage = await Message.create({
      sender: senderId,
      text: content,
      chatId,
    });

    // Update lastMessage in chat
    await Chat.findByIdAndUpdate(chatId, { lastMessage: content });

    // Populate sender
    const message = await Message.findById(newMessage._id).populate(
      "sender",
      "fullName avatar email"
    );

    // Emit to Socket.io
    const io = req.app.get("io") as any;
    if (io) io.to(chatId).emit("message received", message);

    res.json(message);
  } catch (error: any) {
    console.error("🔥 SEND MESSAGE ERROR:", error.message);
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// ------------------- FETCH ALL MESSAGES -------------------
export const allMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    if (!isValidId(chatId)) return res.status(400).json({ message: "Invalid Chat ID" });

    const messages = await Message.find({ chatId })
      .populate("sender", "fullName avatar email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error: any) {
    console.error("🔥 FETCH MESSAGES ERROR:", error.message);
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
};
