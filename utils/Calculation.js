const Agent = require("../models/agents");
const Settings = require("../models/settings");

// const distributeCommissions = async (sponsorId, newAgentId, placementId) => {
//   // Get the commission settings
//   const settings = await Settings.findOne();

//   if (sponsorId === placementId) {
//     let currentSponsorId = sponsorId;
//     let currentLevel = 0;

//     while (currentLevel < 6) {
//       const sponsor = await Agent.findOne({ memberId: currentSponsorId });

//       if (sponsor) {
//         // Update sponsor's wallet with the commission for the current level
//         sponsor.referralCommission +=
//           settings.levelCommissions[currentLevel].amount;

//         sponsor.walletBalance += settings.levelCommissions[currentLevel].amount;

//         sponsor.commissionHistory.push({
//           amount: settings.levelCommissions[currentLevel].amount,
//           description: `Level  commission for agent ${newAgentId}`,
//         });

//         await sponsor.save();

//         // Move to the next level
//         currentSponsorId = sponsor.sponsorId;
//         currentLevel++;
//       } else {
//         // If no sponsor is found for the current level, break the loop
//         break;
//       }
//     }

//     return { success: true, levelsProcessed: currentLevel }; // Indicate that the process was successful and return the number of levels processed
//   } else {
//     // const placedUnderMember = await Agent.findOne({memberId : placementId})
//     // let currentLevel = 0;
//     // while(currentLevel < 6){
//     //   const sponsor =
//     // }

//   }
// };

// const distributeCommissions = async (sponsorId, newAgentId, placementId) => {
//   // Get the commission settings
//   const settings = await Settings.findOne();

//   if (sponsorId === placementId) {
//     let currentSponsorId = sponsorId;
//     let currentLevel = 0;

//     while (currentLevel < 6) {
//       const sponsor = await Agent.findOne({ memberId: currentSponsorId });

//       if (sponsor) {
//         // Update sponsor's wallet with the commission for the current level
//         sponsor.referralCommission +=
//           settings.levelCommissions[currentLevel].amount;
//         await sponsor.save();

//         // Move to the next level
//         currentSponsorId = sponsor.sponsorId;
//         currentLevel++;
//       } else {
//         // If no sponsor is found for the current level, break the loop
//         break;
//       }
//     }

//     return { success: true, levelsProcessed: currentLevel }; // Indicate that the process was successful and return the number of levels processed
//   } else {
//     const placementMember = await Agent.findOne({ memberId: placementId });

//     if (!placementMember) {
//       throw new Error("Placement member not found");
//     }

//     let currentPlacementSponsorId = placementMember.sponsorId;
//     let level = 0;
//     let sponsorMatched = false;

//     while (level < 6) {
//       if (currentPlacementSponsorId === sponsorId) {
//         sponsorMatched = true;
//         break;
//       }

//       const currentSponsor = await Agent.findOne({
//         memberId: currentPlacementSponsorId,
//       });

//       if (!currentSponsor) {
//         break; // Break if no further sponsor is found
//       }

//       currentPlacementSponsorId = currentSponsor.sponsorId;
//       level++;
//     }

//     if (sponsorMatched) {
//       let skippedLevelsCommission = 0;

//       // Calculate total commission for the skipped levels
//       for (let i = 0; i <= level; i++) {
//         skippedLevelsCommission += settings.levelCommissions[i].amount;
//       }

//       let currentSponsorId = sponsorId;
//       let currentLevel = 0;

//       while (currentLevel < 6) {
//         const sponsor = await Agent.findOne({ memberId: currentSponsorId });

//         if (sponsor) {
//           // Update sponsor's wallet with the combined commission for the skipped levels
//           if (currentLevel === level) {
//             sponsor.referralCommission += skippedLevelsCommission;
//           } else {
//             sponsor.referralCommission +=
//               settings.levelCommissions[currentLevel].amount;
//           }
//           await sponsor.save();

//           // Move to the next level
//           currentSponsorId = sponsor.sponsorId;
//           currentLevel++;
//         } else {
//           // If no sponsor is found for the current level, break the loop
//           break;
//         }
//       }

//       return { success: true, levelsProcessed: currentLevel }; // Indicate that the process was successful and return the number of levels processed
//     }

//     if (!sponsorMatched) {
//       throw new Error("Sponsor not matched within 5 levels");
//     }
//   }
// };

const distributeCommissions = async (newAgent) => {
  // Get the commission settings
  const settings = await Settings.findOne();

  if (!settings) {
    throw new Error("Commission settings not found");
  }

  // Iterate over the sponsorHeads and distribute commissions based on the level
  for (
    let i = 0;
    i < newAgent.sponsorHeads.length && i < settings.levelCommissions.length;
    i++
  ) {
    const sponsorHead = newAgent.sponsorHeads[i];
    const commissionAmount = settings.levelCommissions[i].amount;

    // Find the sponsor in the database
    const sponsor = await Agent.findById(sponsorHead.registrationId);

    if (sponsor) {
      // Update the sponsor's wallet balance
      sponsor.walletBalance += commissionAmount;
      sponsor.referralCommission += commissionAmount;

      // Add to the sponsor's commission history
      sponsor.commissionHistory.push({
        amount: commissionAmount,
        date: new Date(),
        description: `Commission for level ${i + 1}`,
      });

      // Save the updated sponsor
      await sponsor.save();
    }
  }
};

module.exports = { distributeCommissions };
