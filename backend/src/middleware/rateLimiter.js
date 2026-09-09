const rateLimit = require("express-rate-limit");

/** Strict limiter for auth endpoints — 10 attempts per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: {
    status: "error",
    msg: "Too many login attempts. Please try again in 15 minutes.",
  },
});

/** OTP verify limiter — 5 attempts per 15 minutes per user identifier.
 * Prevents brute-force on OTP codes even if attacker rotates IPs. */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const { otpToken } = req.body || {};
    if (otpToken) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.decode(otpToken);
        if (decoded?.id) return `otp-user-${decoded.id}`;
      } catch {}
    }
    return req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    msg: "Too many verification attempts. Please try again in 15 minutes.",
  },
});

/** Transaction limiter — 10 purchase attempts per minute per user ID.
 * Always place this after the `protect` middleware so req.user is set.
 * Falls back to IP if user is somehow missing (should not happen). */
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.user?.id || req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    msg: "Too many purchase attempts. Please slow down.",
  },
});

module.exports = { authLimiter, otpVerifyLimiter, transactionLimiter };
