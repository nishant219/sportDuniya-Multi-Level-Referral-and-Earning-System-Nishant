import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; 

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  referralCode: {
    type: String,
    unique: true,
    index: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  directReferrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

userSchema.virtual('referralCount').get(function() {
  return this.directReferrals.length;
});

const User = mongoose.model('User', userSchema);
export default User;