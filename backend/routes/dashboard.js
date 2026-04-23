const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total customers
    const totalCustomers = await Customer.countDocuments({ user_id: userId });

    // Get all transactions for the user
    const transactions = await Transaction.find({ user_id: userId });

    // Calculate total outstanding (credit - debit)
    const totalOutstanding = transactions.reduce((acc, t) => {
      return t.type === 'credit' ? acc + t.amount : acc - t.amount;
    }, 0);

    // Calculate total collected (total debit)
    const totalCollected = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);

    // Get today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= today && transactionDate < tomorrow;
    });

    const todayCredit = todayTransactions
      .filter(t => t.type === 'credit')
      .reduce((acc, t) => acc + t.amount, 0);

    const todayDebit = todayTransactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);

    // Get customers with outstanding balance
    const customers = await Customer.find({ user_id: userId });
    const customersWithOutstanding = [];

    for (const customer of customers) {
      const customerTransactions = await Transaction.find({ customer_id: customer._id });
      const balance = customerTransactions.reduce((acc, t) => {
        return t.type === 'credit' ? acc + t.amount : acc - t.amount;
      }, 0);

      if (balance > 0) {
        customersWithOutstanding.push({
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          balance
        });
      }
    }

    // Sort by balance (highest first)
    customersWithOutstanding.sort((a, b) => b.balance - a.balance);

    res.json({
      totalCustomers,
      totalOutstanding,
      totalCollected,
      todaySummary: {
        credit: todayCredit,
        debit: todayDebit,
        transactions: todayTransactions.length
      },
      customersWithOutstanding: customersWithOutstanding.slice(0, 10) // Top 10
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
