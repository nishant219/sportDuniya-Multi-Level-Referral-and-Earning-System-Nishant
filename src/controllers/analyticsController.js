
import Earning from '../models/Earning.js';
import User from '../models/User.js';

export const getAnalytics = async (req, res) => {
    try {
      const [directEarnings, indirectEarnings, referralCount] = await Promise.all([
        Earning.aggregate([
          { $match: { user: req.user.id, level: 1 } },
          { $group: { _id: null, total: { $sum: '$amount' } }}
        ]),
        Earning.aggregate([
          { $match: { user: req.user.id, level: 2 } },
          { $group: { _id: null, total: { $sum: '$amount' } }}
        ]),
        User.findById(req.user.id).select('directReferrals').populate('directReferrals')
      ]);
  
      res.json({
        directEarnings: directEarnings[0]?.total || 0,
        indirectEarnings: indirectEarnings[0]?.total || 0,
        referralCount: referralCount.directReferrals.length,
        remainingSlots: 8 - referralCount.directReferrals.length
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  export const getEarningsReport = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const earnings = await Earning.aggregate([
        {
          $match: {
            user: req.user.id,
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $lookup: {
            from: 'transactions',
            localField: 'transaction',
            foreignField: '_id',
            as: 'transactionDetails'
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              level: '$level'
            },
            totalEarnings: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);
  
      res.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  };
  