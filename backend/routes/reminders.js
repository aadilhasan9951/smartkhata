const express = require('express');
const router = express.Router();
const ReminderSchedule = require('../models/ReminderSchedule');
const Customer = require('../models/Customer');
const { body, validationResult } = require('express-validator');

// Get all reminder schedules for a user
router.get('/', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const schedules = await ReminderSchedule.find({ user_id: req.session.userId })
      .populate('customer_id', 'name phone balance');

    res.json({ schedules });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reminder schedule for a specific customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const schedule = await ReminderSchedule.findOne({
      user_id: req.session.userId,
      customer_id: req.params.customerId
    });

    res.json({ schedule });
  } catch (error) {
    console.error('Get customer reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update reminder schedule
router.post('/', [
  body('customer_id').notEmpty().withMessage('Customer ID is required'),
  body('frequency').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly']),
  body('day_of_week').optional().isInt({ min: 0, max: 6 }),
  body('time_of_day').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { customer_id, frequency, day_of_week, time_of_day, active } = req.body;

    // Check if customer belongs to user
    const customer = await Customer.findOne({
      _id: customer_id,
      user_id: req.session.userId
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if schedule already exists
    let schedule = await ReminderSchedule.findOne({
      user_id: req.session.userId,
      customer_id
    });

    if (schedule) {
      // Update existing schedule
      schedule.frequency = frequency || schedule.frequency;
      schedule.day_of_week = day_of_week !== undefined ? day_of_week : schedule.day_of_week;
      schedule.time_of_day = time_of_day || schedule.time_of_day;
      schedule.active = active !== undefined ? active : schedule.active;
      
      // Recalculate next_send if frequency or time changed
      if (frequency || time_of_day) {
        const { calculateNextSend } = require('../jobs/sendReminders');
        schedule.next_send = calculateNextSend(schedule);
      }
      
      await schedule.save();
    } else {
      // Create new schedule
      const { calculateNextSend } = require('../jobs/sendReminders');
      
      schedule = new ReminderSchedule({
        user_id: req.session.userId,
        customer_id,
        frequency: frequency || 'weekly',
        day_of_week: day_of_week || 1,
        time_of_day: time_of_day || '10:00',
        active: active !== undefined ? active : true,
        next_send: calculateNextSend({
          frequency: frequency || 'weekly',
          day_of_week: day_of_week || 1,
          time_of_day: time_of_day || '10:00'
        })
      });
      
      await schedule.save();
    }

    res.json({ schedule, message: 'Reminder schedule saved successfully' });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete reminder schedule
router.delete('/:scheduleId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const schedule = await ReminderSchedule.findOneAndDelete({
      _id: req.params.scheduleId,
      user_id: req.session.userId
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Reminder schedule not found' });
    }

    res.json({ message: 'Reminder schedule deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle reminder active status
router.patch('/:scheduleId/toggle', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const schedule = await ReminderSchedule.findOne({
      _id: req.params.scheduleId,
      user_id: req.session.userId
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Reminder schedule not found' });
    }

    schedule.active = !schedule.active;
    await schedule.save();

    res.json({ schedule, message: 'Reminder status updated successfully' });
  } catch (error) {
    console.error('Toggle reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
