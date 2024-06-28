const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
  memberId: { type: String, required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Registration", required: true },
});

const registrationSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  parentName: { type: String, required: true },
  relation: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  maritalStatus: { type: String, enum: ["Single", "Married", "Other"], required: true },
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
  sponsorId: { type: String, required: true },
  sponsorName: { type: String, required: true },
  sponsorPlacementLevel: { type: Number, required: true },
  applicantPlacementLevel: { type: Number, required: true },
  joiningFee: { type: Number, required: true },
  applicantPhoto: { type: String, required: true },
  applicantSign: { type: String, required: true },
  sponsorSign: { type: String, required: true },
  children: [childSchema],  
  memberCreatedDate: { type: Date, default: Date.now },  
  status: { type: String, enum: ["Approved", "Un Approved"], default: "Un Approved", required: true },  
  payment: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid", required: true },  
  paymentMode: { type: String, 
    // required: true 
  }, // Added field
}, { timestamps: true });

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;

