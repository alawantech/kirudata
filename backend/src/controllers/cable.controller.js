const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");

async function getProviders(req, res) {
  try {
    const providers = await prisma.cableProvider.findMany({
      orderBy: { id: "asc" },
    });
    return sendSuccess(res, { providers });
  } catch (err) {
    console.error("[Cable] getProviders error:", err.message);
    return sendError(res, "Failed to load cable providers.", 500);
  }
}

async function getPlans(req, res) {
  try {
    const { provider } = req.query;
    if (!provider) return sendError(res, "provider query param required.");
    const plans = await prisma.cablePlan.findMany({
      where: { providerId: parseInt(provider) },
      orderBy: { id: "asc" },
    });
    return sendSuccess(res, { plans });
  } catch (err) {
    console.error("[Cable] getPlans error:", err.message);
    return sendError(res, "Failed to load cable plans.", 500);
  }
}

async function verifyIUC(req, res) {
  try {
    const { iuc, provider } = req.body;
    if (!iuc || !provider)
      return sendError(res, "iuc and provider are required.");
    const providerRecord = await prisma.cableProvider.findUnique({
      where: { id: parseInt(provider) },
    });
    if (!providerRecord) return sendError(res, "Provider not found.", 404);
    if (providerRecord.status !== "On")
      return sendError(res, "This cable provider is currently unavailable.");
    const apiConfigs = await vtuService.getApiConfigs();
    const result = await vtuService.verifyCableIUC({
      iuc,
      provider: providerRecord.cableCode,
      apiConfigs,
    });
    if (result.status === "fail") return sendError(res, result.msg);
    const customer = result.customer || {};
    return sendSuccess(res, {
      customerName: customer.name || customer.customerName || null,
      message: customer.message || "Verification successful",
    });
  } catch (err) {
    console.error("[Cable] verifyIUC error:", err.message);
    return sendError(res, "Failed to verify smart card. Please try again.", 500);
  }
}

async function purchase(req, res) {
  try {
    const { providerId, planId, iuc, phone } = req.body;
    if (!providerId || !planId || !iuc || !phone)
      return sendError(res, "providerId, planId, iuc, and phone are required.");

    // Enforce transaction PIN — required if user has one set
    const { pin } = req.body;
    const userRecord = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { pin: true, pinDisabled: true, regStatus: true },
    });
    if (!userRecord) return sendError(res, "User not found.", 404);
    if (userRecord.regStatus === 3)
      return sendError(res, "Account suspended.", 403);
    if (!userRecord.pin)
      return sendError(res, "Please set your transaction PIN in your profile before making transactions.", 403);
    if (pin === undefined || pin === null || pin === "")
      return sendError(res, "Transaction PIN is required.", 401);
    const pinMatch = await bcrypt.compare(String(pin), userRecord.pin);
    if (!pinMatch) return sendError(res, "Invalid transaction PIN.", 401);

    const provider = await prisma.cableProvider.findUnique({
      where: { id: parseInt(providerId) },
    });
    if (!provider) return sendError(res, "Provider not found.", 404);
    if (provider.status !== "On")
      return sendError(res, "This cable provider is currently unavailable.");

    const plan = await prisma.cablePlan.findUnique({
      where: { id: parseInt(planId) },
    });
    if (!plan) return sendError(res, "Plan not found.", 404);

    let sellPrice = parseFloat(plan.buyingPrice);

    const siteSettings = await prisma.siteSetting.findFirst();
    const cableFee = parseFloat(siteSettings?.cableFee || "0");
    sellPrice += cableFee;

    const costPrice = parseFloat(plan.buyingPrice);
    const wallet = await UserModel.getWallet(req.user.id);
    if (wallet < sellPrice) return sendError(res, "Insufficient wallet balance.");

    const servicedesc = provider.name + " " + plan.name + " - " + iuc;
    const isDuplicate = await TransactionModel.checkDuplicate(
      req.user.id,
      servicedesc,
    );
    if (isDuplicate)
      return sendError(
        res,
        "Possible duplicate transaction. Please verify and try again after 30 seconds.",
      );

    const ref = generateRef();
    const apiConfigs = await vtuService.getApiConfigs();

    const oldbal = wallet;
    const deducted = await UserModel.deductWallet(req.user.id, sellPrice);
    if (!deducted) return sendError(res, "Insufficient wallet balance.");
    const newbal = oldbal - sellPrice;

    await TransactionModel.create({
      userId: req.user.id,
      transref: ref,
      servicename: "Cable TV",
      servicedesc,
      amount: sellPrice,
      status: "Processing",
      oldbal,
      newbal,
      profit: sellPrice - costPrice,
      apiResponse: null,
      apiResponseLog: null,
    });

    const result = await vtuService.purchaseCable({
      iuc,
      planCode: plan.planCode,
      provider: provider.cableCode,
      phone,
      ref,
      apiConfigs,
    });
    await TransactionModel.updateStatus(
      ref,
      result.status,
      result.msg,
      result.apiResponseLog,
    );
    if (result.status === "fail") {
      await UserModel.creditWallet(req.user.id, sellPrice);
      return sendError(res, result.msg || "Cable subscription failed.", 400);
    }
    return sendSuccess(res, {
      ref,
      status: result.status,
      message: result.msg,
      apiResponseLog: result.apiResponseLog,
    });
  } catch (err) {
    console.error("[Cable] purchase error:", err.message);
    return sendError(res, "An unexpected error occurred. Please try again.", 500);
  }
}

module.exports = { getProviders, getPlans, verifyIUC, purchase };
