const io = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Join a test user room
  socket.emit('join', 'test-user-123');
  
  // Listen for notifications
  socket.on('notification', (notification) => {
    console.log('📩 Received notification:', notification);
  });
  
  // Send a test notification after 2 seconds
  setTimeout(() => {
    socket.emit('notification', {
      userId: 'test-user-123',
      notification: {
        type: 'match_request',
        title: 'Test Notification',
        body: 'This is a test notification',
        fromUserName: 'Test User',
        timestamp: new Date().toISOString()
      }
    });
  }, 2000);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});