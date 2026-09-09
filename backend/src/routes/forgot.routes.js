const router = require("express").Router();
const { authLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");
const forgot = require("../controllers/forgot.controller");

// Forgot Password (not logged in)
router.post("/password/send", authLimiter, forgot.forgotPassword);
router.post("/password/verify", authLimiter, forgot.verifyForgotPassword);
router.post("/password/reset", authLimiter, forgot.resetPassword);
router.post("/password/resend", authLimiter, forgot.resendForgotPassword);

// Forgot PIN (logged in)
router.post("/pin/send", authLimiter, protect, forgot.forgotPin);
router.post("/pin/verify", authLimiter, forgot.verifyForgotPin);
router.post("/pin/reset", authLimiter, forgot.resetPin);
router.post("/pin/resend", authLimiter, forgot.resendForgotPin);

module.exports = router;
