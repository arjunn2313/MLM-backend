const District = require("../../models/district");

const createDistrict = async (req, res) => {
  try {
    const { name, SerialNumber } = req.body;

    const existingDistrictByName = await District.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existingDistrictByName) {
      return res.status(400).json({
        message: "District with the same name already exists.",
      });
    }

    const existingDistrictBySerialNumber = await District.findOne({
      SerialNumber: new RegExp(`^${SerialNumber}$`, "i"),
    });

    if (existingDistrictBySerialNumber) {
      return res.status(400).json({
        message: "District with the same SerialNumber already exists.",
      });
    }

    const newDistrict = new District({
      name,
      SerialNumber,
    });

    await newDistrict.save();

    res.status(201).json(newDistrict);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDistricts = async (req, res) => {
  try {
    const districts = await District.find();
    // .populate("sections");

    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message || "Result not found" });
  }
};

const updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, SerialNumber, sections } = req.body;

    const existingDistrict = await District.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${name}$`, "i"),
      SerialNumber: new RegExp(`^${SerialNumber}$`, "i"),
    });

    if (existingDistrict) {
      return res.status(400).json({
        message:
          "Another district with the same name and SerialNumber already exists.",
      });
    }

    const updatedDistrict = await District.findByIdAndUpdate(
      id,
      { name, SerialNumber, sections },
      { new: true, runValidators: true }
    );

    if (!updatedDistrict) {
      return res.status(404).json({ message: "District not found" });
    }

    res.status(200).json(updatedDistrict);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDistrict = await District.findByIdAndDelete(id);

    if (!deletedDistrict) {
      return res.status(404).json({ message: "District not found" });
    }

    res.status(200).json({ message: "District deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDistrict,
  getDistricts,
  updateDistrict,
  deleteDistrict,
};
