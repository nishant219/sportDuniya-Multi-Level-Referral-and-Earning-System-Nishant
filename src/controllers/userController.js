import User from '../models/User.js';  
import bcrypt from 'bcryptjs';  
import jwt from 'jsonwebtoken';
import Earning from '../models/Earning.js';  
import { notifyEarnings } from '../services/socketService.js'; 

const CONSTANTS = {
  MAX_DIRECT_REFERRALS: 8,
  MIN_TRANSACTION_AMOUNT: 1000,
  DIRECT_REFERRAL_PERCENTAGE: 0.05,  // 5%
  INDIRECT_REFERRAL_PERCENTAGE: 0.01, // 1%
};


export const register = async (req, res) => {
  try {
    const { email, name, password, referralCode } = req?.body;
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (password.length < 4 || password.length > 12) {
      return res.status(400).json({ message: 'Password must be between 4 and 12 characters' });
    }
    
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      // if (!referrer) {
      //   return res.status(400).json({ message: 'Invalid referral code' });
      // }
      if (referrer && referrer.directReferrals.length >= 8) {
        return res.status(400).json({ message: 'Referrer has reached maximum referrals' });
      }
    }

    const user = new User({
      email,
      name,
      password,
      referredBy: referrer ? referrer?._id : null
    });

    await user.save();

    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $push: { directReferrals: user._id } // Add user to referrer's direct referrals
      });
    }

    res.status(201).json({ message: 'User registered successfully', user, referralCode: user.referralCode });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ message: 'User loggedIn successfully', token, user: { id: user._id, name: user.name, email: user.email, referralCode: user.referralCode, totalEarnings: user.totalEarnings, referralCount: user?.referralCount } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getReferralTree = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'directReferrals',
        populate: { path: 'directReferrals' }
      });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getEarningStats = async (req, res) => {
  try {
    const earnings = await Earning.aggregate([
      { $match: { user: req.user.id } },
      { $group: {
        _id: '$level',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);
    res.json(earnings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};