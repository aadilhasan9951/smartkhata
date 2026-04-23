const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// All routes require authentication
router.use(authMiddleware);

// Get all customers for the logged-in user
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ user_id: req.user._id })
      .sort({ createdAt: -1 });

    // Get balance for each customer
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({ customer_id: customer._id });
        const balance = transactions.reduce((acc, t) => {
          return t.type === 'credit' ? acc + t.amount : acc - t.amount;
        }, 0);

        return {
          ...customer.toObject(),
          balance
        };
      })
    );

    res.json({ customers: customersWithBalance });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ customers: [] });
    }

    const customers = await Customer.find({
      user_id: req.user._id,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    });

    // Get balance for each customer
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({ customer_id: customer._id });
        const balance = transactions.reduce((acc, t) => {
          return t.type === 'credit' ? acc + t.amount : acc - t.amount;
        }, 0);

        return {
          ...customer.toObject(),
          balance
        };
      })
    );

    res.json({ customers: customersWithBalance });
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get balance
    const transactions = await Transaction.find({ customer_id: customer._id });
    const balance = transactions.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);

    res.json({
      ...customer.toObject(),
      balance
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new customer
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone } = req.body;

    const customer = new Customer({
      user_id: req.user._id,
      name,
      phone
    });

    await customer.save();

    res.status(201).json({
      message: 'Customer added successfully',
      customer
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { name, phone },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete all transactions for this customer
    await Transaction.deleteMany({ customer_id: req.params.id });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
