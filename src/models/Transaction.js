import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  purchaseDetails: {
    items: [{
      name: String,
      quantity: Number,
      price: Number
    }],
    totalAmount: Number
  },
  processingStatus: {
    type: String,
    enum: ['initiated', 'processing', 'earnings_calculated', 'completed', 'failed'],
    default: 'initiated'
  },
  errorDetails: {
    code: String,
    message: String
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;