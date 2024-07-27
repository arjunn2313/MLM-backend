const {
  newMembers,
  getLevel1Members,
  getLevel2Members,
  getLevel3Members,
  getLevel4Members,
  getLevel5Members,
  getLevel6Members,
} = require("../../controllers/Admin/levelsTracker");
const router = require("express").Router();

router.get("/new-members", newMembers);
router.get("/level1-members", getLevel1Members);
router.get("/level2-members", getLevel2Members);
router.get("/level3-members", getLevel3Members);
router.get("/level4-members", getLevel4Members);
router.get("/level5-members", getLevel5Members);
router.get("/level6-members", getLevel6Members);

module.exports = router;
