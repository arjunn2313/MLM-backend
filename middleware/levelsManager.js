const Section = require("../models/section");
const Agent = require("../models/agents");

const updateSection = async (treeName, levels) => {
  try {
    // Find the tree with the given treeName
    const tree = await Section.findOne({ treeName });

    if (tree) {
      if (levels > tree.levels) {
        tree.levels = levels;
      }

      const agentCount = await Agent.countDocuments({
        treeName,
        isHead: false,
      });

      console.log(agentCount);

      tree.totalMembers = agentCount;

      await tree.save();

      return tree;
    } else {
      throw new Error("Tree not found");
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error updating the tree section");
  }
};

module.exports = { updateSection };
