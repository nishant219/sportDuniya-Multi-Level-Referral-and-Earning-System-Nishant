import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  // `user` will store the user who earned the amount.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // `transaction` will store the transaction that resulted in the
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  // `amount` will store the amount earned by the user.
  amount: {
    type: Number,
    required: true
  },
  // `level` will store the level of the referral program at which the user earned the amount.
  level: {
    type: Number,
    required: true,
    enum: [1, 2]
  }
}, {
  timestamps: true
});

const Earning = mongoose.model('Earning', earningSchema);
export default Earning;