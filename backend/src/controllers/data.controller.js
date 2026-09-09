const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const vtuService = require("../services/vtu.service");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");
const { withPurchaseLock, isBlacklistedCached } = require("../utils/purchaseGuard");

const PHONE_REGEX = /^0[789][01]\d{8}$/;

function sortByPrice(plans) {
  return plans.sort(
    (a, b) => parseFloat(a.userPrice || 0) - parseFloat(b.userPrice || 0),
  );
}

async function getNetworks(req, res) {
  const networks = await prisma.network.findMany({
    select: {
      id: true,
      name: true,
      networkStatus: true,
      smeStatus: true,
      sme2Status: true,
      giftingStatus: true,
      corporateStatus: true,
      logoUrl: true,
    },
    orderBy: { id: "asc" },
  });
  return sendSuccess(res, { networks });
}

async function getPlans(req, res) {
  const { network, type } = req.query;
  if (!network) return sendError(res, "network query param required.");

  const typeKeyMap = {
    SME: "sme",
    Gifting: "gifting",
    "Cooperate Gifting": "cooperateGifting",
  };
  const typesToCheck = type ? [type] : Object.keys(typeKeyMap);

  const apiConfigs = await vtuService.getApiConfigs();
  const configMap = Object.fromEntries(Object.entries(apiConfigs));

  // Look up network name for per-network+type enabled providers
  const networkRecord = await prisma.network.findUnique({
    where: { id: parseInt(network) },
    select: { name: true },
  });
  const netName = networkRecord ? networkRecord.name.toLowerCase() : "";

  // Determine which types have configured providers
  // Priority: per-network+type (e.g. mtnSmeEnabledProviders) → global (smeDataProvider)
  const providerTypes = typesToCheck.filter((t) => {
    const key = typeKeyMap[t] || t.toLowerCase();
    const configKey = key.charAt(0).toUpperCase() + key.slice(1);
    const perNetKey = `${netName}${configKey}EnabledProviders`;
    if (configMap[perNetKey] && configMap[perNetKey].trim().length > 0) return true;
    const globalKey = `${key}DataProvider`;
    return !!configMap[globalKey] && configMap[globalKey].trim().length > 0;
  });

  if (providerTypes.length > 0) {
    const allSlugs = new Set();
    for (const t of providerTypes) {
      const key = typeKeyMap[t] || t.toLowerCase();
      const configKey = key.charAt(0).toUpperCase() + key.slice(1);
      const perNetKey = `${netName}${configKey}EnabledProviders`;
      const perNetVal = configMap[perNetKey] || "";
      const globalVal = configMap[`${key}DataProvider`] || "";
      // Prefer per-network if set, else use global
      const raw = perNetVal.trim().length > 0 ? perNetVal : globalVal;
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => allSlugs.add(s));
    }

    // Find ALL matching DataProviders
    const providers = await prisma.dataProvider.findMany({
      where: { slug: { in: [...allSlugs] }, status: "On" },
    });

    const providerIds = providers.map((p) => p.id);
    if (providerIds.length === 0) {
      return sendSuccess(res, { plans: [] });
    }

    // Query plans from ALL providers
    const providerWhere = {
      networkId: parseInt(network),
      type: { in: providerTypes },
      status: "On",
      providerId: { in: providerIds },
    };

    const providerPlans = await prisma.providerDataPlan.findMany({
      where: providerWhere,
      include: {
        network: {
          select: {
            name: true,
            networkStatus: true,
            smeStatus: true,
            sme2Status: true,
            giftingStatus: true,
            corporateStatus: true,
          },
        },
        provider: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const typedProviderPlans = providerPlans.map((p) => ({
      ...p,
      source: "provider",
    }));

    // Also check for classic plans for types not covered by providers
    const classicTypes = typesToCheck.filter((t) => !providerTypes.includes(t));
    let allPlans = typedProviderPlans;

    if (classicTypes.length > 0) {
      const classicWhere = {
        networkId: parseInt(network),
        type: { in: classicTypes },
      };
      const classicPlans = await prisma.dataPlan.findMany({
        where: classicWhere,
        include: {
          network: {
            select: {
              name: true,
              networkStatus: true,
              smeStatus: true,
              sme2Status: true,
              giftingStatus: true,
              corporateStatus: true,
            },
          },
        },
        orderBy: { id: "asc" },
      });
      const typedClassicPlans = classicPlans.map((p) => ({
        ...p,
        source: "classic",
      }));
      allPlans = [...typedProviderPlans, ...typedClassicPlans];
    }

    // Filter by network status fields
    const netObj = allPlans[0]?.network;
    const statusMap = {
      SME: "smeStatus",
      Gifting: "giftingStatus",
      "Cooperate Gifting": "corporateStatus",
    };
    const filteredPlans = allPlans.filter((p) => {
      const field = statusMap[p.type];
      return !field || (netObj && netObj[field] === "On");
    });

    return sendSuccess(res, { plans: sortByPrice(filteredPlans) });
  }

  // No configured providers — try auto-detect providerDataPlan
  const autoWhere = { networkId: parseInt(network), status: "On" };
  if (type) autoWhere.type = type;
  const autoProviderPlans = await prisma.providerDataPlan.findMany({
    where: autoWhere,
    include: {
      network: {
        select: {
          name: true,
          networkStatus: true,
          smeStatus: true,
          sme2Status: true,
          giftingStatus: true,
          corporateStatus: true,
        },
      },
      provider: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { id: "asc" },
  });
  if (autoProviderPlans.length > 0) {
    const netObj3 = autoProviderPlans[0]?.network;
    const statusMap3 = {
      SME: "smeStatus",
      Gifting: "giftingStatus",
      "Cooperate Gifting": "corporateStatus",
    };
    const filteredAuto = autoProviderPlans.filter((p) => {
      const field = statusMap3[p.type];
      return !field || (netObj3 && netObj3[field] === "On");
    });
    return sendSuccess(res, {
      plans: sortByPrice(filteredAuto.map((p) => ({ ...p, source: "provider" }))),
    });
  }

  // Fall back to classic DataPlan
  const where = { networkId: parseInt(network) };
  if (type) where.type = type;
  const plans = await prisma.dataPlan.findMany({
    where,
    include: {
      network: {
        select: {
          name: true,
          networkStatus: true,
          smeStatus: true,
          sme2Status: true,
          giftingStatus: true,
          corporateStatus: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
  const netObj4 = plans[0]?.network;
  const statusMap4 = {
    SME: "smeStatus",
    Gifting: "giftingStatus",
    "Cooperate Gifting": "corporateStatus",
  };
  const filteredClassic = plans.filter((p) => {
    const field = statusMap4[p.type];
    return !field || (netObj4 && netObj4[field] === "On");
  });
  return sendSuccess(res, {
    plans: sortByPrice(filteredClassic.map((p) => ({ ...p, source: "classic" }))),
  });
}

async function purchase(req, res) {
  const { planId, phone } = req.body;
  if (!planId || !phone)
    return sendError(res, "planId and phone are required.");
  if (!PHONE_REGEX.test(phone))
    return sendError(
      res,
      "Please enter a valid 11-digit Nigerian phone number.",
    );

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

  const blacklisted = await isBlacklistedCached(phone);
  if (blacklisted)
    return sendError(res, "This phone number is restricted. Contact support.");

  const { planSource } = req.body;
  const plan = await vtuService.getDataPlan(planId, planSource);
  if (!plan) return sendError(res, "Data plan not found.", 404);
  if (plan.network.networkStatus !== "On")
    return sendError(res, "This network is currently unavailable.");

  const planType = (plan.type || "SME").toUpperCase();
  const statusMap = {
    SME: "smeStatus",
    GIFTING: "giftingStatus",
    "COOPERATE GIFTING": "corporateStatus",
  };
  const statusField = statusMap[planType];
  const networkFieldVal = statusField ? plan.network[statusField] : undefined;
  if (networkFieldVal && networkFieldVal !== "On")
    return sendError(
      res,
      planType + " data is currently unavailable for this network.",
    );

  const userType = req.user.type;
  let sellPrice;
  if (userType === 2) sellPrice = parseFloat(plan.vendorPrice);
  else sellPrice = parseFloat(plan.userPrice);

  const costPrice = parseFloat(plan.buyingPrice);
  const wallet = await UserModel.getWallet(req.user.id);
  if (wallet < sellPrice) return sendError(res, "Insufficient wallet balance.");

  const servicedesc = plan.network.name + " " + plan.name + " - " + phone;
  const isDuplicate = await TransactionModel.checkDuplicate(
    req.user.id,
    servicedesc,
  );
  if (isDuplicate)
    return sendError(
      res,
      "Possible duplicate transaction. Please verify and try again after 30 seconds.",
    );

  return withPurchaseLock(req.user.id, async () => {
    const ref = generateRef();
    const apiConfigs = await vtuService.getApiConfigs();

    const oldbal = await UserModel.getWallet(req.user.id);
    if (oldbal < sellPrice) return sendError(res, "Insufficient wallet balance.");
    const deducted = await UserModel.deductWallet(req.user.id, sellPrice);
    if (!deducted) return sendError(res, "Insufficient wallet balance.");
    const newbal = oldbal - sellPrice;

    try {
      await TransactionModel.create({
        userId: req.user.id,
        transref: ref,
        servicename: "Data",
        servicedesc,
        amount: sellPrice,
        status: "Processing",
        oldbal,
        newbal,
        profit: sellPrice - costPrice,
        apiResponse: null,
        apiResponseLog: null,
      });

      const result = await vtuService.purchaseData({
        plan,
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
      if (result.status === "fail")
        await UserModel.creditWallet(req.user.id, sellPrice);
      return sendSuccess(res, {
        ref,
        status: result.status,
        message: result.msg,
        apiResponseLog: result.apiResponseLog,
      });
    } catch (err) {
      console.error("[Data] purchase error:", err.message);
      try {
        await UserModel.creditWallet(req.user.id, sellPrice);
      } catch (refundErr) {
        console.error("[Data] REFUND FAILED:", refundErr.message, { userId: req.user.id, ref, amount: sellPrice });
      }
      try {
        await TransactionModel.updateStatus(ref, "fail", "Internal error", null);
      } catch (statusErr) {
        console.error("[Data] STATUS UPDATE FAILED:", statusErr.message, { ref });
      }
      return sendError(res, "An unexpected error occurred. Please try again.", 500);
    }
  });
}

module.exports = { getNetworks, getPlans, purchase };
