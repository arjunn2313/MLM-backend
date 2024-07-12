const {
  checkPhoneNumberExists,
  findSponsorAndPlacementMembers,
  validatePlacementChildrenLimit,
  createAndSaveAgent,
  updateSponsorAndPlacementMembers,
} = require("../../services/agentServices");
const { distributeCommissions } = require("../../utils/Calculation");
const { generateMemberID } = require("../../utils/idGenerator");
const { updateSection } = require("../../utils/levelsManager");
const {
  buildNode,
  sponserBuildNode,
  downlineBuildNode,
} = require("../../utils/nodeTreeGenerator");
const Agent = require("../../models/agents");

//create

const createAgent = async (req, res) => {
  try {
    const { placementId, sponsorId, phoneNumber, ...details } = req.body;

    await checkPhoneNumberExists(phoneNumber);

    const { sponsorMember, placedUnderMember } =
      await findSponsorAndPlacementMembers(sponsorId, placementId);

    validatePlacementChildrenLimit(placedUnderMember);

    const memberId = await generateMemberID(sponsorMember.treeName);

    const newAgent = await createAndSaveAgent(
      req,
      memberId,
      sponsorMember,
      placementId,
      sponsorId,
      details
    );

    await updateSponsorAndPlacementMembers(
      sponsorMember,
      placedUnderMember,
      newAgent
    );

    const updatedTree = await updateSection(
      newAgent.treeName,
      newAgent.applicantPlacementLevel
    );

    const commission = await distributeCommissions(newAgent);

    res.status(201).json({
      message: "Registration successful",
      data: newAgent,
      tree: updatedTree,
      payment: commission,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      placementId: member.placementId,
      joiningFee: member.joiningFee,
      status: member.status,
      isHead: member.isHead,
      level:member.applicantPlacementLevel,
      referralCommission: member.referralCommission,
      treeName : member.treeName,
      walletBalance:member.walletBalance
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

    res.json({ name, applicantPlacementLevel });
  } catch (error) {
    console.error("Error finding member:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// const findSponser = async (req, res) => {
//   const { memberId, placementId } = req.params;

//   try {
//     const member = await Agent.findOne({ memberId });

//     if (!member) {
//       return res.status(404).json({ error: "Member not found" });
//     }

//     if (member.status === "Un Approved") {
//       return res.status(404).json({
//         error:
//           "This member has not been approved yet. Please contact an admin for approval.",
//       });
//     }

//     const { name, sponsorPlacementLevel, applicantPlacementLevel, children } =
//       member;

//     // Find the placement based on the given placementId
//     const placement = await Agent.findOne({ memberId: placementId });

//     if (!placement) {
//       return res.status(404).json({ error: "Placement not found" });
//     }

//     //collect all members from tree

//     res.json({
//       name,
//       applicantPlacementLevel,
//       placementId,
//     });
//   } catch (error) {
//     console.error("Error finding member:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

module.exports = { findSponser };

// for find placement
const findPlacement = async (req, res) => {
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

    const nextPlacement = applicantPlacementLevel + 1;

    res.json({ name, applicantPlacementLevel, nextPlacement });
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
  if (payment) {
    updateFields.payment = payment;
    updateFields.isPayed = true;
  }
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
  findPlacement,
};
