import { io, Socket } from 'socket.io-client';

let serverSocket: Socket | null = null;

export const getServerSocket = () => {
  if (!serverSocket) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    serverSocket = io(wsUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    serverSocket.on('connect', () => {
      console.log('🔌 Server WebSocket connected');
    });

    serverSocket.on('disconnect', () => {
      console.log('🔌 Server WebSocket disconnected');
    });

    serverSocket.on('error', (error) => {
      console.error('🔌 Server WebSocket error:', error);
    });
  }
  return serverSocket;
};

export const sendNotificationToUser = (userId: string, notification: any) => {
  const socket = getServerSocket();
  if (socket && socket.connected) {
    socket.emit('notification', { userId, notification });
    console.log('📤 Notification sent to user:', userId);
    return true;
  } else {
    console.error('❌ WebSocket not connected, cannot send notification');
    return false;
  }
};