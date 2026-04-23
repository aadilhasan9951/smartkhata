const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { generateOTP, storeOTP, sendOTP, verifyOTP } = require('../utils/otp');

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
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
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
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

module.exports = router;
