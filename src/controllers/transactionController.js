import Transaction from '../models/Transaction.js';
import { calculateEarnings } from '../services/earningService.js';
import { sendNotification } from '../services/notificationService.js';
import logger from '../config/logger.js';

export const createTransaction = async (req, res) => {
  try {
    const { amount, items } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum transaction amount is 1000'
      });
    }

    const transaction = new Transaction({
      user: userId,
      amount,
      purchaseDetails: {
        items: items || [],
        totalAmount: amount
      },
      status: 'pending',
      processingStatus: 'initiated'
    });

    await transaction.save();

    // Process earnings in background
    try {
      const earnings = await calculateEarnings(transaction);
      
      // Notify user of transaction completion
      await sendNotification(userId, {
        type: 'transaction_complete',
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          timestamp: transaction.createdAt
        }
      });

      // Notify referrers of their earnings
      earnings.forEach(async (earning) => {
        await sendNotification(earning.user.toString(), {
          type: 'earning_received',
          data: {
            amount: earning.amount,
            level: earning.level,
            transactionId: transaction._id,
            timestamp: earning.createdAt
          }
        });
      });

    } catch (earningError) {
      logger.error('Error calculating earnings:', earningError);
      // Don't fail the transaction, just log the error
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    logger.error('Transaction creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
};