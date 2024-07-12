 
const router = require("express").Router();
const { createDistrict, getDistricts } = require("../../controllers/Admin/district");
const { upload } = require("../../middleware/multer");


router.post("/create",createDistrict)
router.get("/list",getDistricts)

module.exports = router;