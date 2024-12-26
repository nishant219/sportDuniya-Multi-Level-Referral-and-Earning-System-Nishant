import Earning from '../models/Earning.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const calculateEarnings = async (transaction) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findById(transaction.user)
      .populate({
        path: 'referredBy',
        populate: {
          path: 'referredBy',
          select: 'isActive'
        }
      });

    if (!user || !user.isActive) {
      throw new Error('Invalid or inactive user');
    }

    const earnings = [];

    if (user.referredBy && user.referredBy.isActive) {
      // Level 1 earnings
      const level1Amount = transaction.amount * 0.05;
      const level1Earning = new Earning({
        user: user.referredBy._id,
        transaction: transaction._id,
        amount: level1Amount,
        level: 1
      });
      
      await level1Earning.save({ session });
      await User.findByIdAndUpdate(
        user.referredBy._id,
        {
          $inc: { totalEarnings: level1Amount },
          $push: {
            notifications: {
              type: 'earning',
              message: `You earned ${level1Amount} from your direct referral's purchase`
            }
          }
        },
        { session }
      );
      
      notifyEarnings(user.referredBy._id, level1Earning);
      earnings.push(level1Earning);

      // Level 2 earnings
      if (user.referredBy.referredBy && user.referredBy.referredBy.isActive) {
        const level2Amount = transaction.amount * 0.01;
        const level2Earning = new Earning({
          user: user.referredBy.referredBy._id,
          transaction: transaction._id,
          amount: level2Amount,
          level: 2
        });

        await level2Earning.save({ session });
        await User.findByIdAndUpdate(
          user.referredBy.referredBy._id,
          {
            $inc: { totalEarnings: level2Amount },
            $push: {
              notifications: {
                type: 'earning',
                message: `You earned ${level2Amount} from your indirect referral's purchase`
              }
            }
          },
          { session }
        );

        notifyEarnings(user.referredBy.referredBy._id, level2Earning);
        earnings.push(level2Earning);
      }
    }

    // Update transaction status
    await Transaction.findByIdAndUpdate(
      transaction._id,
      { 
        processingStatus: 'earnings_calculated',
        $set: { 'earningsDistributed': earnings.map(e => e._id) }
      },
      { session }
    );

    await session.commitTransaction();
    return earnings;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};