const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// All routes require authentication
router.use(authMiddleware);

// Get transactions for a customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, type } = req.query;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      _id: customerId,
      user_id: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let query = { customer_id: customerId };

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add transaction (credit or debit)
router.post('/', [
  body('customer_id').notEmpty().withMessage('Customer ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, amount, type, note } = req.body;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      _id: customer_id,
      user_id: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transaction = new Transaction({
      customer_id,
      user_id: req.user._id,
      amount: parseFloat(amount),
      type,
      note: note || ''
    });

    await transaction.save();

    // Calculate new balance
    const transactions = await Transaction.find({ customer_id });
    const balance = transactions.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction,
      balance
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Recalculate balance
    const transactions = await Transaction.find({ customer_id: transaction.customer_id });
    const balance = transactions.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);

    res.json({
      message: 'Transaction deleted successfully',
      balance
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
