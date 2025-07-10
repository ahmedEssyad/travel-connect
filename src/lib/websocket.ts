import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initSocket = () => {
  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = initSocket();
  }
  return socket;
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
    };
  }, []);

  return { socket, connected };
};

export const emitNotification = (userId: string, notification: any) => {
  const socket = getSocket();
  socket.emit('notification', { userId, notification });
};

export const joinRoom = (roomId: string) => {
  const socket = getSocket();
  socket.emit('join', roomId);
};

export const leaveRoom = (roomId: string) => {
  const socket = getSocket();
  socket.emit('leave', roomId);
};