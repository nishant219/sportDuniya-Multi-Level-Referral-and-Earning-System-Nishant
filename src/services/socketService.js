import { Server } from 'socket.io';
import logger from '../config/logger.js';

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join', async (userId) => {
      if (!userId) {
        logger.warn('Join attempt without userId');
        return;
      }
      
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined their room`);
      
      // Send initial connection status
      socket.emit('connection_status', {
        status: 'connected',
        timestamp: new Date()
      });
    });

    socket.on('leave', (userId) => {
      if (userId) {
        socket.leave(`user_${userId}`);
        logger.info(`User ${userId} left their room`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const notifyEarnings = async (userId, earning) => {
  try {
    const io = getIO();
    
    const notificationData = {
      type: 'earning_update',
      data: {
        amount: earning.amount,
        level: earning.level,
        timestamp: earning.createdAt,
        transactionId: earning.transaction
      }
    };

    await io.to(`user_${userId}`).emit('notification', notificationData);
    logger.info(`Earning notification sent to user ${userId}`);
    
    return true;
  } catch (error) {
    logger.error(`Error sending earning notification: ${error.message}`);
    return false;
  }
};