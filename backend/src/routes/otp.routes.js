const router = require("express").Router();
const { authLimiter, otpVerifyLimiter } = require("../middleware/rateLimiter");
const otp = require("../controllers/otp.controller");

router.post("/send", authLimiter, otp.sendOtp);
router.post("/verify", otpVerifyLimiter, otp.verifyOtp);
router.post("/resend", authLimiter, otp.resendOtp);

module.exports = router;
