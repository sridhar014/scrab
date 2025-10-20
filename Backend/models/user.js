import { Schema, model } from 'mongoose';
const userSchema = new Schema({
  mobile: { type: String, required: true, unique: true },
  otp: String,            // Last sent OTP
  otpExpiry: Date         // Expiry time for OTP
});
export default model('User', userSchema);
