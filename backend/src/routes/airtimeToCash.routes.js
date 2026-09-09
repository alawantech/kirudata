const router = require("express").Router();
const { protect } = require("../middleware/auth");
const atc = require("../controllers/airtimeToCash.controller");

router.use(protect);

router.get("/config", atc.getConfig);
router.post("/submit", atc.submit);
router.get("/history", atc.getHistory);

module.exports = router;
