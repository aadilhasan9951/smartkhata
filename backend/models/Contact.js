const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate contacts per user
contactSchema.index({ user_id: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);
