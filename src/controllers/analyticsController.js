import Earning from '../models/Earning.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js'; // Added missing import
import mongoose from 'mongoose';

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [
      directEarnings,
      indirectEarnings,
      referralStats,
      recentTransactions
    ] = await Promise.all([
      // Fixed ObjectId usage
      Earning.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), level: 1 } },
        { $group: { 
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }},
        { $sort: { "_id.year": -1, "_id.month": -1 } }
      ]),
      
      // Fixed ObjectId usage
      Earning.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), level: 2 } },
        { $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }},
        { $sort: { "_id.year": -1, "_id.month": -1 } }
      ]),
      
      User.findById(userId)
        .select('directReferrals level2Referrals')
        .populate('directReferrals', 'name email isActive totalEarnings')
        .populate('level2Referrals', 'name email isActive totalEarnings'),
      
      Transaction.find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(10)
        // .populate('earningsDistributed')
    ]);

    // Added validation for referralStats
    if (!referralStats) {
      throw new Error('User not found');
    }

    const analytics = {
      earnings: {
        direct: {
          total: directEarnings.reduce((acc, curr) => acc + curr.total, 0),
          monthly: directEarnings.map(item => ({
            year: item._id.year,
            month: item._id.month,
            total: item.total,
            count: item.count
          }))
        },
        indirect: {
          total: indirectEarnings.reduce((acc, curr) => acc + curr.total, 0),
          monthly: indirectEarnings.map(item => ({
            year: item._id.year,
            month: item._id.month,
            total: item.total,
            count: item.count
          }))
        }
      },
      referrals: {
        direct: {
          total: referralStats.directReferrals.length,
          active: referralStats.directReferrals.filter(r => r.isActive).length,
          remaining: 8 - referralStats.directReferrals.length,
          users: referralStats.directReferrals.map(r => ({
            id: r._id,
            name: r.name,
            email: r.email,
            isActive: r.isActive,
            totalEarnings: r.totalEarnings
          }))
        },
        indirect: {
          total: referralStats.level2Referrals.length,
          active: referralStats.level2Referrals.filter(r => r.isActive).length,
          users: referralStats.level2Referrals.map(r => ({
            id: r._id,
            name: r.name,
            email: r.email,
            isActive: r.isActive,
            totalEarnings: r.totalEarnings
          }))
        }
      },
      recentActivity: recentTransactions
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(error.message === 'User not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

export const getEarningsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const earnings = await Earning.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          createdAt: {
            $gte: parsedStartDate,
            $lte: parsedEndDate
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

    // Transform the data for better readability
    const formattedEarnings = earnings.map(item => ({
      date: item._id.date,
      level: item._id.level,
      totalEarnings: item.totalEarnings,
      transactionCount: item.count
    }));

    res.json({
      success: true,
      data: formattedEarnings
    });
  } catch (error) {
    console.error('Earnings Report Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};