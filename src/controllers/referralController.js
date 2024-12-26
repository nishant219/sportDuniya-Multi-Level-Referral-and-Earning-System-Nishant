import User from '../models/User.js';
import Earning from '../models/Earning.js';
import logger from '../config/logger.js';

export const getReferralTree = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'directReferrals',
        select: 'name email isActive totalEarnings referralCode directReferrals',
        populate: {
          path: 'directReferrals',
          select: 'name email isActive totalEarnings'
        }
      })
      .populate({
        path: 'level2Referrals',
        select: 'name email isActive totalEarnings referralCode'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const referralTree = {
      level1: user.directReferrals.map(referral => ({
        id: referral._id,
        name: referral.name,
        email: referral.email,
        isActive: referral.isActive,
        totalEarnings: referral.totalEarnings,
        referralCode: referral.referralCode,
        // referralCount: referral.directReferrals.length
      })),
      level2: user.level2Referrals.map(referral => ({
        id: referral._id,
        name: referral.name,
        email: referral.email,
        isActive: referral.isActive,
        totalEarnings: referral.totalEarnings,
        referralCode: referral.referralCode
      }))
    };

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        remainingSlots: 8 - user.directReferrals.length,
        referralTree
      }
    });

  } catch (error) {
    logger.error('Error fetching referral tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral tree',
      error: error.message
    });
  }
};

export const getEarningStats = async (req, res) => {
  try {
    const [directEarnings, indirectEarnings, monthlyStats] = await Promise.all([
      Earning.aggregate([
        { 
          $match: { 
            user: req.user.id, 
            level: 1
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      Earning.aggregate([
        {
          $match: {
            user: req.user.id,
            level: 2
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      Earning.aggregate([
        {
          $match: {
            user: req.user.id
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              level: '$level'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': -1,
            '_id.month': -1
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        directEarnings: {
          total: directEarnings[0]?.total || 0,
          count: directEarnings[0]?.count || 0
        },
        indirectEarnings: {
          total: indirectEarnings[0]?.total || 0,
          count: indirectEarnings[0]?.count || 0
        },
        monthlyStats: monthlyStats.reduce((acc, stat) => {
          const key = `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`;
          if (!acc[key]) {
            acc[key] = { direct: 0, indirect: 0 };
          }
          if (stat._id.level === 1) {
            acc[key].direct = stat.total;
          } else {
            acc[key].indirect = stat.total;
          }
          return acc;
        }, {})
      }
    });

  } catch (error) {
    logger.error('Error fetching earning stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earning statistics',
      error: error.message
    });
  }
};