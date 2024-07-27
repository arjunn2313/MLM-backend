const Agent = require("../models/agents");

// Helper function to check if all children have no further sponsored children
const hasNoFurtherSponsoredChildren = async (agentId) => {
    const agent = await Agent.findById(agentId).populate("sponsoredChildren.registrationId");
    if (!agent || agent.sponsoredChildren.length === 0) return false;
  
    for (let child of agent.sponsoredChildren) {
      const childAgent = child.registrationId;
      if (childAgent && childAgent.sponsoredChildren.length > 0) {
        return false;
      }
    }
  
    return true;
  };
  
  // Recursive function to check levels
  const checkLevel = async (agentId, currentLevel, targetLevel) => {
    if (currentLevel === targetLevel) {
      return await hasNoFurtherSponsoredChildren(agentId);
    }
  
    const agent = await Agent.findById(agentId).populate("sponsoredChildren.registrationId");
    if (!agent || agent.sponsoredChildren.length === 0) return false;
  
    for (let child of agent.sponsoredChildren) {
      const childAgent = child.registrationId;
      if (childAgent) {
        const result = await checkLevel(childAgent._id, currentLevel + 1, targetLevel);
        if (result) {
          return true;
        }
      }
    }
  
    return false;
  };
  
  // Main handler to get members at a specific level
  const getMembersByLevel = async (req, res, targetLevel) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
  
      const skip = (page - 1) * limit;
  
      const query = { "sponsoredChildren.0": { $exists: true } };
  
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { memberId: { $regex: search, $options: "i" } },
        ];
      }
  
      const count = await Agent.countDocuments(query);
      const agents = await Agent.find(query).skip(skip).limit(limit);
  
      const filteredAgents = [];
  
      for (let agent of agents) {
        const isTargetLevel = await checkLevel(agent._id, 1, targetLevel);
        if (isTargetLevel) {
          filteredAgents.push(agent);
        }
      }
  
      const totalPages = Math.ceil(count / limit);
  
      res.status(200).json({
        members: filteredAgents.map((agent, index) => ({
          slNo: skip + index + 1,
          name: agent.name,
          memberId: agent.memberId,
          sponsorId: agent.sponsorId,
          placementId: agent.placementId,
          isHead: agent.isHead,
          level: agent.applicantPlacementLevel,
        })),
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.error("Error finding agents:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  
module.exports = { getMembersByLevel };
