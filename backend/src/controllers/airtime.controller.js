const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");

const PHONE_REGEX = /^0[789][01]\d{8}$/;

async function getNetworks(req, res) {
  const networks = await prisma.network.findMany({
    select: {
      id: true,
      name: true,
      networkStatus: true,
      vtuStatus: true,
      sharesellStatus: true,
      airtimepinStatus: true,
      logoUrl: true,
    },
    orderBy: { id: "asc" },
  });
  return sendSuccess(res, { networks });
}

async function getDiscount(req, res) {
  const { network, type } = req.query;
  if (!network) return sendError(res, "network query param required.");
  const where = { networkId: parseInt(network) };
  if (type) where.type = type;
  const discount = await prisma.airtimeDiscount.findFirst({
    where,
    orderBy: { id: "desc" },
  });
  return sendSuccess(res, { discounts: discount ? [discount] : [] });
}

async function purchase(req, res) {
  const { networkId, amount, phone, airtimeType } = req.body;
  if (!networkId || !amount || !phone || !airtimeType) {
    return sendError(
      res,
      "networkId, amount, phone, and airtimeType are required.",
    );
  }
  if (!PHONE_REGEX.test(phone))
    return sendError(
      res,
      "Please enter a valid 11-digit Nigerian phone number.",
    );

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 50)
    return sendError(res, "Minimum airtime amount is ₦50.");

  // Enforce transaction PIN — required if user has one set
  const { pin } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { pin: true, pinDisabled: true, regStatus: true },
  });
  if (!user) return sendError(res, "User not found.", 404);
  if (user.regStatus === 3) return sendError(res, "Account suspended.", 403);
  if (!user.pin)
    return sendError(res, "Please set your transaction PIN in your profile before making transactions.", 403);
  if (pin === undefined || pin === null || pin === "")
    return sendError(res, "Transaction PIN is required.", 401);
  const pinMatch = await bcrypt.compare(String(pin), user.pin);
  if (!pinMatch) return sendError(res, "Invalid transaction PIN.", 401);

  // Blacklist check
  const blacklisted = await vtuService.isBlacklisted(phone);
  if (blacklisted)
    return sendError(res, "This phone number is restricted. Contact support.");

  const networkDetails = await vtuService.getNetworkDetails(networkId);
  if (!networkDetails) return sendError(res, "Network not found.", 404);
  if (networkDetails.networkStatus !== "On")
    return sendError(res, "This network is currently unavailable.");

  const type = airtimeType === "Share And Sell" ? "Share And Sell" : "VTU";
  if (type === "VTU" && networkDetails.vtuStatus !== "On")
    return sendError(
      res,
      "VTU airtime is currently unavailable for this network.",
    );
  if (type === "Share And Sell" && networkDetails.sharesellStatus !== "On")
    return sendError(
      res,
      "Share & Sell is currently unavailable for this network.",
    );

  const discount = await vtuService.getAirtimeDiscount(
    parseInt(networkId),
    type,
  );
  if (!discount)
    return sendError(res, "Pricing not configured for this network.");

  const userType = req.user.type;
  const buyRate = parseFloat(discount.buyDiscount) / 100;
  let sellRate;
  if (userType === 2) sellRate = parseFloat(discount.vendorDiscount) / 100;
  else sellRate = parseFloat(discount.userDiscount) / 100;

  const costPrice = parsedAmount * buyRate;
  const sellPrice = parsedAmount * sellRate;

  if (sellPrice > parsedAmount)
    return sendError(res, "Invalid pricing configuration.");

  const wallet = await UserModel.getWallet(req.user.id);
  if (wallet < sellPrice) return sendError(res, "Insufficient wallet balance.");

  const servicedesc = networkDetails.name + " " + type + " - " + phone;
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

  try {
    await TransactionModel.create({
      userId: req.user.id,
      transref: ref,
      servicename: "Airtime",
      servicedesc,
      amount: sellPrice,
      status: "Processing",
      oldbal,
      newbal,
      profit: sellPrice - costPrice,
      apiResponse: null,
      apiResponseLog: null,
    });

    const result = await vtuService.purchaseAirtime({
      network: networkDetails,
      amount: parsedAmount,
      phone,
      ref,
      airtimeType: type,
      apiConfigs,
    });
    await TransactionModel.updateStatus(
      ref,
      result.status,
      result.msg,
      result.apiResponseLog,
    );
    if (result.status === "fail")
      await UserModel.creditWallet(req.user.id, sellPrice);
    return sendSuccess(res, {
      ref,
      status: result.status,
      message: result.msg,
      apiResponseLog: result.apiResponseLog,
    });
  } catch (err) {
    await UserModel.creditWallet(req.user.id, sellPrice);
    await TransactionModel.updateStatus(
      ref,
      "fail",
      "Internal error",
      null,
    ).catch(() => {});
    throw err;
  }
}

module.exports = { getNetworks, getDiscount, purchase };
