 const mongoose = require('mongoose');

const levelCommissionSchema = new mongoose.Schema({
  level: Number,
  amount: Number
});

const settingsSchema = new mongoose.Schema({
  joiningFee: { type: Number},
  levelCommissions: [levelCommissionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
