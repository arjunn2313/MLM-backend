const router = require("express").Router();
const { createHead, getAllHeads, headPreview, checkHeadMobile, checkHeadDistrict } = require("../../controllers/Admin/districtHead");
const { upload } = require("../../middleware/multer");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);

router.post("/register", fileUpload, createHead);
router.get("/list",getAllHeads);
router.get("/head-preview/:memberId",headPreview);
router.get("/check-phone/:phoneNumber",checkHeadMobile);
router.get("/fetch-district-list",checkHeadDistrict);

module.exports = router;
