const router = require("express").Router();
const { protect } = require("../middleware/auth");
const user = require("../controllers/user.controller");

// All user routes require authentication
router.use(protect);

router.get("/profile", user.getProfile);
router.get("/wallet", user.getWallet);
router.get("/transactions", user.getTransactions);
router.get("/transactions/:ref", user.getTransactionDetail);
router.get("/beneficiaries", user.getBeneficiaries);
router.post("/beneficiaries", user.addBeneficiary);
router.delete("/beneficiaries/:id", user.deleteBeneficiary);
router.get("/notifications", user.getNotifications);
router.get("/support", user.getSupportIssues);
router.post("/support", user.createSupportIssue);
router.get("/airtime-to-cash", user.getAirtimeToCashRequests);
router.post("/airtime-to-cash", user.submitAirtimeToCash);
router.get("/manual-funds", user.getManualFundRequests);
router.get("/virtual-accounts", user.getVirtualAccounts);
router.post("/fund-wallet/initialize", user.initializePaystackPayment);
router.post("/kyc", user.updateKyc);
router.get("/upgrade-status", user.getUpgradeStatus);
router.post("/upgrade-request", user.requestVendorUpgrade);
router.post("/pin/verify", user.verifyTransactionPin);
router.post("/pin", user.setTransactionPin);
router.get("/referral", user.getReferralStats);
router.post("/referral/transfer", user.transferReferralToWallet);

module.exports = router;
