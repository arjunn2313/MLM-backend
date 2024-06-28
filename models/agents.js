const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
  memberId: { type: String, required: true },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    required: true,
  },
});

const agentSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    treeName: { type: String, required: true },
    sectionId: { type: String, required: true },
    parentName: { type: String, required: true },
    relation: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Other"],
      required: true,
    },
    panNumber: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    nameOfNominee: { type: String, required: true },
    relationshipWithNominee: { type: String, required: true },
    sponsorId: { type: String },
    sponsorName: { type: String },
    sponsorPlacementLevel: { type: Number },
    applicantPlacementLevel: { type: Number },
    joiningFee: { type: Number, required: true },
    applicantPhoto: { type: String,  },
    applicantSign: { type: String,   },
    sponsorSign: { type: String },
    children: [childSchema],
    memberCreatedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Approved", "Un Approved"],
      default: "Un Approved",
      required: true,
    },
    payment: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
      required: true,
    },
    paymentMode: {
      type: String,
      // required: true
    },
    isHead: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

const AgentRegistration = mongoose.model("Agent", agentSchema);

module.exports = AgentRegistration;
