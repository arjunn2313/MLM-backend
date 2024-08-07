const Agent = require("../models/agents");
const otpGenerator = require("otp-generator");
const UserAccount = require("../models/login");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../utils/jwt");

// phoneNumber verification

const mobileVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const { context } = req.query;

    const isMember = await Agent.findOne({ phoneNumber });

    if (!isMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    switch (context) {
      case "create":
        if (isMember.isUserAccount) {
          return res
            .status(400)
            .json({ message: "User account found. Please log in." });
        } else {
          return res.status(200).json({ message: "User verified." });
        }

      case "login":
        if (isMember.isUserAccount) {
          return res.status(200).json({ message: "User verified." });
        } else {
          return res.status(404).json({
            message: "User account not found. Please create account.",
          });
        }

      default:
        return res.status(400).json({ message: "Invalid context" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching sections" });
  }
};

//  Create acount
const createAccount = async (req, res) => {
  try {
    const { phoneNumber, fullName, email, password } = req.body;

    if (!phoneNumber || !fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isMember = await Agent.findOne({
      phoneNumber,
      isUserAccount: false,
    });

    console.log(isMember);

    if (!isMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    const existingUser = await UserAccount.findOne({
      phoneNumber,
      isVerified: false,
    });

    if (existingUser) {
      // Generate new OTP and update existing account
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
      });

      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.fullName = fullName;
      existingUser.email = email;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = Date.now() + 1800000; // 30 minutes
      await existingUser.save();

      return res
        .status(200)
        .json({ message: "OTP sent successfully", otp: otp });
    }

    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserAccount({
      phoneNumber,
      fullName,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 1800000,
      isVerified: false,
      registrationId: isMember._id,
      role: isMember.isHead ? "head" : "agent",
    });

    await user.save();

    res.status(201).json({ message: "OTP sent successfully", otp: otp });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching sections" });
  }
};

// Validate OTP
const validateOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const user = await UserAccount.findOne({
      phoneNumber,
      otp,
      otpExpiry: { $gt: Date.now() },
      isVerified: false,
    });

    const agent = await Agent.findOne({
      phoneNumber,
      isUserAccount: false,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or OTP expired" });
    }

    if (!agent) {
      return res
        .status(400)
        .json({ message: "Registration details not found" });
    }

    user.isVerified = true;
    user.role = agent.isHead ? "head" : "agent";
    user.registrationId = agent._id;

    await user.save();

    agent.isUserAccount = true;
    agent.loginAccount = user._id;

    await agent.save(); // Save the updated agent information

    res.status(200).json({ message: "OTP validated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error validating OTP" });
  }
};

// login by password
const loginReqByPass = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await UserAccount.findOne({ phoneNumber, isVerified: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: "Error fetching sections" });
  }
};

// login req otp
const logReqByOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await UserAccount.findOne({ phoneNumber, isVerified: true });

    console.log(phoneNumber);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    user.otp = otp;
    user.otpExpiry = Date.now() + 1800000;

    await user.save();
    res.status(201).json({ message: "OTP sent successfully", otp: otp });
  } catch (error) {
    res.status(500).json({ error: "Error fetching sections" });
  }
};

// validate otp and login
const validateAndLogin = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    console.log(phoneNumber);
    const user = await UserAccount.findOne({
      phoneNumber,
      otp,
      otpExpiry: { $gt: Date.now() },
      isVerified: true,
    });

    if (!user) {
      return res.status(404).json({ message: "Invalid OTP" });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: "Error fetching sections" });
  }
};

// Generate OTP for password reset
const forgotPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const user = await UserAccount.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    user.otp = otp;
    user.otpExpiry = Date.now() + 1800000;
    await user.save();

    res.status(200).json({ message: "OTP sent successfully", otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating OTP" });
  }
};

// Validate OTP and reset password
const resetPassword = async (req, res) => {
  try {
    const { phoneNumber, otp, newPassword } = req.body;

    const user = await UserAccount.findOne({
      phoneNumber,
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error resetting password" });
  }
};

module.exports = {
  mobileVerification,
  createAccount,
  validateOTP,
  loginReqByPass,
  logReqByOtp,
  validateAndLogin,
  forgotPassword,
  resetPassword,
};
