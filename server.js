const { createServer } = require('http');
const { Server } = require('socket.io');

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const userSockets = new Map(); // Map to store user ID to socket ID

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their Firebase UID
  socket.on('join', (userId) => {
    if (!userId) {
      console.log('Join attempted without userId');
      return;
    }
    userSockets.set(userId, socket.id);
    socket.join(userId);
    socket.userId = userId; // Store userId on socket for cleanup
    console.log(`User ${userId} joined room`);
    
    // Send confirmation back to client
    socket.emit('joined', { userId, socketId: socket.id });
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
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    
    // Remove user from userSockets map
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`Removed user ${socket.userId} from userSockets`);
    } else {
      // Fallback cleanup
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`Fallback: Removed user ${userId} from userSockets`);
          break;
        }
      }
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});