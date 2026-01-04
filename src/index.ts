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

// 1. Create HTTP Server (Required for Socket.io)
const server = http.createServer(app);

// 2. Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// 3. Mount Routes
// Place these BEFORE server.listen
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1', profileRoutes); // Check if this should be /api/v1/profile
app.use('/api/v1/chat', chatRoutes);

// 4. Database Connection
const MONGO_URI = process.env.MONGO_URI as string;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// 5. Initialize Socket.io
export const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket Connected:", socket.id);

  socket.on("setup", (userData) => {
    if (userData && userData.id) {
        socket.join(userData.id);
        socket.emit("connected");
    }
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
  });
});

// 6. Start Server
// ⚠️ IMPORTANT: Use 'server.listen', NOT 'app.listen'
const PORT = process.env.SERVER_PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});