const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");

async function getProviders(req, res) {
  try {
    const providers = await prisma.examProvider.findMany({
      orderBy: { id: "asc" },
    });
    return sendSuccess(res, { providers });
  } catch (err) {
    console.error("[Exam] getProviders error:", err.message);
    return sendError(res, "Failed to load exam providers.", 500);
  }
}

async function purchase(req, res) {
  try {
    const { providerId, quantity } = req.body;
    if (!providerId || !quantity)
      return sendError(res, "providerId and quantity are required.");

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10)
      return sendError(res, "Quantity must be between 1 and 10.");

    // Enforce transaction PIN
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

    const provider = await prisma.examProvider.findUnique({
      where: { id: parseInt(providerId) },
    });
    if (!provider) return sendError(res, "Exam provider not found.", 404);
    if (provider.status !== "On")
      return sendError(res, "This exam provider is currently unavailable.");

    const unitSellPrice = parseFloat(provider.price);
    const unitCostPrice = parseFloat(provider.buyingPrice);
    const totalSellPrice = unitSellPrice * qty;
    const totalCostPrice = unitCostPrice * qty;

    const wallet = await UserModel.getWallet(req.user.id);
    if (wallet < totalSellPrice)
      return sendError(res, "Insufficient wallet balance.");

    const servicedesc = provider.name + " x" + qty;
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
    const deducted = await UserModel.deductWallet(req.user.id, totalSellPrice);
    if (!deducted) return sendError(res, "Insufficient wallet balance.");
    const newbal = oldbal - totalSellPrice;

    await TransactionModel.create({
      userId: req.user.id,
      transref: ref,
      servicename: "Exam Pin",
      servicedesc,
      amount: totalSellPrice,
      status: "Processing",
      oldbal,
      newbal,
      profit: totalSellPrice - totalCostPrice,
      apiResponse: null,
      apiResponseLog: null,
    });

    const result = await vtuService.purchaseExamPin({
      provider: provider.examCode,
      quantity: qty,
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
      await UserModel.creditWallet(req.user.id, totalSellPrice);
      return sendError(res, result.msg || "Exam pin purchase failed.", 400);
    }
    return sendSuccess(res, {
      ref,
      status: result.status,
      message: result.msg,
      pins: result.tokens || [],
      apiResponseLog: result.apiResponseLog,
    });
  } catch (err) {
    console.error("[Exam] purchase error:", err.message);
    return sendError(res, "An unexpected error occurred. Please try again.", 500);
  }
}

module.exports = { getProviders, purchase };
