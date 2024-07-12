const {
  generateSectionId,
  generateHeadId,
} = require("../../utils/idGenerator");
const District = require("../../models/district");
const Section = require("../../models/section");
const Agent = require("../../models/agents");

// create section and head
const createSection = async (req, res) => {
  try {
    const {
      name,
      treeName,
      parentName,
      relation,
      phoneNumber,
      dateOfBirth,
      gender,
      maritalStatus,
      panNumber,
      accountNumber,
      ifscCode,
      bankName,
      address,
      city,
      district,
      state,
      country,
      zipCode,
      nameOfNominee,
      relationshipWithNominee,
      joiningFee,
    } = req.body;

    const districtId = req.params.districtId;

    const isDistrict = await District.findById(districtId);

    if (!isDistrict) {
      return res.status(404).json({ message: "District not found" });
    }

    const isTreeName = await Section.findOne({ treeName: treeName });

    if (isTreeName) {
      return res.status(404).json({ message: "Tree already exist" });
    }

    const isHead = await Agent.findOne({ phoneNumber: phoneNumber });

    if (isHead) {
      return res.status(404).json({ message: "Member already exist" });
    }

    const districtSerialNumber = isDistrict.SerialNumber;
    const sectionId = await generateSectionId(districtSerialNumber, districtId);
    const headId = await generateHeadId(sectionId);

    const newHeadRegistration = new Agent({
      memberId: headId,
      sectionId,
      name,
      treeName,
      parentName,
      relation,
      phoneNumber,
      dateOfBirth,
      gender,
      maritalStatus,
      panNumber,
      accountNumber,
      ifscCode,
      bankName,
      address,
      city,
      district,
      state,
      country,
      zipCode,
      nameOfNominee,
      relationshipWithNominee,
      applicantPlacementLevel: 0,
      joiningFee,
      isHead: true,
      applicantPhoto: req.files["applicantPhoto"]
        ? req.files["applicantPhoto"][0].path
        : null,
      applicantSign: req.files["applicantSign"]
        ? req.files["applicantSign"][0].path
        : null,
    });

    await newHeadRegistration.save();

    const newSection = new Section({
      treeName,
      district: districtId,
      sectionId,
      headName: name,
      head: newHeadRegistration._id,
      memberId: newHeadRegistration.memberId,
    });

    await newSection.save();

    isDistrict.sections.push(newSection._id);

    await isDistrict.save();

    res.status(201).json({
      message: "Registration successful",
      head: newHeadRegistration,
      tree: newSection,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.log(error);
  }
};

// get all section tree

const sectionList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const districtId = req.params.districtId;
    const query = { district: districtId };

    if (search) {
      query.$or = [
        { treeName: { $regex: search, $options: "i" } },
        { headName: { $regex: search, $options: "i" } },
      ];
    }

    // Count the total number of sections matching the query
    const sectionCount = await Section.countDocuments(query);

    // Fetch sections based on the query with pagination
    const sections = await Section.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    if (!sectionCount) {
      return res.status(404).json({ message: "Result not found" });
    }

    const totalPages = Math.ceil(sectionCount / limit);

    res.json({
      sections,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching sections:", err);
    res.status(500).json({ error: "Error fetching sections" });
  }
};

// get single section tree

const getSingleSection = async (req, res) => {
  const { sectionId } = req.params;
  try {
    const section = await Section.findOne({ sectionId });

    if (!section) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.status(201).json(section);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ error: "Error fetching sections" });
  }
};

module.exports = { createSection, sectionList, getSingleSection };
