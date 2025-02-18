import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js"

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // { userId: socketId }
const roomUsers = {}; // { roomName: [userId1, userId2] }

// Get receiver socket ID for private messaging
export function getReceiverSocketId(userId) {
  return userSocketMap[userId] || null;
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Store user's socket ID
  socket.on("setup", (userId) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // User joins a room
  socket.on("joinRoom", ({ room, userId }) => {
    const normalizedRoom = room.toLowerCase();
    socket.join(normalizedRoom);

    if (!roomUsers[normalizedRoom]) {
      roomUsers[normalizedRoom] = [];
    }
    if (!roomUsers[normalizedRoom].includes(userId)) {
      roomUsers[normalizedRoom].push(userId);
    }

    io.to(normalizedRoom).emit("roomUsers", roomUsers[normalizedRoom]); // Send updated user list
    console.log(`User ${userId} joined room ${normalizedRoom}`);
  });

  // User leaves a room
  socket.on("leaveRoom", ({ room, userId }) => {
    const normalizedRoom = room.toLowerCase();
    socket.leave(normalizedRoom);

    if (roomUsers[normalizedRoom]) {
      roomUsers[normalizedRoom] = roomUsers[normalizedRoom].filter(
        (id) => id !== userId
      );
      io.to(normalizedRoom).emit("roomUsers", roomUsers[normalizedRoom]); // Update user list
    }
    console.log(`User ${userId} left room ${normalizedRoom}`);
  });

  // Send message to room
  socket.on("sendRoomMessage", async (msg) => {
    try {
      const normalizedRoom = msg.room.toLowerCase();
      const newMessage = new Message({
        senderId: msg.senderId,
        room: normalizedRoom,
        text: msg.text,
      });

      await newMessage.save(); // ✅ Store in DB

      io.to(normalizedRoom).emit("roomMessage", newMessage); // ✅ Emit stored message
    } catch (error) {
      console.error("Error saving room message:", error);
    }
  });

  // Send private message (one-to-one)
  socket.on("sendPrivateMessage", async (msg) => {
    try {
      const { receiverId, text, senderId } = msg;
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
      });

      await newMessage.save(); // ✅ Store in DB

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage); // Emit private message
      }
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
    const userId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      // Remove user from rooms
      Object.keys(roomUsers).forEach((room) => {
        roomUsers[room] = roomUsers[room].filter((id) => id !== userId);
        io.to(room).emit("roomUsers", roomUsers[room]);
      });
    }
  });
});

export { io, app, server };
