const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");

const NETWORK_NAMES = { 1: "MTN", 2: "Airtel", 3: "GLO", 4: "9Mobile" };

async function getPlans(req, res) {
  const { network } = req.query;
  const where = { status: { in: ["On", "ON", "on"] } };
  if (network) where.networkId = parseInt(network);
  const plans = await prisma.rechargeCardPlan.findMany({
    where,
    orderBy: [{ networkId: "asc" }, { userPrice: "asc" }],
  });
  return sendSuccess(res, { plans });
}

async function getNetworks(req, res) {
  const plans = await prisma.rechargeCardPlan.findMany({
    where: { status: { in: ["On", "ON", "on"] } },
    select: { networkId: true, networkName: true },
    distinct: ["networkId"],
  });
  const NETWORK_NAMES = { 1: "MTN", 2: "Airtel", 3: "GLO", 4: "9Mobile" };
  const networks = plans.map((p) => ({
    id: p.networkId,
    name: p.networkName || NETWORK_NAMES[p.networkId] || "Unknown",
  }));
  return sendSuccess(res, { networks });
}

async function purchase(req, res) {
  const { planId, quantity, cardName } = req.body;
  if (!planId || !quantity)
    return sendError(res, "planId and quantity are required.");
  if (!cardName || !cardName.trim())
    return sendError(res, "Card name is required.");
  if (cardName.trim().length > 50)
    return sendError(res, "Card name must be 50 characters or less.");

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 1 || qty > 10)
    return sendError(res, "Quantity must be between 1 and 10.");

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

  const plan = await prisma.rechargeCardPlan.findUnique({
    where: { id: parseInt(planId) },
  });
  if (!plan) return sendError(res, "Plan not found.", 404);
  if (plan.status.toUpperCase() !== "ON")
    return sendError(res, "This recharge card plan is currently unavailable.");

  const apiConfigs = await vtuService.getApiConfigs();
  if ((apiConfigs["rechargeCardStatus"] || "Off").toUpperCase() !== "ON")
    return sendError(res, "Recharge card service is currently unavailable.");

  const userType = req.user.type;
  const unitSellPrice = parseFloat(
    userType === 2 ? plan.vendorPrice : plan.userPrice,
  );
  const unitCostPrice = parseFloat(plan.buyingPrice || "0");
  const totalSellPrice = unitSellPrice * qty;
  const totalCostPrice = unitCostPrice * qty;

  const wallet = await UserModel.getWallet(req.user.id);
  if (wallet < totalSellPrice)
    return sendError(res, "Insufficient wallet balance.");

  const networkLabel =
    plan.networkName || NETWORK_NAMES[plan.networkId] || "Network";
  const servicedesc = `${networkLabel} ${plan.name} x${qty} Recharge Card`;
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
  const deducted = await UserModel.deductWallet(req.user.id, totalSellPrice);
  if (!deducted) return sendError(res, "Insufficient wallet balance.");
  const newbal = oldbal - totalSellPrice;

  try {
    await TransactionModel.create({
      userId: req.user.id,
      transref: ref,
      servicename: "Recharge Card",
      servicedesc,
      amount: totalSellPrice,
      status: "Processing",
      oldbal,
      newbal,
      profit: totalSellPrice - totalCostPrice,
      apiResponse: null,
      apiResponseLog: null,
    });

    const result = await vtuService.purchaseRechargeCard({
      networkId: plan.networkId,
      planType: plan.planType,
      quantity: qty,
      cardName: cardName.trim(),
      ref,
      apiConfigs,
    });

    await TransactionModel.updateStatus(
      ref,
      result.status,
      result.msg,
      result.apiResponseLog,
    );
    if (result.status === "fail")
      await UserModel.creditWallet(req.user.id, totalSellPrice);

    if (result.status === "fail" || result.status === "error")
      return sendError(res, result.msg || "Recharge card purchase failed.");

    return sendSuccess(res, {
      ref,
      status: result.status,
      message: result.msg,
      cards: result.cards || [],
      loadPin: result.loadPin,
      checkBalance: result.checkBalance,
    });
  } catch (err) {
    await UserModel.creditWallet(req.user.id, totalSellPrice);
    await TransactionModel.updateStatus(
      ref,
      "fail",
      "Internal error",
      null,
    ).catch(() => {});
    throw err;
  }
}

module.exports = { getPlans, getNetworks, purchase };
