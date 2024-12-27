import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
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