const Admin = require("../../models/Admin");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../../utils/jwt");

const createAdmin = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      fullName,
      phoneNumber,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const accessToken = generateAccessToken(admin);

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createAdmin, adminLogin };
