const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");

async function getProviders(req, res) {
  try {
    const providers = await prisma.electricityProvider.findMany({
      orderBy: { id: "asc" },
    });
    return sendSuccess(res, { providers });
  } catch (err) {
    console.error("[Electricity] getProviders error:", err.message);
    return sendError(res, "Failed to load electricity providers.", 500);
  }
}

async function verifyMeter(req, res) {
  try {
    const { meter, provider, meterType } = req.body;
    if (!meter || !provider || !meterType)
      return sendError(res, "meter, provider, and meterType are required.");
    const providerRecord = await prisma.electricityProvider.findUnique({
      where: { id: parseInt(provider) },
    });
    if (!providerRecord) return sendError(res, "Provider not found.", 404);
    if (providerRecord.status !== "On")
      return sendError(
        res,
        "This electricity provider is currently unavailable.",
      );
    const apiConfigs = await vtuService.getApiConfigs();
    const result = await vtuService.verifyMeter({
      meter,
      provider: providerRecord.electricityCode,
      meterType,
      apiConfigs,
    });
    if (result.status === "fail") return sendError(res, result.msg);
    const customer = result.customer || {};
    return sendSuccess(res, {
      customerName: customer.name || customer.customerName || null,
      address: customer.address || null,
      message: customer.message || "Verification successful",
    });
  } catch (err) {
    console.error("[Electricity] verifyMeter error:", err.message);
    return sendError(res, "Failed to verify meter. Please try again.", 500);
  }
}

async function purchase(req, res) {
  try {
    const { providerId, meter, meterType, amount, phone, customerName, address } = req.body;
    if (!providerId || !meter || !meterType || !amount || !phone) {
      return sendError(
        res,
        "providerId, meter, meterType, amount, and phone are required.",
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1000)
      return sendError(res, "Minimum electricity amount is ₦1,000.");

    const siteSettings = await prisma.siteSetting.findFirst();
    const electricityFee = parseFloat(siteSettings?.electricityFee || "0");
    const totalDeducted = parsedAmount + electricityFee;

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

    const provider = await prisma.electricityProvider.findUnique({
      where: { id: parseInt(providerId) },
    });
    if (!provider) return sendError(res, "Provider not found.", 404);
    if (provider.status !== "On")
      return sendError(
        res,
        "This electricity provider is currently unavailable.",
      );

    const wallet = await UserModel.getWallet(req.user.id);
    if (wallet < totalDeducted)
      return sendError(res, "Insufficient wallet balance.");

    const servicedesc =
      provider.name +
      " " +
      meterType +
      " - " +
      meter +
      (customerName ? " | " + customerName : "") +
      (address ? " | " + address : "");
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
    const deducted = await UserModel.deductWallet(req.user.id, totalDeducted);
    if (!deducted) return sendError(res, "Insufficient wallet balance.");
    const newbal = oldbal - totalDeducted;

    await TransactionModel.create({
      userId: req.user.id,
      transref: ref,
      servicename: "Electricity",
      servicedesc,
      amount: totalDeducted,
      status: "Processing",
      oldbal,
      newbal,
      profit: electricityFee,
      apiResponse: null,
      apiResponseLog: null,
    });

    const result = await vtuService.purchaseElectricity({
      meter,
      provider: provider.electricityCode,
      amount: parsedAmount,
      phone,
      meterType,
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
      await UserModel.creditWallet(req.user.id, totalDeducted);
      return sendError(res, result.msg || "Electricity purchase failed.", 400);
    }
    return sendSuccess(res, {
      ref,
      status: result.status,
      message: result.msg,
      token: result.token,
      apiResponseLog: result.apiResponseLog,
    });
  } catch (err) {
    console.error("[Electricity] purchase error:", err.message);
    return sendError(res, "An unexpected error occurred. Please try again.", 500);
  }
}

module.exports = { getProviders, verifyMeter, purchase };
