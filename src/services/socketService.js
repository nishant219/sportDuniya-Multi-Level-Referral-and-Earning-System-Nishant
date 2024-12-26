import { Server } from 'socket.io';
let io;

export const initializeSocket = (server) => {
  io = new Server(server);
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(userId);
    });
  });
  return io;
};

export const notifyEarnings = (userId, earning) => {
  io?.to(userId.toString()).emit('newEarning', earning);
};