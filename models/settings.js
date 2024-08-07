 const mongoose = require('mongoose');

const levelCommissionSchema = new mongoose.Schema({
  level: Number,
  amount: Number
});

const settingsSchema = new mongoose.Schema({
  referralCommission: { type: Number, default: 50 },
  levelCommissions: [levelCommissionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
