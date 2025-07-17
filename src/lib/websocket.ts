import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if WebSocket is enabled
    const wsEnabled = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';
    if (!wsEnabled) {
      console.log('WebSocket disabled, skipping connection');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    try {
      const socketInstance = io(wsUrl, {
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 5000, // Reduced timeout
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 3, // Reduced attempts
        autoConnect: true,
        forceNew: false // Don't force new connection
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
        console.warn('⚠️ WebSocket connection failed (this is normal if no WebSocket server):', err.message);
        setError(`WebSocket unavailable: ${err.message}`);
        setConnected(false);
        // Don't retry aggressively to avoid console spam
        socketInstance.disconnect();
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
    } catch (err) {
      console.warn('WebSocket initialization failed:', err);
      setError('WebSocket not available');
    }
  }, []); // Empty dependency array - only run once

  return { socket, connected, error };
};

// Helper functions for direct socket usage
let globalSocket: Socket | null = null;

export const getSocket = () => {
  // Check if WebSocket is enabled
  const wsEnabled = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';
  if (!wsEnabled || typeof window === 'undefined') {
    return null;
  }

  if (!globalSocket) {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      globalSocket = io(wsUrl, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        timeout: 5000,
        reconnectionAttempts: 2
      });
      
      globalSocket.on('connect_error', (err) => {
        console.warn('Global socket connection failed:', err.message);
        globalSocket = null;
      });
    } catch (err) {
      console.warn('Failed to create global socket:', err);
      return null;
    }
  }
  return globalSocket;
};

export const emitNotification = (userId: string, notification: any) => {
  try {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('notification', { userId, notification });
    }
  } catch (err) {
    console.warn('Failed to emit notification:', err);
  }
};

export const joinRoom = (roomId: string) => {
  try {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('join', roomId);
    }
  } catch (err) {
    console.warn('Failed to join room:', err);
  }
};

export const leaveRoom = (roomId: string) => {
  try {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('leave', roomId);
    }
  } catch (err) {
    console.warn('Failed to leave room:', err);
  }
};