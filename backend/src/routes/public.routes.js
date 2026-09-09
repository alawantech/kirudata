const express = require("express");
const router = express.Router();
const { getPublicSettings } = require("../controllers/public.controller");
const { getActiveBanners } = require("../controllers/banner.controller");
const { sendSuccess, sendError } = require("../helpers/response");

// GET /api/v2/public/settings — no auth required
router.get("/settings", getPublicSettings);

// GET /api/v2/public/banners — no auth required
router.get("/banners", getActiveBanners);

// GET /api/v2/public/paystack-key — returns Paystack public key
router.get("/paystack-key", async (req, res) => {
  try {
    const paystackService = require("../services/paystack.service");
    const key = await paystackService.getPaystackPublicKey();
    if (!key) return sendError(res, "Paystack not configured.", 404);
    return sendSuccess(res, { publicKey: key });
  } catch (err) {
    return sendError(res, "Failed to load Paystack key.", 500);
  }
});

module.exports = router;
