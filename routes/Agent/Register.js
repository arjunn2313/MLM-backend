const { createAgent, checkMobile, findSponser, findPlacement } = require('../../controllers/Admin/agent');

const router = require('express').Router();
const { upload } = require("../../middleware/multer");

const fileUpload = upload.fields([
  { name: "applicantPhoto", maxCount: 1 },
  { name: "applicantSign", maxCount: 1 },
  { name: "sponsorSign", maxCount: 1 },
]);



router.post("/create",fileUpload,createAgent)
router.get("/check-phone/:phoneNumber", checkMobile);
router.get("/sponsor-member/:memberId", findSponser);
router.get("/placement-member/:memberId", findPlacement);






module.exports = router;