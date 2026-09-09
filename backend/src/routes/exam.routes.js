const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const { getProviders, purchase } = require("../controllers/exam.controller");

router.get("/providers", protect, getProviders);
router.post("/purchase", protect, transactionLimiter, purchase);

module.exports = router;
