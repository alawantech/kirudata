const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const { getConfig, send } = require("../controllers/sms.controller");

router.get("/config", protect, getConfig);
router.post("/send", protect, transactionLimiter, send);

module.exports = router;
