const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { generateRef } = require("../helpers/generateRef");
const { sendSuccess, sendError } = require("../helpers/response");
const UserModel = require("../models/user.model");

const MTN_PREFIXES = [
  "0803", "0806", "0816", "0903", "0906", "0810", "0813", "0902", "0908", "0916",
  "0814", "0703", "0706", "0906", "0913",
];
const AIRTEL_PREFIXES = [
  "0802", "0808", "0812", "0708", "0701", "0902", "0907", "0901", "0812",
];

function detectNetwork(phone) {
  const prefix = phone.substring(0, 4);
  if (MTN_PREFIXES.includes(prefix)) return "MTN";
  if (AIRTEL_PREFIXES.includes(prefix)) return "AIRTEL";
  return null;
}

async function getConfig(req, res) {
  try {
    const settings = await prisma.siteSetting.findFirst();
    const enabledNetworks = [];
    if (settings?.atcEnabled === "yes") {
      if (settings.atcMtnNumber) enabledNetworks.push({ id: "MTN", label: "MTN", receiveNumber: settings.atcMtnNumber });
      if (settings.atcAirtelNumber) enabledNetworks.push({ id: "AIRTEL", label: "Airtel", receiveNumber: settings.atcAirtelNumber });
    }
    return sendSuccess(res, {
      enabled: settings?.atcEnabled === "yes",
      rate: parseFloat(settings?.atcRate || "80"),
      minAmount: parseFloat(settings?.atcMinAmount || "100"),
      maxAmount: parseFloat(settings?.atcMaxAmount || "50000"),
      networks: enabledNetworks,
    });
  } catch (err) {
    console.error("[ATC] getConfig error:", err.message);
    return sendError(res, "Failed to load config.", 500);
  }
}

async function submit(req, res) {
  try {
    const { network, senderNumber, amount, payoutMethod, bankName, bankAccount, bankAccountName } = req.body;

    if (!network || !senderNumber || !amount || !payoutMethod)
      return sendError(res, "All fields are required.");

    const phone = String(senderNumber).trim();
    if (!/^\d{11}$/.test(phone))
      return sendError(res, "Enter a valid 11-digit phone number.");

    const detected = detectNetwork(phone);
    if (detected !== network.toUpperCase())
      return sendError(res, `This number appears to be ${detected || "unknown"}, not ${network}. Use the correct network.`);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 100)
      return sendError(res, "Minimum amount is ₦100.");

    const settings = await prisma.siteSetting.findFirst();
    if (settings?.atcEnabled !== "yes")
      return sendError(res, "Airtime to Cash is currently disabled.");

    const maxAmt = parseFloat(settings?.atcMaxAmount || "50000");
    if (amt > maxAmt)
      return sendError(res, `Maximum amount is ₦${maxAmt.toLocaleString()}.`);

    const receiveNumber = network.toUpperCase() === "MTN" ? settings.atcMtnNumber : settings.atcAirtelNumber;
    if (!receiveNumber)
      return sendError(res, `${network} is not currently enabled.`);

    const rate = parseFloat(settings?.atcRate || "80");
    const receiveAmount = (amt * rate) / 100;

    // Verify PIN
    const userRecord = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { pin: true, regStatus: true },
    });
    if (!userRecord) return sendError(res, "User not found.", 404);
    if (userRecord.regStatus === 3) return sendError(res, "Account suspended.", 403);

    if (payoutMethod === "bank") {
      if (!bankName || !bankAccount || !bankAccountName)
        return sendError(res, "Bank details are required for bank payout.");
    }

    const ref = generateRef();
    const request = await prisma.airtimeToCash.create({
      data: {
        userId: req.user.id,
        network: network.toUpperCase(),
        senderNumber: phone,
        amount: amt,
        rate,
        receiveAmount,
        payoutMethod,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankAccountName: bankAccountName || null,
        status: "pending",
        ref,
      },
    });

    // Create a pending transaction in the user's history (visible immediately)
    try {
      const u = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { wallet: true },
      });
      await prisma.transaction.create({
        data: {
          userId: req.user.id,
          transref: ref,
          servicename: "Airtime to Cash",
          servicedesc: `${network.toUpperCase()} ₦${amt.toLocaleString()} → ₦${receiveAmount.toLocaleString()} (${payoutMethod === "wallet" ? "wallet" : "bank"})`,
          amount: receiveAmount.toString(),
          status: 2,
          oldbal: (u?.wallet || 0).toString(),
          newbal: (u?.wallet || 0).toString(),
          profit: 0,
        },
      });
    } catch (txErr) {
      console.error("[ATC] failed to create history transaction:", txErr.message);
    }

    return sendSuccess(res, { request, receiveNumber, receiveAmount }, "Request submitted. Transfer airtime to the number shown, then wait for admin verification.", 201);
  } catch (err) {
    console.error("[ATC] submit error:", err.message);
    return sendError(res, "An unexpected error occurred.", 500);
  }
}

async function getHistory(req, res) {
  try {
    const requests = await prisma.airtimeToCash.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, { requests });
  } catch (err) {
    console.error("[ATC] history error:", err.message);
    return sendError(res, "Failed to load history.", 500);
  }
}

module.exports = { getConfig, submit, getHistory };
