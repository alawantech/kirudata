const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { transactionLimiter } = require("../middleware/rateLimiter");
const airtime = require("../controllers/airtime.controller");

router.get("/networks", airtime.getNetworks);
router.get("/discount", airtime.getDiscount);
router.post("/purchase", protect, transactionLimiter, airtime.purchase);

module.exports = router;
