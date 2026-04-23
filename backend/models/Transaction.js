const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
transactionSchema.index({ customer_id: 1, date: -1 });
transactionSchema.index({ user_id: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
