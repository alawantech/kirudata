const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const {
  getProviders,
  verifyMeter,
  purchase,
} = require("../controllers/electricity.controller");

router.get("/providers", protect, getProviders);
router.post("/verify", protect, verifyMeter);
router.post("/purchase", protect, transactionLimiter, purchase);

module.exports = router;
