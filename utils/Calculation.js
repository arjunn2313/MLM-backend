const Agent = require("../models/agents");
const Settings = require("../models/settings");

 

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
