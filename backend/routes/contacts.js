const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// All routes require authentication
router.use(authMiddleware);

// Sync contacts from Android app
router.post('/sync', [
  body('contacts').isArray().withMessage('Contacts must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contacts } = req.body;
    const userId = req.user._id;

    // Clear existing contacts for this user
    await Contact.deleteMany({ user_id: userId });

    // Insert new contacts
    const contactsToInsert = contacts.map(contact => ({
      user_id: userId,
      name: contact.name || '',
      phone: contact.phone || ''
    }));

    await Contact.insertMany(contactsToInsert);

    res.json({
      message: 'Contacts synced successfully',
      count: contactsToInsert.length
    });
  } catch (error) {
    console.error('Sync contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all contacts for the user
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find({ user_id: req.user._id })
      .sort({ name: 1 });

    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete all contacts for the user
router.delete('/', async (req, res) => {
  try {
    await Contact.deleteMany({ user_id: req.user._id });

    res.json({ message: 'All contacts deleted successfully' });
  } catch (error) {
    console.error('Delete contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
