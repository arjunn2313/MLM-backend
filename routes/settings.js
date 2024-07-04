const { getSettings, updateSettings, deleteLevel } = require("../controllers/settings")

const router = require("express").Router()

router.get("/",getSettings)
router.post("/update",updateSettings)
router.delete("/delete/:id",deleteLevel)


module.exports = router