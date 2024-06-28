const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    treeName: { type: String, required: true, unique: true },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    sectionId: { type: String, required: true },
    headName: {
      type: String,
      required: true,
    },
    levels: {
      type: Number,
      required: true,
      default: 0,
    },
    levelsCompleted: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMembers: {
      type: Number,
      required: true,
      default: 0,
    },
    memberId: {
      type: String,
      required: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Section", sectionSchema);
