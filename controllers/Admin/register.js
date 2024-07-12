const Registration = require("../../models/member");

// Function to generate a unique member ID
const generateMemberID = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based

  // Find the last created record
  const lastRecord = await Registration.findOne().sort({ createdAt: -1 });

  // Generate the next ID number based on the last record
  const nextIDNumber = lastRecord
    ? parseInt(lastRecord.memberId.slice(-3)) + 1
    : 1;
  const memberId = `ID${year}${month}${String(nextIDNumber).padStart(3, "0")}`;

  return memberId;
};

//super admin
// const register = async (req, res) => {
//   try {
//     const {
//       name,
//       parentName,
//       relation,
//       phoneNumber,
//       dateOfBirth,
//       gender,
//       maritalStatus,
//       panNumber,
//       accountNumber,
//       ifscCode,
//       bankName,
//       address,
//       city,
//       district,
//       state,
//       country,
//       zipCode,
//       nameOfNominee,
//       relationshipWithNominee,
//       sponsorId,
//       sponsorName,
//       sponsorPlacementLevel,
//       applicantPlacementLevel,
//       joiningFee,
//       status,
//       payment,
//       paymentMode
//     } = req.body;

//     // Check if parentMemberId is provided
//     // if (!sponsorId) {
//     //   return res.status(400).json({ message: "Sponsor member ID is required" });
//     // }

//     // Find the parent member
//     // const parentMember = await Registration.findOne({ memberId: sponsorId });

//     // if (!parentMember) {
//     //   return res.status(404).json({ message: "Sponsor member not found" });
//     // }

//     // if (parentMember.children.length >= 5) {
//     //   return res
//     //     .status(400)
//     //     .json({ message: "Sponsor member already has 5 children" });
//     // }

//     // Generate member ID

//     const memberId = await generateMemberID();

//     // Create new registration
//     const newRegistration = new Registration({
//       memberId,
//       name,
//       parentName,
//       relation,
//       phoneNumber,
//       dateOfBirth,
//       gender,
//       maritalStatus,
//       panNumber,
//       accountNumber,
//       ifscCode,
//       bankName,
//       address,
//       city,
//       district,
//       state,
//       country,
//       zipCode,
//       nameOfNominee,
//       relationshipWithNominee,
//       sponsorId,
//       sponsorName,
//       sponsorPlacementLevel,
//       applicantPlacementLevel,
//       joiningFee,
//       status,
//       payment,
//       paymentMode,
//       applicantPhoto: req.files["applicantPhoto"]
//         ? req.files["applicantPhoto"][0].path
//         : null,
//       applicantSign: req.files["applicantSign"]
//         ? req.files["applicantSign"][0].path
//         : null,
//       sponsorSign: req.files["sponsorSign"]
//         ? req.files["sponsorSign"][0].path
//         : null,
//     });

//     await newRegistration.save();

//     // Add new member to parent's children array
//     // parentMember.children.push({
//     //   memberId,
//     //   registrationId: newRegistration._id,
//     // });
//     // await parentMember.save();

//     res
//       .status(201)
//       .json({ message: "Registration successful", data: newRegistration });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// Register
const register = async (req, res) => {
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

      payment,
      paymentMode,
    } = req.body;

    console.log(req.body);

    // Check if parentMemberId is provided
    if (!sponsorId) {
      return res.status(400).json({ message: "Sponsor member ID is required" });
    }

    // Find the parent member
    const parentMember = await Registration.findOne({ memberId: sponsorId });

    if (!parentMember) {
      return res.status(404).json({ message: "Sponsor member not found" });
    }

    if (parentMember.children.length >= 5) {
      return res
        .status(400)
        .json({ message: "Sponsor member already has 5 children" });
    }

    // Generate member ID
    const memberId = await generateMemberID();

    // Create new registration
    const newRegistration = new Registration({
      memberId,
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

      payment,
      paymentMode,
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

    res
      .status(201)
      .json({ message: "Registration successful", data: newRegistration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// get members

const memberList = async (req, res) => {
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

    const count = await Registration.countDocuments(query);

    const members = await Registration.find(query)
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

// for finding single sponser details
const findSponser = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const member = await Registration.findOne({ memberId });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
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

// member preview
const memberPreview = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const member = await Registration.findOne({ memberId });
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

// Recursive function to build the tree node
const buildNode = async (memberId) => {
  const member = await Registration.findOne({ memberId })
    .populate("children.registrationId")
    .exec();

  if (!member) {
    return null;
  }

  return {
    name: member.memberId,
    user: member.name,
    joiningDate: member.createdAt,
    phoneNumber: member.phoneNumber,
    sponsorId: member.sponsorId,
    sponsorName: member.sponsorName,
    level: member.applicantPlacementLevel,
    children: await Promise.all(
      member.children.map(async (child) => await buildNode(child.memberId))
    ),
  };
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

module.exports = {
  register,
  memberList,
  findSponser,
  memberPreview,
  buildTreeData,
};
