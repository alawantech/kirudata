const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const {
  getProviders,
  getPlans,
  verifyIUC,
  purchase,
} = require("../controllers/cable.controller");

router.get("/providers", protect, getProviders);
router.get("/plans", protect, getPlans);
router.post("/verify", protect, verifyIUC);
router.post("/purchase", protect, transactionLimiter, purchase);

module.exports = router;
