const crypto = require('crypto');
const twilio = require('twilio');

// In-memory OTP storage (for development)
// In production, use Redis or database
const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP with expiration (5 minutes)
const storeOTP = (phone, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phone, {
    otp,
    expiresAt,
    attempts: 0
  });
  
  // Cleanup expired OTPs
  setTimeout(() => {
    otpStore.delete(phone);
  }, 5 * 60 * 1000);
};

// Verify OTP
const verifyOTP = (phone, enteredOTP) => {
  const stored = otpStore.get(phone);
  
  if (!stored) {
    return { valid: false, message: 'OTP expired or not found' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, message: 'OTP expired' };
  }
  
  if (stored.attempts >= 3) {
    otpStore.delete(phone);
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }
  
  if (stored.otp !== enteredOTP) {
    stored.attempts++;
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // OTP is valid, remove it
  otpStore.delete(phone);
  return { valid: true };
};

// Send OTP via SMS using Twilio
const sendOTP = async (phone, otp) => {
  // Check if Twilio credentials are configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`\n========== OTP SENT (CONSOLE MODE - TWILIO NOT CONFIGURED) ==========`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`To enable SMS, configure Twilio credentials in .env file`);
    console.log(`=========================================================================\n`);
    return true;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Your SmartKhata OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`OTP sent successfully to ${phone}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP via SMS:', error);
    console.log(`\n========== OTP SENT (FALLBACK TO CONSOLE) ==========`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`===================================================\n`);
    return true; // Return true to not block the flow
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTP
};
