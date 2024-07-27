const Agent = require("../models/agents");

const checkPhoneNumberExists = async (phoneNumber) => {
  const isPhone = await Agent.findOne({ phoneNumber });
  if (isPhone) {
    throw new Error("Mobile number already registered");
  }
};

const findSponsorAndPlacementMembers = async (sponsorId, placementId) => {
  const sponsorMember = await Agent.findOne({ memberId: sponsorId });
  const placedUnderMember = await Agent.findOne({ memberId: placementId });

  if (!sponsorMember || !placedUnderMember) {
    throw new Error("Sponsor member or Placement member not found");
  }

  return { sponsorMember, placedUnderMember };
};

const validatePlacementChildrenLimit = (placedUnderMember) => {
  if (placedUnderMember.children.length >= 5) {
    throw new Error("Placement member already has 5 children");
  }
};

const createAndSaveAgent = async (
  req,
  memberId,
  sponsorMember,
  placementId,
  sponsorId,
  placedUnderMember,
  details
) => {
  const newAgent = new Agent({
    memberId,
    treeName: sponsorMember.treeName,
    sectionId: sponsorMember.sectionId,
    districtId:sponsorMember.districtId,
    phoneNumber: req.body.phoneNumber,
    sponsorName: sponsorMember.name,
    applicantPlacementLevel:placedUnderMember.applicantPlacementLevel + 1,
    placementId,
    sponsorId,
    applicantPhoto: req.body.applicantPhoto,
    applicantPhoto: req.files["applicantPhoto"]
      ? req.files["applicantPhoto"][0].path
      : null,
    ...details,
  });

  console.log(newAgent);

  if (sponsorId === placementId) {
    let currentSponsor = await Agent.findOne({ memberId: sponsorId });
    if (currentSponsor) {
      // Add the current sponsorId member first
      newAgent.sponsorHeads.push({
        memberId: currentSponsor.memberId,
        registrationId: currentSponsor._id,
      });

      // Add the first five members from sponsor's sponsorHeads
      for (
        let i = 0;
        i < Math.min(5, currentSponsor.sponsorHeads.length);
        i++
      ) {
        newAgent.sponsorHeads.push({
          memberId: currentSponsor.sponsorHeads[i].memberId,
          registrationId: currentSponsor.sponsorHeads[i].registrationId,
        });
      }
    }
  } else {
    const sponsorAgent = await Agent.findOne({ memberId: sponsorId });
    const placementAgent = await Agent.findOne({ memberId: placementId });
    const level =
      placementAgent.applicantPlacementLevel -
      sponsorAgent.applicantPlacementLevel +
      1;

    // Push sponsorHeads from sponsorAgent to newAgent.sponsorHeads
    sponsorAgent.sponsorHeads.forEach((head) => {
      newAgent.sponsorHeads.push({
        memberId: head.memberId,
        registrationId: head.registrationId,
      });
    });

    // Push sponsorAgent.memberId level number of times to newAgent.sponsorHeads
    for (let i = 0; i < level; i++) {
      newAgent.sponsorHeads.push({
        memberId: sponsorAgent.memberId,
        registrationId: sponsorAgent._id,
      });
    }
  }

  await newAgent.save();

  return newAgent;
};

const updateSponsorAndPlacementMembers = async (
  sponsorMember,
  placedUnderMember,
  newAgent
) => {
  // Add new member to sponsor's children array
  sponsorMember.sponsoredChildren.push({
    memberId: newAgent.memberId,
    registrationId: newAgent._id,
  });
  await sponsorMember.save();

  // Add new member to placement's children array
  placedUnderMember.children.push({
    memberId: newAgent.memberId,
    registrationId: newAgent._id,
  });
  await placedUnderMember.save();
};

module.exports = {
  checkPhoneNumberExists,
  findSponsorAndPlacementMembers,
  validatePlacementChildrenLimit,
  createAndSaveAgent,
  updateSponsorAndPlacementMembers,
};
