const Agent = require("../../models/agents");
const {
  getLevelMembers,
  getMembersAtLevel,
  getMembersByLevel,
} = require("../../utils/levelTracker");

// Find new members

const newMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const query = { sponsoredChildren: { $size: 0 } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
      ];
    }

    const count = await Agent.countDocuments(query);

    const members = await Agent.find(query).skip(skip).limit(limit).select({
      name: 1,
      phoneNumber: 1,
      createdAt: 1,
      memberId: 1,
      sponsorId: 1,
      placementId: 1,
      joiningFee: 1,
      status: 1,
      isHead: 1,
      applicantPlacementLevel: 1,
      referralCommission: 1,
      treeName: 1,
      walletBalance: 1,
    });

    const memberListWithSerial = members.map((member, index) => ({
      slNo: skip + index + 1,
      name: member.name,
      memberId: member.memberId,
      sponsorId: member.sponsorId,
      placementId: member.placementId,
      isHead: member.isHead,
      level: member.applicantPlacementLevel,
    }));

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      members: memberListWithSerial,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
const getLevel1Members = (req, res) => getMembersByLevel(req, res, 1);
const getLevel2Members = (req, res) => getMembersByLevel(req, res, 2);
const getLevel3Members = (req, res) => getMembersByLevel(req, res, 3);
const getLevel4Members = (req, res) => getMembersByLevel(req, res, 4);
const getLevel5Members = (req, res) => getMembersByLevel(req, res, 5);
const getLevel6Members = (req, res) => getMembersByLevel(req, res, 6);

module.exports = {
  newMembers,
  getLevel1Members,
  getLevel2Members,
  getLevel3Members,
  getLevel4Members,
  getLevel5Members,
  getLevel6Members,
};
