import Earning from '../models/Earning.js';
import User from '../models/User.js';

export const calculateEarnings = async (transaction) => {
    const user = await User.findById(transaction.user)
      .populate({
        path: 'referredBy',
        populate: { path: 'referredBy' }
      });
    
    if (user.referredBy) {
      const level1Earning = new Earning({
        user: user.referredBy._id,
        transaction: transaction._id,
        amount: transaction.amount * 0.05,
        level: 1
      });
      await level1Earning.save();
      await User.findByIdAndUpdate(user.referredBy._id, {
        $inc: { totalEarnings: level1Earning.amount }
      });
      notifyEarnings(user.referredBy._id, level1Earning);
  
      if (user.referredBy.referredBy) {
        const level2Earning = new Earning({
          user: user.referredBy.referredBy._id,
          transaction: transaction._id,
          amount: transaction.amount * 0.01,
          level: 2
        });
        await level2Earning.save();
        await User.findByIdAndUpdate(user.referredBy.referredBy._id, {
          $inc: { totalEarnings: level2Earning.amount }
        });
        notifyEarnings(user.referredBy.referredBy._id, level2Earning);
      }
    }
  };