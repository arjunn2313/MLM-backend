const router = require("express").Router();
 
const { createAgent, getAllAgents, agentPreview, findSponser, findPlacement, checkMobile, updateStatus, buildTreeData, buildSponsorTreeData, buildDownTreeData, getDownlineMember, getAlltreeMember, getSponsorMember, incompleteMember, completedMember } = require("../../controllers/Admin/agent");
const { upload } = require("../../middleware/multer");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);

router.post("/register", fileUpload, createAgent);
router.get("/list", getAllAgents);
router.get("/agent-preview/:memberId", agentPreview);
router.get("/sponsor-member/:memberId", findSponser);
router.get("/placement-member/:memberId", findPlacement);
router.get("/check-phone/:phoneNumber", checkMobile);
router.put("/update-status/:id", updateStatus);
router.get("/tree-node-tree/:memberId", buildTreeData);
router.get("/sponsor-node-tree/:memberId", buildSponsorTreeData);
router.get("/downline-node-tree/:memberId", buildDownTreeData);
router.get("/downline-members/:treeName", getDownlineMember);
router.get("/all-tree-members/:treeName", getAlltreeMember);
router.get("/sponsor-downline-members/:treeName", getSponsorMember);


// Incomplete Tree
router.get("/incomplete-members/:treeName", incompleteMember);
router.get("/completed-members/:treeName", completedMember);
 

module.exports = router;
