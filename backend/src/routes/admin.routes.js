const router = require("express").Router();
const { protectAdmin } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const admin = require("../controllers/admin.controller");
const banner = require("../controllers/banner.controller");

// ─── Public (no auth needed) ──────────────────────────────────────────────────
router.post("/login", authLimiter, admin.login);
router.post("/logout", admin.logout);

// ─── Protected admin routes ───────────────────────────────────────────────────
router.get("/me", protectAdmin, admin.getMe);
router.get("/stats", protectAdmin, admin.getStats);
router.get("/profit/summary", protectAdmin, admin.getProfitSummary);
router.get("/profit/report", protectAdmin, admin.getProfitReport);

// Users
router.get("/users", protectAdmin, admin.getUsers);
router.get("/users/:id", protectAdmin, admin.getUserDetail);
router.put("/users/:id", protectAdmin, admin.updateUser);
router.put("/users/:id/status", protectAdmin, admin.updateUserStatus);
router.put("/users/:id/type", protectAdmin, admin.updateUserType);
router.delete("/users/:id", protectAdmin, admin.deleteUser);
router.post("/users/reset-password", protectAdmin, admin.resetUserPassword);
router.post("/users/:id/reset-pin", protectAdmin, admin.resetUserPin);

// Upgrade Requests
router.get("/upgrade-requests", protectAdmin, admin.getUpgradeRequests);
router.post(
  "/upgrade-requests/:id/approve",
  protectAdmin,
  admin.approveUpgradeRequest,
);
router.post(
  "/upgrade-requests/:id/reject",
  protectAdmin,
  admin.rejectUpgradeRequest,
);

// Wallet
router.post("/wallet/credit", protectAdmin, admin.creditWallet);
router.post("/wallet/debit", protectAdmin, admin.debitWallet);

// Transactions
router.get("/transactions", protectAdmin, admin.getTransactions);
router.put("/transactions/:id", protectAdmin, admin.updateTransactionStatus);

// Notifications
router.get("/notifications", protectAdmin, admin.getNotifications);
router.post("/notifications", protectAdmin, admin.createNotification);
router.delete("/notifications/:id", protectAdmin, admin.deleteNotification);

// Data Plans
router.get("/data-plans", protectAdmin, admin.getDataPlans);
router.post("/data-plans", protectAdmin, admin.createDataPlan);
router.put("/data-plans/:id", protectAdmin, admin.updateDataPlan);
router.delete("/data-plans/:id", protectAdmin, admin.deleteDataPlan);

// Data Providers
router.get("/data-providers", protectAdmin, admin.getDataProviders);
router.get("/data-providers/balances", protectAdmin, admin.getDataProviderBalances);
router.get("/data-providers/:id/balance", protectAdmin, admin.getDataProviderBalance);
router.post("/data-providers", protectAdmin, admin.createDataProvider);
router.put("/data-providers/:id", protectAdmin, admin.updateDataProvider);
router.delete("/data-providers/:id", protectAdmin, admin.deleteDataProvider);

// Provider Data Plans
router.get("/provider-data-plans", protectAdmin, admin.getProviderDataPlans);
router.post("/provider-data-plans", protectAdmin, admin.createProviderDataPlan);
router.put(
  "/provider-data-plans/:id",
  protectAdmin,
  admin.updateProviderDataPlan,
);
router.delete(
  "/provider-data-plans/:id",
  protectAdmin,
  admin.deleteProviderDataPlan,
);

// Network Provider Settings
router.get(
  "/network-provider-settings",
  protectAdmin,
  admin.getNetworkProviderSettings,
);
router.post(
  "/network-provider-settings",
  protectAdmin,
  admin.upsertNetworkProviderSetting,
);

// Data Card Plans
router.get("/data-card-plans", protectAdmin, admin.getDataCardPlans);
router.post("/data-card-plans", protectAdmin, admin.createDataCardPlan);
router.put("/data-card-plans/:id", protectAdmin, admin.updateDataCardPlan);
router.delete("/data-card-plans/:id", protectAdmin, admin.deleteDataCardPlan);

// Recharge Card Plans
router.get("/recharge-card-plans", protectAdmin, admin.getRechargeCardPlans);
router.post("/recharge-card-plans", protectAdmin, admin.createRechargeCardPlan);
router.put(
  "/recharge-card-plans/:id",
  protectAdmin,
  admin.updateRechargeCardPlan,
);
router.delete(
  "/recharge-card-plans/:id",
  protectAdmin,
  admin.deleteRechargeCardPlan,
);

// KYC Verifications
router.get("/kyc-verifications", protectAdmin, admin.getKycVerifications);
router.post("/kyc-verifications/:id/approve", protectAdmin, admin.approveKycVerification);
router.post("/kyc-verifications/:id/reject", protectAdmin, admin.rejectKycVerification);

// Networks
router.get("/networks", protectAdmin, admin.getNetworks);
router.put("/networks/:id", protectAdmin, admin.updateNetwork);

// Services / Providers
router.get("/cable-providers", protectAdmin, admin.getCableProviders);
router.get(
  "/electricity-providers",
  protectAdmin,
  admin.getElectricityProviders,
);
router.get("/exam-providers", protectAdmin, admin.getExamProviders);
router.post("/exam-providers", protectAdmin, admin.createExamProvider);
router.put("/exam-providers/:id", protectAdmin, admin.updateExamProvider);
router.delete("/exam-providers/:id", protectAdmin, admin.deleteExamProvider);
router.put(
  "/providers/:type/:id/status",
  protectAdmin,
  admin.updateProviderStatus,
);

// Settings
router.get("/settings", protectAdmin, admin.getSettings);
router.put("/settings", protectAdmin, admin.updateSettings);
// Branding file upload — logo or favicon
router.post("/settings/upload/:type", protectAdmin, admin.uploadBranding);

// Blacklist
router.get("/blacklist", protectAdmin, admin.getBlacklist);
router.post("/blacklist", protectAdmin, admin.addToBlacklist);
router.delete("/blacklist/:id", protectAdmin, admin.removeFromBlacklist);

// Issues
router.get("/issues", protectAdmin, admin.getIssues);
router.post("/issues/:id/reply", protectAdmin, admin.replyIssue);

// Contact Messages
router.get("/contact-messages", protectAdmin, admin.getContactMessages);
router.put("/contact-messages/:id/read", protectAdmin, admin.markContactRead);

// API Configs
router.get("/api-configs", protectAdmin, admin.getApiConfigs);
router.post("/api-configs", protectAdmin, admin.updateApiConfig);

// API Links (Provider URLs)
router.get("/api-links", protectAdmin, admin.getApiLinks);
router.post("/api-links", protectAdmin, admin.createApiLink);
router.put("/api-links/:id", protectAdmin, admin.updateApiLink);
router.delete("/api-links/:id", protectAdmin, admin.deleteApiLink);

// Provider Wallet Balances
router.get("/provider-balances", protectAdmin, admin.getProviderBalances);

// ─── Service Configs (flat, service-centric) ───────────────────────────────────
router.get("/service-configs", protectAdmin, admin.getServiceConfigs);
router.post("/service-configs", protectAdmin, admin.createServiceConfig);
router.put(
  "/service-configs/:serviceId",
  protectAdmin,
  admin.updateServiceConfig,
);
router.delete(
  "/service-configs/:serviceId",
  protectAdmin,
  admin.deleteServiceConfig,
);
router.patch(
  "/service-configs/:serviceId/toggle",
  protectAdmin,
  admin.toggleServiceConfig,
);

// ─── API Providers (multi-provider system) ─────────────────────────────────────
router.get("/providers", protectAdmin, admin.getProviders);
router.post("/providers", protectAdmin, admin.createProvider);
router.put("/providers/:id", protectAdmin, admin.updateProvider);
router.delete("/providers/:id", protectAdmin, admin.deleteProvider);

// Provider Services
router.post(
  "/providers/:id/services",
  protectAdmin,
  admin.upsertProviderService,
);
router.patch(
  "/providers/:id/services/:serviceId/toggle",
  protectAdmin,
  admin.toggleProviderService,
);
router.delete(
  "/providers/:id/services/:serviceId",
  protectAdmin,
  admin.deleteProviderService,
);

// Provider Plan Codes
router.get(
  "/providers/:id/services/:serviceId/plan-codes",
  protectAdmin,
  admin.getProviderPlanCodes,
);
router.post(
  "/providers/:id/services/:serviceId/plan-codes",
  protectAdmin,
  admin.upsertProviderPlanCode,
);
router.delete(
  "/providers/:id/services/:serviceId/plan-codes/:planCodeId",
  protectAdmin,
  admin.deleteProviderPlanCode,
);

// Airtime Discounts
router.get("/airtime-discounts", protectAdmin, admin.getAirtimeDiscounts);
router.post("/airtime-discounts", protectAdmin, admin.createAirtimeDiscount);
router.put("/airtime-discounts/:id", protectAdmin, admin.updateAirtimeDiscount);
router.delete(
  "/airtime-discounts/:id",
  protectAdmin,
  admin.deleteAirtimeDiscount,
);

// Cable Plans
router.get("/cable-plans", protectAdmin, admin.getCablePlans);
router.post("/cable-plans", protectAdmin, admin.createCablePlan);
router.put("/cable-plans/:id", protectAdmin, admin.updateCablePlan);
router.delete("/cable-plans/:id", protectAdmin, admin.deleteCablePlan);

// Cable Providers
router.get("/cable-providers", protectAdmin, admin.getCableProviders);
router.post("/cable-providers", protectAdmin, admin.createCableProvider);
router.put("/cable-providers/:id", protectAdmin, admin.updateCableProvider);
router.delete("/cable-providers/:id", protectAdmin, admin.deleteCableProvider);

// Electricity Providers
router.get("/electricity-providers", protectAdmin, admin.getElectricityProviders);
router.post("/electricity-providers", protectAdmin, admin.createElectricityProvider);
router.put("/electricity-providers/:id", protectAdmin, admin.updateElectricityProvider);

// Airtime to Cash
router.get("/atc/settings", protectAdmin, admin.getAtcSettings);
router.put("/atc/settings", protectAdmin, admin.updateAtcSettings);
router.get("/atc/transactions", protectAdmin, admin.getAtcTransactions);
router.put("/atc/transactions/:id/verify", protectAdmin, admin.verifyAtcTransaction);
router.delete("/electricity-providers/:id", protectAdmin, admin.deleteElectricityProvider);

// Diagnostics
router.get("/diagnostics/vtu", protectAdmin, admin.getVtuDiagnostics);

// Banners
router.get("/banners", protectAdmin, banner.getBanners);
router.post("/banners", protectAdmin, banner.createBanner);
router.put("/banners/:id", protectAdmin, banner.updateBanner);
router.delete("/banners/:id", protectAdmin, banner.deleteBanner);
router.post("/banners/upload", protectAdmin, banner.uploadBannerImage);

module.exports = router;
