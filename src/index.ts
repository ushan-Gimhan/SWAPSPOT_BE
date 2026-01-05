import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

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
  console.log("Socket connected:", socket.id);

  socket.on("setup", (user) => {
    socket.join(user._id);
    socket.emit("connected");
  });

  socket.on("join chat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
});

//Start Server
//IMPORTANT: Use 'server.listen', NOT 'app.listen'
const PORT = process.env.SERVER_PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});