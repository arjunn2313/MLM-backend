const express = require("express");
const router = express.Router();
const Settings = require("../../models/settings");

// Get the current settings
const getSettings = async (req, res) => {
  const settings = await Settings.findOne();
  res.json(settings);
};

// update
const updateSettings = async (req, res) => {
  try {
    const { joiningFee, levelCommissions } = req.body;

    console.log("Request body:", req.body);

    // Validate referralCommission
    if (typeof joiningFee !== "number") {
      console.log("Invalid referralCommission:", joiningFee);
      return res.status(400).json({
        message: "Invalid joiningFee, it must be a number",
      });
    }

    // Validate levelCommissions
    if (!Array.isArray(levelCommissions)) {
      console.log("Invalid levelCommissions:", levelCommissions);
      return res.status(400).json({
        message: "Invalid levelCommissions, it must be an array",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    settings.joiningFee = joiningFee;
    settings.levelCommissions = levelCommissions;
    await settings.save();

    res.status(200).json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};

// Delete a specific level commission
const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;
    let settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({
        message: "Settings not found",
      });
    }

    console.log(req.params);

    // Remove the commission with the specified _id
    settings.levelCommissions = settings.levelCommissions.filter(
      (commission) => commission._id.toString() !== id
    );

    await settings.save();

    res.status(200).json({
      message: "Commission deleted successfully",
      settings,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred",
      error: error.message,
    });
  }
}

module.exports = { getSettings, updateSettings,deleteLevel };
