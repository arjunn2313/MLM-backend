const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    SerialNumber: { type: String, required: true },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("District", districtSchema);
