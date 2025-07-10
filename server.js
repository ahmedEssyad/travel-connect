const { createServer } = require('http');
const { Server } = require('socket.io');

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const userSockets = new Map(); // Map to store user ID to socket ID

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their Firebase UID
  socket.on('join', (userId) => {
    userSockets.set(userId, socket.id);
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle notifications
  socket.on('notification', ({ userId, notification }) => {
    const targetSocketId = userSockets.get(userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('notification', notification);
      console.log(`Notification sent to user ${userId}`);
    }
  });

  // Handle messages
  socket.on('message', ({ chatId, message }) => {
    socket.to(chatId).emit('message', message);
    console.log(`Message sent to chat ${chatId}`);
  });

  // Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
    console.log(`User left chat ${chatId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from userSockets map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});