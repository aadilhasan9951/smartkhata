const cron = require('node-cron');
const ReminderSchedule = require('../models/ReminderSchedule');
const Customer = require('../models/Customer');

// The reminder sending is now handled by the Android app
// This job just marks reminders as due for the Android app to pick up
const sendRemindersJob = async () => {
  console.log('🔄 Running reminder check job...');
  
  try {
    const schedules = await ReminderSchedule.find({ active: true });
    
    for (const schedule of schedules) {
      const now = new Date();
      const nextSend = new Date(schedule.next_send);
      
      // If next_send time has passed, mark it as due
      if (now >= nextSend) {
        try {
          const customer = await Customer.findById(schedule.customer_id);
          if (!customer || customer.balance <= 0) {
            schedule.active = false;
            await schedule.save();
            continue;
          }
          
          // Calculate next send date
          const { calculateNextSend } = require('./sendReminders');
          schedule.last_sent = new Date();
          schedule.next_send = calculateNextSend(schedule);
          await schedule.save();
          
          console.log(`✅ Reminder marked as due for ${customer.name} (${customer.phone})`);
        } catch (error) {
          console.error(`❌ Failed to update reminder schedule ${schedule._id}:`, error);
        }
      }
    }
    
    console.log('✅ Reminder check job completed');
  } catch (error) {
    console.error('❌ Error in reminder job:', error);
  }
};

// Calculate next send date based on frequency
const calculateNextSend = (schedule) => {
  const now = new Date();
  const [hours, minutes] = schedule.time_of_day.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  // If the time today has already passed, move to next occurrence
  if (nextDate <= now) {
    switch (schedule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 - nextDate.getDay() + schedule.day_of_week) % 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
  }
  
  return nextDate;
};

// Start the cron job (runs every hour)
const startReminderScheduler = () => {
  console.log('🚀 Starting reminder scheduler...');
  
  // Run every hour to check for due reminders
  cron.schedule('0 * * * *', sendRemindersJob);
  
  // Also run immediately on startup
  sendRemindersJob();
};

module.exports = {
  startReminderScheduler,
  sendRemindersJob,
  calculateNextSend
};
