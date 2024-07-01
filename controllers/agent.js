const { generateMemberID } = require("../middleware/idGenerator");
const { updateSection } = require("../middleware/levelsManager");
const {
  buildNode,
  sponserBuildNode,
  downlineBuildNode,
} = require("../middleware/nodeTreeGenerator");
const Agent = require("../models/agents");

//create

const createAgent = async (req, res) => {
  try {
    const {
      name,
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
      sponsorId,
      sponsorName,
      sponsorPlacementLevel,
      applicantPlacementLevel,
      joiningFee,
    } = req.body;

    const phone = await Agent.findOne({ phoneNumber });

    if (phone) {
      return res
        .status(400)
        .json({ message: "Mobile number already registered" });
    }

    // Check if parentMemberId is provided
    if (!sponsorId) {
      return res.status(400).json({ message: "Sponsor member ID is required" });
    }

    // Find the parent member
    const parentMember = await Agent.findOne({ memberId: sponsorId });

    if (!parentMember) {
      return res.status(404).json({ message: "Sponsor member not found" });
    }

    if (parentMember.children.length >= 5) {
      return res
        .status(400)
        .json({ message: "Sponsor member already has 5 children" });
    }

    // Generate member ID
    const memberId = await generateMemberID(parentMember.treeName);

    // Create new registration
    const newRegistration = new Agent({
      memberId,
      treeName: parentMember.treeName,
      sectionId: parentMember.sectionId,
      name,
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
      sponsorId,
      sponsorName,
      sponsorPlacementLevel,
      applicantPlacementLevel,
      joiningFee,
      applicantPhoto: req.files["applicantPhoto"]
        ? req.files["applicantPhoto"][0].path
        : null,
      applicantSign: req.files["applicantSign"]
        ? req.files["applicantSign"][0].path
        : null,
      sponsorSign: req.files["sponsorSign"]
        ? req.files["sponsorSign"][0].path
        : null,
    });

    await newRegistration.save();

    // Add new member to parent's children array
    parentMember.children.push({
      memberId,
      registrationId: newRegistration._id,
    });
    await parentMember.save();

    const updatedTree = await updateSection(
      newRegistration.treeName,
      newRegistration.applicantPlacementLevel
    );

    res.status(201).json({
      message: "Registration successful",
      data: newRegistration,
      tree: updatedTree,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

//get all
const getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const count = await Agent.countDocuments(query);

    const members = await Agent.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const memberListWithSerial = members.map((member, index) => ({
      slNo: skip + index + 1,
      name: member.name,
      phoneNumber: member.phoneNumber,
      createdAt: member.createdAt,
      memberId: member.memberId,
      sponsorId: member.sponsorId,
      joiningFee: member.joiningFee,
      status: member.status,
      isHead: member.isHead,
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      members: memberListWithSerial,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Error fetching members" });
  }
};

//get single
const agentPreview = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const member = await Agent.findOne({ memberId });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    const { children, ...others } = member.toObject();
    res.status(200).json(others);
  } catch (error) {
    console.error("Error finding member:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// for finding single sponser details
const findSponser = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const member = await Agent.findOne({ memberId });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (member.status === "Un Approved") {
      return res.status(404).json({
        error:
          "This member has not been approved yet. Please contact an admin for approval.",
      });
    }

    const { name, sponsorPlacementLevel, applicantPlacementLevel, children } =
      member;

    if (children.length === 5) {
      return res.status(404).json({ error: "Max limit reached" });
    }

    res.json({ name, sponsorPlacementLevel, applicantPlacementLevel });
  } catch (error) {
    console.error("Error finding member:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// check phone number

const checkMobile = async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    const phone = await Agent.findOne({ phoneNumber });

    if (phone) {
      return res
        .status(404)
        .json({ error: "A member is already registered with this number" });
    }

    res.status(200).json("Good");
  } catch (error) {
    console.error("Error finding member:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// for updating status
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentMode, payment } = req.body;

  // Validation for allowed fields
  const updateFields = {};
  if (status) updateFields.status = status;
  if (paymentMode) updateFields.paymentMode = paymentMode;
  if (payment) updateFields.payment = payment;
  console.log(updateFields);
  try {
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// linked node tree
const buildTreeData = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const treeData = await buildNode(memberId);
    if (!treeData) {
      return res.status(404).json({ error: "Member not found" });
    }
    res.status(200).json(treeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// get sponsors for selected sectetion

const getSponsorMember = async (req, res) => {
  try {
    const { treeName } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query; // Default values: page 1, limit 10, empty search

    const searchRegex = new RegExp(search, "i"); // Case-insensitive regex for search

    const getMembers = await Agent.find({
      treeName,
      isHead: false,
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { sponsorId: { $regex: searchRegex } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMembers = await Agent.countDocuments({
      treeName,
      isHead: false,
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { sponsorId: { $regex: searchRegex } },
      ],
    });

    const totalPages = Math.ceil(totalMembers / limit);

    const filterDetails = getMembers.map((member) => ({
      name: member.name,
      level: member.applicantPlacementLevel,
      createdAt: member.createdAt,
      memberId: member.memberId,
      sponsorId: member.sponsorId,
      sponsorName: member.sponsorName,
      sponsorLevel: member.sponsorPlacementLevel,
      joiningFee: member.joiningFee,
      status: member.status,
      isHead: member.isHead,
    }));

    res.status(201).json({
      members: filterDetails,
      totalPages,
      currentPage: Number(page),
      totalMembers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get downline for selected sectetion

const getDownlineMember = async (req, res) => {
  try {
    const { treeName } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query; // Default values: page 1, limit 10, empty search

    const searchRegex = new RegExp(search, "i"); // Case-insensitive regex for search

    // Find members with non-empty children array and matching search criteria
    const getMembers = await Agent.find({
      treeName,
      isHead: false,
      children: { $ne: [] },
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { sponsorId: { $regex: searchRegex } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMembers = await Agent.countDocuments({
      treeName,
      isHead: false,
      children: { $ne: [] },
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { sponsorId: { $regex: searchRegex } },
      ],
    });
    const totalPages = Math.ceil(totalMembers / limit);

    const filterDetails = getMembers.map((member) => ({
      name: member.name,
      level: member.applicantPlacementLevel,
      createdAt: member.createdAt,
      memberId: member.memberId,
      sponsorId: member.sponsorId,
      sponsorLevel: member.sponsorPlacementLevel,
      joiningFee: member.joiningFee,
      status: member.status,
      isHead: member.isHead,
    }));

    res.status(201).json({
      members: filterDetails,
      totalPages,
      currentPage: Number(page),
      totalMembers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get  all members for selected sectetion

const getAlltreeMember = async (req, res) => {
  try {
    const { treeName } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query; // Default values: page 1, limit 10, empty search

    const searchRegex = new RegExp(search, "i"); // Case-insensitive regex for search

    const getMembers = await Agent.find({
      treeName,
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { sponsorId: { $regex: searchRegex } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMembers = await Agent.countDocuments({
      treeName,
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { sponsorId: { $regex: searchRegex } },
      ],
    });

    const totalPages = Math.ceil(totalMembers / limit);

    const filterDetails = getMembers.map((member) => ({
      name: member.name,
      level: member.applicantPlacementLevel,
      createdAt: member.createdAt,
      memberId: member.memberId,
      sponsorId: member.sponsorId,
      sponsorLevel: member.sponsorPlacementLevel,
      sponsorName: member.sponsorName,
      joiningFee: member.joiningFee,
      status: member.status,
      isHead: member.isHead,
    }));

    res.status(201).json({
      members: filterDetails,
      totalPages,
      currentPage: Number(page),
      totalMembers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// linked node tree
const buildSponsorTreeData = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const treeData = await sponserBuildNode(memberId);
    if (!treeData) {
      return res.status(404).json({ error: "Member not found" });
    }
    res.status(200).json(treeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// linked node tree
const buildDownTreeData = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const treeData = await downlineBuildNode(memberId);
    if (!treeData) {
      return res.status(404).json({ error: "Member not found" });
    }
    res.status(200).json(treeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createAgent,
  getAllAgents,
  agentPreview,
  findSponser,
  updateStatus,
  buildTreeData,
  getDownlineMember,
  getAlltreeMember,
  buildSponsorTreeData,
  getSponsorMember,
  buildDownTreeData,
  checkMobile,
};
