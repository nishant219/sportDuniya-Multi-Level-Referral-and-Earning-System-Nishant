import { getIO } from './socketService.js';
import logger from '../config/logger.js';

export const sendNotification = async (userId, notification) => {
  try {
    const io = getIO();
    
    await io.to(`user_${userId}`).emit('notification', {
      type: notification.type,
      data: notification.data,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    logger.error(`Error sending notification: ${error.message}`);
    return false;
  }
};