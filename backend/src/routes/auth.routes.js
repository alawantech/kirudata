const router = require("express").Router();
const { authLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");
const auth = require("../controllers/auth.controller");

router.post("/register", authLimiter, auth.register);
router.post("/login", authLimiter, auth.login);
router.post("/check-account", auth.checkAccount);
router.post("/logout", auth.logout);

// Protected
router.get("/me", protect, auth.getMe);
router.post("/change-password", protect, auth.changePassword);

module.exports = router;
