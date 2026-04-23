const mongoose = require('mongoose');

const reminderScheduleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    default: 'weekly'
  },
  day_of_week: {
    type: Number,
    min: 0,
    max: 6, // 0 = Sunday, 6 = Saturday
    default: 1 // Monday
  },
  time_of_day: {
    type: String,
    default: '10:00' // HH:MM format
  },
  last_sent: {
    type: Date
  },
  next_send: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reminderScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ReminderSchedule', reminderScheduleSchema);
