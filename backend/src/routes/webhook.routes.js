/**
 * Webhook routes
 * Mounted at /webhook in app.js
 */

const express = require("express");
const router = express.Router();
const monnifyWebhook = require("../controllers/monnify.webhook");
const paystackWebhook = require("../controllers/paystack.webhook");

// Capture raw body for signature verification
router.post(
  "/monnify",
  express.raw({ type: "*/*", limit: "50kb" }),
  (req, res, next) => {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.rawBody.toString("utf8"));
    } catch {
      req.body = {};
    }
    next();
  },
  monnifyWebhook,
);

// ── Paystack ─────────────────────────────────────────────────────────────────
router.post(
  "/paystack",
  express.json({ limit: "50kb" }),
  paystackWebhook,
);

module.exports = router;
