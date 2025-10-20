const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String,
  weight: Number,
  photos: [String],              // Filepaths
  date: String,
  time: String,
  status: { type: String, default: 'Pending' } // Pending, Scheduled, Completed, Rejected
});
module.exports = mongoose.model('Order', orderSchema);
