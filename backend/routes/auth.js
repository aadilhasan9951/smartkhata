const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { generateOTP, storeOTP, sendOTP, verifyOTP } = require('../utils/otp');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SESSION_SECRET || 'smartkhata-secret';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Send OTP to phone number
router.post('/send-otp', [
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(phone, otp);

    // Send OTP
    await sendOTP(phone, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP and login/register
router.post('/verify-otp', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, otp, name } = req.body;

    // Verify OTP
    const verification = verifyOTP(phone, otp);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    // Clear any existing session to ensure fresh login
    if (req.session.userId) {
      req.session.destroy(() => {
        // Continue with new login after session is destroyed
      });
    }

    // Regenerate session ID for security
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err);
        return res.status(500).json({ error: 'Session error' });
      }

      // Check if user exists
      User.findOne({ phone }).then(user => {
        if (user) {
          // Login existing user
          req.session.userId = user._id;
          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ error: 'Session error' });
            }
            res.json({
              message: 'Login successful',
              user: {
                id: user._id,
                name: user.name,
                phone: user.phone
              }
            });
          });
        } else {
          // Register new user
          if (!name) {
            return res.status(400).json({ error: 'Name is required for new users' });
          }

          const newUser = new User({ phone, name });
          newUser.save().then(savedUser => {
            req.session.userId = savedUser._id;
            req.session.save((err) => {
              if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
              }
              res.status(201).json({
                message: 'Registration successful',
                user: {
                  id: savedUser._id,
                  name: savedUser.name,
                  phone: savedUser.phone
                }
              });
            });
          }).catch(err => {
            console.error('User save error:', err);
            res.status(500).json({ error: 'Server error' });
          });
        }
      }).catch(err => {
        console.error('User find error:', err);
        res.status(500).json({ error: 'Server error' });
      });
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Legacy login endpoint (without OTP) - kept for backward compatibility
router.post('/login', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, name } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    
    if (user) {
      // Login existing user
      const token = generateToken(user._id);
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone
        }
      });
    } else {
      // Register new user
      if (!name) {
        return res.status(400).json({ error: 'Name is required for new users' });
      }

      const newUser = new User({ phone, name });
      const savedUser = await newUser.save();
      const token = generateToken(savedUser._id);
      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          phone: savedUser.phone
        }
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logout successful' });
});

module.exports = router;
