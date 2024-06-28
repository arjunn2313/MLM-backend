const Agent = require("../models/agents")


// Recursive function to build the tree node
const buildNode = async (memberId) => {
    const member = await Agent.findOne({ memberId })
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


  module.exports = {buildNode}