const io = require('socket.io-client');

console.log('Testing WebSocket connection...');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test joining a room
  socket.emit('join', 'test-user-123');
});

socket.on('joined', (data) => {
  console.log('✅ Successfully joined room:', data);
  
  // Test sending a message
  socket.emit('joinChat', 'test-chat');
  socket.emit('message', {
    chatId: 'test-chat',
    message: {
      senderId: 'test-user-123',
      text: 'Hello from test!',
      timestamp: new Date()
    }
  });
});

socket.on('message', (message) => {
  console.log('✅ Received message:', message);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Close after 3 seconds
setTimeout(() => {
  console.log('🔚 Closing test connection');
  socket.close();
  process.exit(0);
}, 3000);