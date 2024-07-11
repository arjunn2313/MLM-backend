const Section = require("../models/section");
const Agent = require("../models/agents");

// Tree ID
const generateSectionId = async (districtSerialNumber, districtId) => {
  // Count existing sections for this district
  const sectionCount = await Section.countDocuments({ district: districtId });

  // Generate the section ID
  const sectionId = `${districtSerialNumber}${String(sectionCount + 1).padStart(
    2,
    "0"
  )}`;

  return sectionId;
};

// Head Id
const generateHeadId = async (sectionId) => {
  const headId = `${sectionId}01`;
  return headId;
};

// member Id
// const generateMemberID = async (treeName) => {
//   try {
//     const lastRecord = await Agent.findOne({ treeName }).sort({
//       createdAt: -1,
//     });
//     if (lastRecord && lastRecord.memberId) {
//       const lastMemberId = lastRecord.memberId;
//       const lastDigit = parseInt(lastMemberId.slice(-1), 10);
//       const newLastDigit = (lastDigit + 1) % 10;
//       const newMemberId = lastMemberId.slice(0, -1) + newLastDigit;
//       return newMemberId;
//     } else {
//       // Handle the case where no record is found or memberId is missing
//       throw new Error("No last record found or memberId is missing");
//     }
//   } catch (error) {
//     console.error(error);
//     throw new Error("Error generating new memberId");
//   }
// };

const generateMemberID = async (treeName) => {
  try {
    const lastRecord = await Agent.findOne({ treeName }).sort({
      createdAt: -1,
    });

    if (lastRecord && lastRecord.memberId) {
      const lastMemberId = lastRecord.memberId;
      const numericPart = parseInt(lastMemberId.match(/\d+$/)[0], 10); // Extract numeric part
      const incrementedPart = (numericPart + 1)
        .toString()
        .padStart(
          lastMemberId.length - lastMemberId.match(/\D+/)[0].length,
          "0"
        ); // Increment and pad

      const newMemberId = lastMemberId.replace(/\d+$/, incrementedPart); // Replace numeric part with incremented value
      return newMemberId;
    } else {
      throw new Error("No last record found or memberId is missing");
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error generating new memberId");
  }
};

module.exports = { generateSectionId, generateHeadId, generateMemberID };
