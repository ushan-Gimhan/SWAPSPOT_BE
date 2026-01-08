// server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http, { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import passport from "passport";
import "./config/passport"; // Passport configuration

// Routes
import authRoutes from "./routes/auth.routes";
import itemRoutes from "./routes/item.routes";
import profileRoutes from "./routes/profile.routes";
import chatRoutes from "./routes/chat.routes";

dotenv.config();

const app = express();

// Create HTTP server for Socket.io
const server: HTTPServer = http.createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(passport.initialize());

// Mount Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/items", itemRoutes);
app.use("/api/v1/", profileRoutes);
app.use("/api/v1/chat", chatRoutes);

// Database Connection
const MONGO_URI = process.env.MONGO_URI as string;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ------------------- SOCKET.IO -------------------
export const setupSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
  });

  io.on("connection", (socket: Socket) => {
    console.log("🔌 New socket connected:", socket.id);

    // --- USER SETUP ---
    socket.on("setup", (user: any) => {
      if (!user?._id) {
        console.log("❌ Invalid user setup:", user);
        socket.disconnect();
        return;
      }
      socket.join(user._id);
      console.log("✅ User joined personal room:", user._id);
      socket.emit("connected");
    });

    // --- JOIN CHAT ROOM ---
    socket.on("join chat", (chatId: string) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log("📥 Joined chat room:", chatId);
    });

    // --- NEW MESSAGE ---
    socket.on("new message", (message: any) => {
      const participants = message.chat?.participants || message.chatParticipants;

      if (!participants) return;

      participants.forEach((user: any) => {
        if (user._id.toString() === message.sender._id.toString()) return;
        socket.to(user._id.toString()).emit("message received", message);
      });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
    });
  });

  return io;
};

// Start Socket.io
const io = setupSocket(server);

// ------------------- START SERVER -------------------
const PORT = process.env.SERVER_PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
