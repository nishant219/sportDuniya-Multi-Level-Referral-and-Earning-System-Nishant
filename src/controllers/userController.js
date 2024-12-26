import User from '../models/User.js';  
import bcrypt from 'bcryptjs';  
import jwt from 'jsonwebtoken';
import Earning from '../models/Earning.js';  
import { sendNotification } from '../services/notificationService.js';
import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { email, name, password, referralCode } = req?.body;
    
    // Input validation
    if (!email || !name || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    if (password.length < 4 || password.length > 12) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be between 4 and 12 characters' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Handle referral
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      
      if (referrer) {
        if (referrer.directReferrals.length >= 8) {
          return res.status(400).json({
            success: false,
            message: 'Referrer has reached maximum referrals limit'
          });
        }

        // Check if referrer is active
        if (!referrer.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid referral code'
          });
        }
      }
    }

    // Create new user
    const user = new User({
      email,
      name,
      password,
      referredBy: referrer?._id || null,
      isActive: true
    });

    await user.save();

    // Update referrer's referrals
    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $push: { directReferrals: user._id }
      });

      // If referrer has a parent, update level2Referrals
      if (referrer.referredBy) {
        await User.findByIdAndUpdate(referrer.referredBy, {
          $push: { level2Referrals: user._id }
        });
      }

      // Notify referrer
      await sendNotification(referrer._id, {
        type: 'new_referral',
        data: {
          referralName: user.name,
          timestamp: new Date()
        }
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          referralCode: user.referralCode
        },
        token
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email })
      .select('+password')
      .populate('directReferrals', 'name email isActive')
      .populate('level2Referrals', 'name email isActive');

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    // Remove password from response
    user.password = undefined;
    // console.log(user);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          referralCode: user?.referralCode,
          // totalEarnings: user?.totalEarnings,
          // referralCount: user?.referralCount,
          // directReferrals: user?.directReferrals,
          // level2Referrals: user?.level2Referrals
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// export const getReferralTree = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate({
//         path: 'directReferrals',
//         populate: { path: 'directReferrals' }
//       });
//     res.status(200).json({ message: 'Referral tree fetched successfully', user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode, totalEarnings: user.totalEarnings, referralCount: user?.referralCount, directReferrals: user.directReferrals } });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const getEarningStats = async (req, res) => {
//   try {
//     const earnings = await Earning.aggregate([
//       { $match: { user: req.user.id } },
//       { $group: {
//         _id: '$level',
//         total: { $sum: '$amount' },
//         count: { $sum: 1 }
//       }}
//     ]);
//     res.status(200).json({ message: 'Earning stats fetched successfully', earnings });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };