const mongoose = require("mongoose");

const districtHeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    districtName: { type: String, required: true },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    parentName: { type: String, required: true },
    relation: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    whatsAppNumber: { type: String, required: true },
    occupation: { type: String, required: true },
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
    branchName: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    applicantPhoto: { type: String, required: true },
    headCreatedDate: { type: Date, default: Date.now },
    isUserAccount: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

const DistrictHeadRegistration = mongoose.model(
  "DistrictHead",
  districtHeadSchema
);

module.exports = DistrictHeadRegistration;
