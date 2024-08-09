const router = require("express").Router();

const {
  createAgent,
  getAllAgents,
  agentPreview,
  findSponser,
  findPlacement,
  checkMobile,
  updateStatus,
  buildTreeData,
  buildSponsorTreeData,
  getDownlineMember,
  getAlltreeMember,
  getSponsorMember,
  incompleteMember,
  completedMember,
  updateAgent,
  downlineMembers,
} = require("../../controllers/Admin/agent");
const { upload } = require("../../middleware/multer");
const { checkRole } = require("../../utils/jwt");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);

router.post("/register",fileUpload, createAgent);
router.get("/list", getAllAgents);
router.get("/agent-preview/:memberId", agentPreview);
router.get("/sponsor-member/:memberId", findSponser);
router.get("/placement-member/:memberId", findPlacement);
router.get("/check-phone/:phoneNumber", checkMobile);
router.put("/update-status/:id", updateStatus);
router.put("/agent-update/:memberId",fileUpload, updateAgent);


// downline children details
router.get("/downline/:memberId",downlineMembers)


module.exports = router;
