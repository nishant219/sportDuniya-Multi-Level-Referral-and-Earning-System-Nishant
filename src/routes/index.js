import express from 'express';
import {register, login, getReferralTree, getEarningStats} from '../controllers/userController.js';
import {createTransaction} from '../controllers/transactionController.js';
import {  getAnalytics, getEarningsReport   } from '../controllers/analyticsController.js';

import {auth} from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/referral-tree', auth, getReferralTree);
router.get('/earning-stats', auth, getEarningStats);

router.post('/transaction', auth, createTransaction);
router.get('/analytics', auth, getAnalytics);
router.get('/earnings-report', auth, getEarningsReport);

export default router;