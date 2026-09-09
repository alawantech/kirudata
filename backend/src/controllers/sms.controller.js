const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");

async function getConfig(req, res) {
  const apiConfigs = await vtuService.getApiConfigs();
  const userType = req.user.type;
  const price =
    userType === 2
      ? parseFloat(apiConfigs["bulkSmsVendorPrice"] || "0")
      : parseFloat(apiConfigs["bulkSmsUserPrice"] || "0");
  return sendSuccess(res, {
    price,
    status: apiConfigs["bulkSmsStatus"] || "Off",
    senderName: apiConfigs["bulkSmsSenderName"] || "API",
  });
}

async function send(req, res) {
  try {
    const { phone, message, senderName: userSenderName } = req.body;
    if (!phone || !message)
      return sendError(res, "phone and message are required.");
    if (message.length > 160)
      return sendError(res, "Message cannot exceed 160 characters.");

    const phoneStr = String(phone).trim();

    // Parse comma-separated numbers
    const numbers = phoneStr
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (numbers.length === 0)
      return sendError(res, "Enter at least one phone number.");
    if (numbers.length > 10000)
      return sendError(res, "Maximum 10,000 numbers per request.");

    // Validate each number is digits only (Nigerian format)
    for (const num of numbers) {
      if (!/^\d{10,14}$/.test(num)) {
        return sendError(
          res,
          `Invalid phone number: ${num}. Use 10-14 digits (e.g. 08012345678).`,
        );
      }
    }

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

    const apiConfigs = await vtuService.getApiConfigs();
    if ((apiConfigs["bulkSmsStatus"] || "Off") !== "On")
      return sendError(res, "Bulk SMS service is currently unavailable.");

    const userType = req.user.type;
    const unitPrice =
      parseFloat(
        userType === 2
          ? apiConfigs["bulkSmsVendorPrice"]
          : apiConfigs["bulkSmsUserPrice"],
      ) || 0;
    const costPrice = parseFloat(apiConfigs["bulkSmsBuyingPrice"] || "0");

    if (unitPrice <= 0)
      return sendError(res, "SMS service pricing not configured.");

    const totalCost = unitPrice * numbers.length;
    const totalCostPrice = costPrice * numbers.length;

    const wallet = await UserModel.getWallet(req.user.id);
    if (wallet < totalCost) {
      return sendError(
        res,
        `Insufficient balance. Need ₦${totalCost.toLocaleString()} for ${numbers.length} number(s) at ₦${unitPrice.toLocaleString()} each.`,
      );
    }

    const countLabel = numbers.length === 1 ? numbers[0] : `${numbers.length} numbers`;
    const servicedesc = `SMS to ${countLabel}`;
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
    const oldbal = wallet;
    const deducted = await UserModel.deductWallet(req.user.id, totalCost);
    if (!deducted) return sendError(res, "Insufficient wallet balance.");
    const newbal = oldbal - totalCost;

    await TransactionModel.create({
      userId: req.user.id,
      transref: ref,
      servicename: "Bulk SMS",
      servicedesc,
      amount: totalCost,
      status: "Processing",
      oldbal,
      newbal,
      profit: totalCost - totalCostPrice,
      apiResponse: null,
      apiResponseLog: null,
    });

    const senderName = (userSenderName || "").trim() || apiConfigs["bulkSmsSenderName"] || "API";
    const result = await vtuService.sendBulkSms({
      phone: phoneStr,
      message,
      senderName,
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
      await UserModel.creditWallet(req.user.id, totalCost);
      return sendError(res, result.msg || "SMS failed to send.", 400);
    }

    return sendSuccess(res, {
      ref,
      status: result.status,
      message: result.msg,
      numbersCount: numbers.length,
      totalCost,
    });
  } catch (err) {
    console.error("[SMS] send error:", err.message);
    return sendError(res, "An unexpected error occurred. Please try again.", 500);
  }
}

module.exports = { getConfig, send };
