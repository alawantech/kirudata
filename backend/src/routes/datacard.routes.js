const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const { getPlans, getNetworks, purchase } = require("../controllers/datacard.controller");

router.get("/networks", protect, getNetworks);
router.get("/plans", protect, getPlans);
router.post("/purchase", protect, transactionLimiter, purchase);

module.exports = router;
