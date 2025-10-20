const express = require('express');
const User = require('../models/user').default;
const otpGenerator = require('otp-generator');
// Use any SMS provider (here Twilio as sample)
const twilio = require('twilio');
const router = express.Router();

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false });
  const expiry = Date.now() + 5*60*1000; // 5 min

  let user = await User.findOneAndUpdate({ mobile }, { otp, otpExpiry: expiry }, { upsert: true, new: true });

  // TO DO: Hook your SMS provider (e.g., Twilio) here
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({ body: `Your OTP is ${otp}`, from: 'YOUR_TWILIO_NUMBER', to: '+91'+mobile });

  res.json({ message: "OTP sent", otp }); // Show OTP only in development
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  const user = await User.findOne({ mobile });
  if (user && user.otp === otp && user.otpExpiry > Date.now()) {
    return res.json({ success: true, userId: user._id });
  }
  res.status(400).json({ error: 'Invalid or expired OTP' });
});

module.exports = router;
