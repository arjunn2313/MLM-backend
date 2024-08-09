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
const Section = require("../../models/section");
const District = require("../../models/district");

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
      placedUnderMember,
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

// update

const updateAgent = async (req, res) => {
  try {
    const { memberId } = req.params;
    const details = req.body;

    // Validation
    if (!memberId) {
      return res.status(400).json({ message: "Member ID is required" });
    }

    const allowedFields = [
      "name",
      "dateOfBirth",
      "gender",
      "occupation",
      "maritalStatus",
      "panNumber",
      "accountNumber",
      "ifscCode",
      "bankName",
      "branchName",
      "aadharNumber",
      "address",
      "city",
      "district",
      "state",
      "zipCode",
      "country",
      "nameOfNominee",

      "relationshipWithNominee",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (details[field] !== undefined) {
        updateData[field] = details[field];
      }
    }

    if (req.files && req.files["applicantPhoto"]) {
      updateData.applicantPhoto = req.files["applicantPhoto"][0].path;
    }

    const existingAgent = await Agent.findOne({ memberId });

    if (!existingAgent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    Object.assign(existingAgent, updateData);

    await existingAgent.save();

    res.status(200).json({ message: "Agent updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//get all
// const getAllAgents = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search || "";

//     const skip = (page - 1) * limit;

//     const query = {};
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { phoneNumber: { $regex: search, $options: "i" } },
//       ];
//     }

//     const count = await Agent.countDocuments(query);

//     const members = await Agent.find(query)
//       .populate("districtId", "name")
//       .sort({ _id: -1 })
//       .skip(skip)
//       .limit(limit)
//       .exec();

//     const memberListWithSerial = members.map((member, index) => ({
//       slNo: skip + index + 1,
//       name: member.name,
//       phoneNumber: member.phoneNumber,
//       createdAt: member.createdAt,
//       memberId: member.memberId,
//       sponsorId: member.sponsorId,
//       placementId: member.placementId,
//       joiningFee: member.joiningFee,
//       status: member.status,
//       isHead: member.isHead,
//       level: member.applicantPlacementLevel,
//       referralCommission: member.referralCommission,
//       treeName: member.treeName,
//       walletBalance: member.walletBalance,
//       districtName: member.districtId.name,
//     }));

//     const totalPages = Math.ceil(count / limit);

//     res.json({
//       members: memberListWithSerial,
//       totalPages,
//       currentPage: page,
//     });
//   } catch (err) {
//     console.error("Error fetching members:", err);
//     res.status(500).json({ error: "Error fetching members" });
//   }
// };
const getAllAgents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const districtName = req.query.districtName || "";
    const sectionName = req.query.sectionName || "";
    const level = parseInt(req.query.level) || null;

    console.log(sectionName);

    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (districtName) {
      const district = await District.findOne({ name: districtName });
      if (district) {
        query.districtId = district._id;
      } else {
        // If district is specified but not found, return no results
        query.districtId = null;
      }
    }

    if (sectionName) {
      const section = await Section.findOne({ treeName: sectionName });
      if (section) {
        query.sectionId = section._id;
      } else {
        // If section is specified but not found, return no results
        query.sectionId = null;
      }
    }

    if (level !== null) {
      query.applicantPlacementLevel = level;
    }

    const count = await Agent.countDocuments(query);

    const members = await Agent.find(query)
      .populate("districtId", "name")
      .populate("sectionId", "treeName") // Assuming the section schema has a 'treeName' field
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
      level: member.applicantPlacementLevel,
      referralCommission: member.referralCommission,
      treeName: member.sectionId.treeName, // Accessing treeName from the section
      walletBalance: member.walletBalance,
      districtName: member.districtId.name,
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
    // const { children, ...others } = member.toObject();
    res.status(200).json(member);
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
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchRegex = new RegExp(search, "i");

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
      placementId: member.placementId,
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

// get incomplete for selected sectetion

const incompleteMember = async (req, res) => {
  try {
    const { treeName } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchRegex = new RegExp(search, "i");

    const getMembers = await Agent.find({
      treeName,
      isHead: false,
      $expr: { $lt: [{ $size: "$children" }, 5] },
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { placementId: { $regex: searchRegex } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMembers = await Agent.countDocuments({
      treeName,
      isHead: false,
      $expr: { $lt: [{ $size: "$children" }, 5] },
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
      placementId: member.placementId,
      status: member.status,
      children: member.children,
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

// get all incomplete for selected sectetion

// const AllIncompleteMember = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search = "", } = req.query;

//     const searchRegex = new RegExp(search, "i");

//     const getMembers = await Agent.find({
//       // isHead: false,
//       $expr: { $lt: [{ $size: "$children" }, 5] },
//       $or: [
//         { name: { $regex: searchRegex } },
//         { memberId: { $regex: searchRegex } },
//         { placementId: { $regex: searchRegex } },
//       ],
//     })
//       .populate("districtId", "name")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const totalMembers = await Agent.countDocuments({
//       isHead: false,
//       $expr: { $lt: [{ $size: "$children" }, 5] },
//       $or: [
//         { name: { $regex: searchRegex } },
//         { memberId: { $regex: searchRegex } },
//         { sponsorId: { $regex: searchRegex } },
//       ],
//     });

//     const totalPages = Math.ceil(totalMembers / limit);

//     const filterDetails = getMembers.map((member) => ({
//       name: member.name,
//       level: member.applicantPlacementLevel,
//       createdAt: member.createdAt,
//       memberId: member.memberId,
//       placementId: member.placementId,
//       status: member.status,
//       children: member.children,
//       districtName: member.districtId.name,
//       treeName: member.treeName,
//       isHead:member.isHead
//     }));

//     res.status(201).json({
//       members: filterDetails,
//       totalPages,
//       currentPage: Number(page),
//       totalMembers,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const AllIncompleteMember = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       districtName,
//       sectionName,
//       level
//     } = req.query;

//     const searchRegex = new RegExp(search, "i");

//     // Build the query object
//     let query = {
//       $expr: { $lt: [{ $size: "$children" }, 5] },
//       $or: [
//         { name: { $regex: searchRegex } },
//         { memberId: { $regex: searchRegex } },
//         { placementId: { $regex: searchRegex } },
//       ],
//     };

//     // Add district filter if provided
//     if (districtName) {
//       const district = await District.findOne({ name: districtName });
//       if (district) {
//         query.districtId = district._id;
//       }
//     }
//     if(level){
//       query.applicantPlacementLevel = level
//     }

//     // Add section filter if provided
//     if (sectionName) {
//       const section = await Section.findOne({ treeName: sectionName });
//       if (section) {
//         query.sectionId = section._id;
//       }
//     }

//     // Fetch members with the search criteria, pagination, and sorting
//     const getMembers = await Agent.find(query)
//       .populate("districtId", "name")
//       .populate("sectionId", "name") // Assuming sectionId is a reference field in Agent
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     // Fetch total member count matching the criteria for pagination
//     const totalMembers = await Agent.countDocuments(query);

//     const totalPages = Math.ceil(totalMembers / limit);

//     // Prepare the filtered member details
//     const filterDetails = getMembers.map((member) => ({
//       name: member.name,
//       level: member.applicantPlacementLevel,
//       createdAt: member.createdAt,
//       memberId: member.memberId,
//       placementId: member.placementId,
//       status: member.status,
//       children: member.children,
//       districtName: member.districtId.name,
//       sectionName: member.sectionId.name,
//       treeName: member.treeName,
//       isHead: member.isHead,
//     }));

//     // Send the response with the filtered details and pagination info
//     res.status(200).json({
//       members: filterDetails,
//       totalPages,
//       currentPage: Number(page),
//       totalMembers,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const AllIncompleteMember = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      districtName,
      sectionName,
      level,
    } = req.query;

    console.log(req.query);

    const searchRegex = new RegExp(search, "i");

    // Build the query object
    let query = {
      $expr: { $lt: [{ $size: "$children" }, 5] },
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { placementId: { $regex: searchRegex } },
      ],
    };

    // Add district filter if provided
    if (districtName) {
      const district = await District.findOne({ name: districtName });
      if (district) {
        query.districtId = district._id;
      }
    }

    // Add level filter if provided
    if (level) {
      query.applicantPlacementLevel = level;
    }

    // Add section filter if provided
    if (sectionName) {
      const section = await Section.findOne({ treeName: sectionName });
      if (section) {
        query.sectionId = section._id;
      }
    }

    // Fetch members with the search criteria, pagination, and sorting
    const getMembers = await Agent.find(query)
      .populate("districtId", "name")
      .populate("sectionId", "treeName") // Assuming sectionId is a reference field in Agent
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Fetch total member count matching the criteria for pagination
    const totalMembers = await Agent.countDocuments(query);

    const totalPages = Math.ceil(totalMembers / limit);

    // Prepare the filtered member details
    const filterDetails = getMembers.map((member) => ({
      name: member.name,
      level: member.applicantPlacementLevel,
      createdAt: member.createdAt,
      memberId: member.memberId,
      placementId: member.placementId,
      status: member.status,
      children: member.children,
      districtName: member.districtId.name,
      sectionName: member.sectionId.treeName,
      treeName: member.treeName,
      isHead: member.isHead,
    }));

    // Send the response with the filtered details and pagination info
    res.status(200).json({
      members: filterDetails,
      totalPages,
      currentPage: Number(page),
      totalMembers,
    });
  } catch (error) {
    console.error("Error fetching incomplete members:", error);
    res.status(500).json({ error: error.message });
  }
};

// get complete for selected sectetion
const completedMember = async (req, res) => {
  try {
    const { treeName } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchRegex = new RegExp(search, "i");

    // Find members with children array length exactly 5 and matching search criteria
    const getMembers = await Agent.find({
      treeName,
      isHead: false,
      children: { $size: 5 },
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { placementId: { $regex: searchRegex } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMembers = await Agent.countDocuments({
      treeName,
      isHead: false,
      children: { $size: 5 },
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
      placementId: member.placementId,
      status: member.status,
      children: member.children,
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

const AllCompleteMember = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      districtName,
      sectionName,
      level,
    } = req.query;

    const searchRegex = new RegExp(search, "i");

    // Build the query object
    let query = {
      $expr: { $eq: [{ $size: "$children" }, 5] },
      $or: [
        { name: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { placementId: { $regex: searchRegex } },
      ],
    };

    // Add district filter if provided
    if (districtName) {
      const district = await District.findOne({ name: districtName });
      if (district) {
        query.districtId = district._id;
      }
    }

    // Add level filter if provided
    if (level) {
      query.applicantPlacementLevel = level;
    }

    // Add section filter if provided
    if (sectionName) {
      const section = await Section.findOne({ treeName: sectionName });
      if (section) {
        query.sectionId = section._id;
      }
    }

    // Fetch members with the search criteria, pagination, and sorting
    const getMembers = await Agent.find(query)
      .populate("districtId", "name")
      .populate("sectionId", "name") // Assuming sectionId is a reference field in Agent
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Fetch total member count matching the criteria for pagination
    const totalMembers = await Agent.countDocuments(query);

    const totalPages = Math.ceil(totalMembers / limit);

    // Prepare the filtered member details
    const filterDetails = getMembers.map((member) => ({
      name: member.name,
      level: member.applicantPlacementLevel,
      createdAt: member.createdAt,
      memberId: member.memberId,
      placementId: member.placementId,
      status: member.status,
      children: member.children,
      districtName: member.districtId.name,
      sectionName: member.sectionId.name,
      treeName: member.treeName,
      isHead: member.isHead,
    }));

    // Send the response with the filtered details and pagination info
    res.status(200).json({
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
    const { page = 1, limit = 10, search = "" } = req.query;

    const searchRegex = new RegExp(search, "i");

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
      placementId: member.placementId,
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
const incompleteTreeNode = async (req, res) => {
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

const treeMemberFilter = async (req, res) => {
  try {
    const { districtName } = req.query;
    let sectionNames = [];
    let districtNames = [];

    // Fetch all districts to ensure districtNames always include all districts
    const allDistricts = await District.find({});
    districtNames = allDistricts.map((district) => district.name);

    if (districtName) {
      // If a districtName is provided, find the district and its sections
      const district = await District.findOne({ name: districtName }).populate(
        "sections"
      );
      if (district && district.sections) {
        sectionNames = district.sections.map((section) => section.treeName);
      }
    } else {
      // If no districtName is provided, fetch sections from all districts
      const districts = await District.find({}).populate("sections");
      sectionNames = districts.flatMap(
        (district) => district.sections.map((section) => section.treeName) // Assuming section has a 'treeName' field
      );
    }

    res.status(200).json({ districtNames, sectionNames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while fetching data." });
  }
};

const downlineMembers = async (req, res) => {
  try {
    const { memberId } = req.params;

 
    

    // Find the agent by memberId and populate the children
    const agent = await Agent.findOne({ memberId })
      .populate({
        path: "children.registrationId",
        select: "name memberId applicantPhoto",
      })
      .exec();

    if (!agent) {
      return res.status(404).json({ message: "Agent not found." });
    }

    res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching downline members:", error);
    res.status(500).json({ message: "An error occurred while fetching data." });
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
  incompleteTreeNode,
  checkMobile,
  findPlacement,
  incompleteMember,
  completedMember,
  updateAgent,
  AllIncompleteMember,
  treeMemberFilter,
  AllCompleteMember,
  downlineMembers
};
