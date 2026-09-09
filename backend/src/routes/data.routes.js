const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const data = require("../controllers/data.controller");

router.get("/networks", data.getNetworks);
router.get("/plans", data.getPlans);
router.post("/purchase", protect, transactionLimiter, data.purchase);

module.exports = router;
