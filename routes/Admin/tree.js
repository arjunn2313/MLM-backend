const { createSection, sectionList, getSingleSection } = require("../../controllers/Admin/section");
const router = require("express").Router();
const { upload } = require("../../middleware/multer");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);

router.post("/create-head/:districtId", fileUpload, createSection);
// router.post("/list/:district",);
router.get("/list/:districtId",sectionList);
router.get("/single-tree/:sectionId",getSingleSection)

module.exports = router;
