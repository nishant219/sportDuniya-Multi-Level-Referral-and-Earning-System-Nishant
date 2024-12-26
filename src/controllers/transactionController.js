import Transaction from '../models/Transaction.js';
import Earning from '../models/Earning.js';
import { calculateEarnings } from '../services/earningService.js';

export const createTransaction = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (amount < 1000) {
      return res.status(400).json({ message: 'Minimum transaction amount is 1000' });
    }

    const transaction = new Transaction({
      user: userId,
      amount,
      status: 'completed'
    });

    await transaction.save();
    await calculateEarnings(transaction);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

