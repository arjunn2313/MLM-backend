const { countData, getHead, chartData } = require("../../controllers/Admin/dashBoard");

const router = require("express").Router();


router.get("/count-data",countData)
router.get("/district-head",getHead)
router.get("/chart-data",chartData)





module.exports = router