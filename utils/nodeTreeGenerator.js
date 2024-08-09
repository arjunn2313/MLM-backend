const Agent = require("../models/agents");

// Recursive function to build the tree node
 
// const buildNode = async (memberId) => {
//   const member = await Agent.findOne({ memberId })
//     .populate("children.registrationId")
//     .exec();

//   if (!member) {
//     return null;
//   }

//   // Define max number of children a member can have
//   const maxChildren = 5;

//   const children = await Promise.all(
//     member.children.map(async (child) => await buildNode(child.memberId))
//   );

//   // Add placeholders for "Add" buttons
//   for (let i = children.length; i < maxChildren; i++) {
//     children.push({ name: "Add", isAddButton: true });
//   }

//   return {
//     name: member.memberId,
//     user: member.name,
//     joiningDate: member.createdAt,
//     phoneNumber: member.phoneNumber,
//     sponsorId: member.sponsorId,
//     sponsorName: member.sponsorName,
//     level: member.applicantPlacementLevel,
//     children,
//   };
// };

const buildNode = async (memberId) => {
  const member = await Agent.findOne({ memberId })
    .populate("children.registrationId")
    .exec();

  if (!member) {
    return null;
  }

  // Define max number of children a member can have
  const maxChildren = 5;

  const children = await Promise.all(
    member.children.map(async (child) => await buildNode(child.memberId))
  );

  // Add placeholders for "Add" buttons with the parent ID
  for (let i = children.length; i < maxChildren; i++) {
    children.push({ name: "Add", isAddButton: true, parentId: memberId });
  }

  return {
    name: member.memberId,
    user: member.name,
    joiningDate: member.createdAt,
    phoneNumber: member.phoneNumber,
    sponsorId: member.sponsorId,
    sponsorName: member.sponsorName,
    level: member.applicantPlacementLevel,
    children,
  };
};


// sponsor tree

const sponserBuildNode = async (memberId) => {
  const member = await Agent.findOne({ memberId })
    .populate({
      path: "children.registrationId",
      select:
        "memberId name createdAt phoneNumber sponsorId sponsorName applicantPlacementLevel",
    })
    .exec();

  if (!member) {
    return null;
  }

  const children = member.children.map((child) => ({
    name: child.registrationId.memberId,
    user: child.registrationId.name,
    joiningDate: child.registrationId.createdAt,
    phoneNumber: child.registrationId.phoneNumber,
    sponsorId: child.registrationId.sponsorId,
    sponsorName: child.registrationId.sponsorName,
    level: child.registrationId.applicantPlacementLevel,
  }));

  return {
    name: member.memberId,
    user: member.name,
    joiningDate: member.createdAt,
    phoneNumber: member.phoneNumber,
    sponsorId: member.sponsorId,
    sponsorName: member.sponsorName,
    level: member.applicantPlacementLevel,
    children,
  };
};

const downlineBuildNode = async (memberId) => {
  const member = await Agent.findOne({ memberId })
    .populate({
      path: "children.registrationId",
      select:
        "memberId name createdAt phoneNumber sponsorId sponsorName applicantPlacementLevel applicantPhoto",
    })
    .exec();

  if (!member) {
    return null;
  }

  // Define max number of children a member can have
  const maxChildren = 5;

  const children = member.children.map((child) => ({
    name: child.registrationId.memberId,
    user: child.registrationId.name,
    joiningDate: child.registrationId.createdAt,
    phoneNumber: child.registrationId.phoneNumber,
    sponsorId: child.registrationId.sponsorId,
    sponsorName: child.registrationId.sponsorName,
    level: child.registrationId.applicantPlacementLevel,
    photoUrl : child.registrationId.applicantPhoto,
  }));

  // Add placeholders for "Add" buttons
  for (let i = children.length; i < maxChildren; i++) {
    children.push({ name: "Add", isAddButton: true });
  }

  return {
    name: member.memberId,
    user: member.name,
    joiningDate: member.createdAt,
    phoneNumber: member.phoneNumber,
    sponsorId: member.sponsorId,
    sponsorName: member.sponsorName,
    level: member.applicantPlacementLevel,
    photoUrl:member.photoUrl,
    children,
  };
};

module.exports = { buildNode, sponserBuildNode, downlineBuildNode };
