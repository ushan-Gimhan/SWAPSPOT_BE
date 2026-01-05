import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import './config/passport'; // Import Passport configuration

// Routes
import authRoutes from './routes/auth.routes';
import itemRoutes from './routes/item.routes';
import profileRoutes from './routes/profile.routes';
import chatRoutes from './routes/chat.routes';

dotenv.config();

const app = express();

// Create HTTP Server (Required for Socket.io)
const server = http.createServer(app);

//Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

//Mount Routes
// Place these BEFORE server.listen
app.use(passport.initialize());
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1', profileRoutes); // Check if this should be /api/v1/profile
app.use('/api/v1/chat', chatRoutes);

//Database Connection
const MONGO_URI = process.env.MONGO_URI as string;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

//Initialize Socket.io
export const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("setup", (user) => {
    socket.join(user._id);
    socket.emit("connected");
  });

  socket.on("join chat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    // Safety check: if chat or participants are missing, don't crash
    if (!chat || !chat.participants) return console.log("Chat participants not defined");

    chat.participants.forEach((user: any) => {
      // Don't send the message to the person who sent it
      if (user._id === newMessageReceived.sender._id) return;

      // Send to the other person's private room
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });
});

//Start Server
//IMPORTANT: Use 'server.listen', NOT 'app.listen'
const PORT = process.env.SERVER_PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});