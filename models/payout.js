const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  accountDetails: {
    name: { type: String, required: true },
    ifsc: { type: String, required: true },
    account_number: { type: String, required: true },
  },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payout', PayoutSchema);
