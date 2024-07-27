const {
  buildTreeData,
  buildSponsorTreeData,
  getDownlineMember,
  getAlltreeMember,
  getSponsorMember,
  incompleteMember,
  completedMember,
  incompleteTreeNode,
  AllIncompleteMember,
  treeMemberFilter,
  AllCompleteMember,
} = require("../../controllers/Admin/agent");
const {
  createSection,
  sectionList,
  getSingleSection,
} = require("../../controllers/Admin/section");
const router = require("express").Router();
const { upload } = require("../../middleware/multer");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);

router.post("/create-head/:districtId", fileUpload, createSection);
router.get("/list/:districtId", sectionList);
router.get("/single-tree/:sectionId", getSingleSection);

router.get("/tree-node-tree/:memberId", buildTreeData);
router.get("/sponsor-node-tree/:memberId", buildSponsorTreeData);
// router.get("/downline-node-tree/:memberId", buildDownTreeData);
router.get("/downline-members/:treeName", getDownlineMember);
router.get("/all-tree-members/:treeName", getAlltreeMember);
router.get("/sponsor-downline-members/:treeName", getSponsorMember);

// Incomplete Tree
router.get("/incomplete-members/:treeName", incompleteMember);
router.get("/incomplete-tree/:memberId", incompleteTreeNode);

router.get("/all-incomplete-members", AllIncompleteMember);
router.get("/incomplete-filter", treeMemberFilter);

router.get("/completed-members/:treeName", completedMember);
router.get("/all-complete-members", AllCompleteMember);

module.exports = router;
