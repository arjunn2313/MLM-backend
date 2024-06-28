const { createDistrict, getDistricts } = require("../controllers/district");
const router = require("express").Router();
const { upload } = require("../middleware/multer");


router.post("/create",createDistrict)
router.get("/list",getDistricts)

module.exports = router;