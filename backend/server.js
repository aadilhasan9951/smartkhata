require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://smartkhata-woad.vercel.app',
    'https://smartkhata-ltjcfezg5-aadilhasan9951s-projects.vercel.app',
    'https://smartkhata-r934q9gw0-aadilhasan9951s-projects.vercel.app',
    'https://smartkhata-mnwgc9z6j-aadilhasan9951s-projects.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'smartkhata-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartkhata')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/backup', require('./routes/backup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartKhata API is running' });
});

// Start reminder scheduler
const { startReminderScheduler } = require('./jobs/sendReminders');
startReminderScheduler();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
