import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // `user` will store the user who initiated the transaction.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // `amount` will store the amount of the transaction.
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  //status will store the status of the transaction.
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