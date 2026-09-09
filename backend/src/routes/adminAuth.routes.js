const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminAuth.controller");
const { protectAdmin } = require("../middleware/adminAuth");
const { authLimiter } = require("../middleware/rateLimiter");

// Public
router.get("/clear-cookie", ctrl.clearCookie);
router.post("/login", authLimiter, ctrl.login);
router.post("/verify-otp", authLimiter, ctrl.verifyOtp);
router.post("/resend-otp", authLimiter, ctrl.resendOtp);
router.post("/refresh", ctrl.refreshToken);

// Protected
router.get("/me", protectAdmin, ctrl.getMe);
router.post("/logout", protectAdmin, ctrl.logout);
router.post("/change-password", protectAdmin, ctrl.changePassword);

// Sessions
router.get("/sessions", protectAdmin, ctrl.getSessions);
router.delete("/sessions/:id", protectAdmin, ctrl.revokeSession);

// Audit logs
router.get("/audit-logs", protectAdmin, ctrl.getAuditLogs);

// Admin management (super_admin only — enforced in controller)
router.get("/admins", protectAdmin, ctrl.getAdmins);
router.post("/admins", protectAdmin, ctrl.createAdmin);
router.put("/admins/:id", protectAdmin, ctrl.updateAdmin);
router.delete("/admins/:id", protectAdmin, ctrl.deleteAdmin);

module.exports = router;
