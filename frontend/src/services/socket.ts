import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
});

socket.on('connect', () => {
  console.log('[LIFELINK Socket] Connected successfully, id:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[LIFELINK Socket] Disconnected:', reason);
});
