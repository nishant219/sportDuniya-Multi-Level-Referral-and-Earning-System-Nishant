import express from 'express';
import { register, login } from '../controllers/userController.js';
import { createTransaction } from '../controllers/transactionController.js';
import { getReferralTree, getEarningStats } from '../controllers/referralController.js';
import { getAnalytics, getEarningsReport } from '../controllers/analyticsController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Referral Routes
router.get('/referrals/tree', auth, getReferralTree);
router.get('/referrals/earnings', auth, getEarningStats);

// Transaction Routes
router.post('/transactions', auth, createTransaction);

// Analytics Routes
router.get('/analytics', auth, getAnalytics);
router.get('/analytics/earnings-report', auth, getEarningsReport);

export default router;