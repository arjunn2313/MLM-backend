const router = require("express").Router();
const {
  createAgent,
  getAllAgents,
  agentPreview,
  findSponser,
  updateStatus,
  buildTreeData,
  getDownlineMember,
  getAlltreeMember,
  buildSponsorTreeData,
  getSponsorMember,
  buildDownTreeData,
  checkMobile,
} = require("../controllers/agent");
const { upload } = require("../middleware/multer");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);

router.post("/register", fileUpload, createAgent);
router.get("/list", getAllAgents);
router.get("/agent-preview/:memberId", agentPreview);
router.get("/sponsor-member/:memberId", findSponser);
router.get("/check-phone/:phoneNumber", checkMobile);
router.put("/update-status/:id", updateStatus);
router.get("/tree-node-tree/:memberId", buildTreeData);
router.get("/sponsor-node-tree/:memberId", buildSponsorTreeData);
router.get("/downline-node-tree/:memberId", buildDownTreeData);
router.get("/downline-members/:treeName", getDownlineMember);
router.get("/all-tree-members/:treeName", getAlltreeMember);
router.get("/sponsor-downline-members/:treeName", getSponsorMember);

module.exports = router;
