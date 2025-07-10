import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    console.log('Creating WebSocket connection to:', wsUrl);
    
    const socketInstance = io(wsUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: true // Create a fresh connection
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected! Socket ID:', socketInstance.id);
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err);
      setError(`Failed to connect: ${err.message}`);
      setConnected(false);
    });

    socketInstance.on('joined', (data) => {
      console.log('✅ Successfully joined room:', data);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []); // Empty dependency array - only run once

  return { socket, connected, error };
};

// Helper functions for direct socket usage
let globalSocket: Socket | null = null;

export const getSocket = () => {
  if (!globalSocket && typeof window !== 'undefined') {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    globalSocket = io(wsUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true
    });
  }
  return globalSocket;
};

export const emitNotification = (userId: string, notification: any) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('notification', { userId, notification });
  }
};

export const joinRoom = (roomId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('join', roomId);
  }
};

export const leaveRoom = (roomId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('leave', roomId);
  }
};