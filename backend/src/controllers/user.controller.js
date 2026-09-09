const UserModel = require("../models/user.model");
const TransactionModel = require("../models/transaction.model");
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { sendSuccess, sendError } = require("../helpers/response");
const monnifyService = require("../services/monnify.service");

async function getProfile(req, res) {
  const user = await UserModel.findById(req.user.id);
  if (!user) return sendError(res, "User not found.", 404);
  const { password, pin, verCode, ...safeUser } = user;
  return sendSuccess(res, { user: safeUser });
}

async function getWallet(req, res) {
  const wallet = await UserModel.getWallet(req.user.id);
  if (wallet === null) return sendError(res, "User not found.", 404);
  return sendSuccess(res, { wallet });
}

async function getTransactions(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const transactions = await TransactionModel.findByUser(
    req.user.id,
    limit,
    offset,
  );
  return sendSuccess(res, { transactions, page });
}

async function getTransactionDetail(req, res) {
  const tx = await TransactionModel.findByRef(req.params.ref, req.user.id);
  if (!tx) return sendError(res, "Transaction not found.", 404);
  const name = (tx.servicename || "").toLowerCase();
  let category = "other";
  if (name.includes("data")) category = "data";
  else if (name.includes("airtime to cash") || name.includes("atc")) category = "atc";
  else if (name.includes("airtime")) category = "airtime";
  else if (name.includes("cable")) category = "cable";
  else if (name.includes("electricity") || name.includes("power") || name.includes("aedc") || name.includes("ekedc") || name.includes("ikedc") || name.includes("phed") || name.includes("ibedc") || name.includes("jed") || name.includes("kaedco") || name.includes("bedc") || name.includes("eedc") || name.includes("fdot") || name.includes("abuja"))
    category = "electricity";
  else if (name.includes("exam") || name.includes("waec") || name.includes("neco") || name.includes("n abteb") || name.includes("jamb")) category = "exam";
  else if (name.includes("sms")) category = "sms";
  else if (name.includes("wallet") || name.includes("fund")) category = "wallet";
  else if (name.includes("card")) category = "card";
  else if (name.includes("pin")) category = "pin";
  return sendSuccess(res, { transaction: { ...tx, category } });
}

async function getBeneficiaries(req, res) {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { userId: req.user.id },
    orderBy: { id: "desc" },
  });
  return sendSuccess(res, { beneficiaries });
}

async function addBeneficiary(req, res) {
  const { name, phone } = req.body;
  if (!name || !phone) return sendError(res, "Name and phone are required.");
  await prisma.beneficiary.create({
    data: { userId: req.user.id, name, phone },
  });
  return sendSuccess(res, {}, "Beneficiary added.", 201);
}

async function deleteBeneficiary(req, res) {
  const id = parseInt(req.params.id);
  const existing = await prisma.beneficiary.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!existing) return sendError(res, "Beneficiary not found.", 404);
  await prisma.beneficiary.delete({ where: { id } });
  return sendSuccess(res, {}, "Beneficiary removed.");
}

async function getNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ msgFor: 3 }, { msgFor: req.user.type }] },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return sendSuccess(res, { notifications });
}

async function getSupportIssues(req, res) {
  try {
    const userId = req.user.id.toString();
    const issues = await prisma.issue.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    return sendSuccess(res, { issues });
  } catch (e) {
    return sendError(res, "Failed to fetch issues.", 500);
  }
}

async function createSupportIssue(req, res) {
  try {
    const { ref, query } = req.body;
    if (!query) return sendError(res, "Query/description is required.");
    const issue = await prisma.issue.create({
      data: {
        userId: req.user.id.toString(),
        ref: ref || "",
        query,
        userEmail: req.body.email || "",
        userRead: true,
      },
    });
    return sendSuccess(res, { issue }, "Support ticket created.", 201);
  } catch (e) {
    return sendError(res, "Failed to create issue.", 500);
  }
}

async function getManualFundRequests(req, res) {
  try {
    const requests = await prisma.manualFund.findMany({
      where: { userId: req.user.id.toString(), method: "manual-fund" },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, { requests });
  } catch (e) {
    return sendError(res, "Failed to fetch manual requests.", 500);
  }
}

async function getAirtimeToCashRequests(req, res) {
  try {
    const requests = await prisma.manualFund.findMany({
      where: { userId: req.user.id.toString(), method: "airtime-to-cash" },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, { requests });
  } catch (e) {
    return sendError(res, "Failed.", 500);
  }
}

async function submitAirtimeToCash(req, res) {
  try {
    const { amount, account, network } = req.body;
    if (!amount || !account || !network)
      return sendError(res, "Amount, account and network are required.");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 100)
      return sendError(res, "Minimum amount is ₦100.");
    const request = await prisma.manualFund.create({
      data: {
        userId: req.user.id.toString(),
        amount: amt,
        account,
        method: "airtime-to-cash",
        status: 0,
      },
    });
    return sendSuccess(
      res,
      { request },
      "Request submitted successfully. Awaiting admin approval.",
      201,
    );
  } catch (e) {
    return sendError(res, "Failed.", 500);
  }
}


async function getVirtualAccounts(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        paystackCustomerCode: true,
        paystackWemaAccount: true,
        paystackTitanAccount: true,
      },
    });
    if (!user) return sendError(res, "User not found.", 404);

    // Detect if DVA creation previously failed (customer exists but no accounts)
    const dvaFailed = user.paystackCustomerCode && !user.paystackWemaAccount && !user.paystackTitanAccount;

    // Lazy generation: if Paystack accounts are missing, create them now (fire-and-forget)
    let pendingAccounts = false;
    if (!user.paystackCustomerCode || !user.paystackWemaAccount || !user.paystackTitanAccount) {
      if (!dvaFailed) {
        const paystackService = require("../services/paystack.service");
        paystackService.ensureAllAccounts({
          userId: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone || "",
          email: user.email,
        });
        pendingAccounts = true;
      }
    }

    const localAccounts = [];

    if (user.paystackWemaAccount) {
      localAccounts.push({
        bankName: "Wema Bank",
        bankCode: "035",
        accountNumber: user.paystackWemaAccount,
        accountName: `KIRU DATA/${user.firstname.toUpperCase()} ${user.lastname.toUpperCase()}`,
        status: "active",
      });
    }

    if (user.paystackTitanAccount) {
      localAccounts.push({
        bankName: "Paystack Titan",
        bankCode: "titan-paystack",
        accountNumber: user.paystackTitanAccount,
        accountName: `KIRU DATA/${user.firstname.toUpperCase()} ${user.lastname.toUpperCase()}`,
        status: "active",
      });
    }

    return sendSuccess(res, { accounts: localAccounts, pending: pendingAccounts, dvaFailed });
  } catch (e) {
    console.error("[getVirtualAccounts]", e);
    return sendError(res, "Failed to fetch virtual accounts.", 500);
  }
}

async function getReferralStats(req, res) {
  try {
    const referralService = require("../services/referral.service");
    const stats = await referralService.getReferralStats(req.user.id);
    if (!stats) return sendError(res, "User not found.", 404);
    return sendSuccess(res, { referral: stats });
  } catch (e) {
    console.error("[getReferralStats]", e);
    return sendError(res, "Failed to fetch referral stats.", 500);
  }
}

async function transferReferralToWallet(req, res) {
  try {
    const { amount } = req.body;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return sendError(res, "Invalid amount.");

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { refWallet: true, wallet: true },
    });
    if (!user) return sendError(res, "User not found.", 404);
    if (user.refWallet < amt) return sendError(res, "Insufficient referral balance.");

    const transref1 = `REF2WAL-${Date.now()}`;
    const transref2 = `REF2WAL-DEBIT-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          refWallet: { decrement: amt },
          wallet: { increment: amt },
        },
      });

      await tx.transaction.create({
        data: {
          userId: req.user.id,
          amount: amt,
          network: "",
          phone: "",
          plan: "",
          refernce: transref1,
          transref: transref1,
          status: 1,
          type: "credit",
          servicename: "Referral Transfer",
          servicedesc: `Referral to wallet transfer of ₦${amt.toFixed(2)}`,
          apiResponse: "REFERRAL_TRANSFER",
        },
      });

      await tx.transaction.create({
        data: {
          userId: req.user.id,
          amount: amt,
          network: "",
          phone: "",
          plan: "",
          refernce: transref2,
          transref: transref2,
          status: 1,
          type: "debit",
          servicename: "Referral Debit",
          servicedesc: `Referral wallet debited ₦${amt.toFixed(2)} for transfer to main wallet`,
          apiResponse: "REFERRAL_TRANSFER",
        },
      });
    });

    return sendSuccess(res, { msg: "Transfer successful.", newBalance: user.wallet + amt });
  } catch (e) {
    console.error("[transferReferralToWallet]", e);
    return sendError(res, "Transfer failed.", 500);
  }
}

async function initializePaystackPayment(req, res) {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 100)
      return sendError(res, "Minimum funding amount is ₦100.");

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstname: true, lastname: true },
    });
    if (!user) return sendError(res, "User not found.", 404);

    const paystackService = require("../services/paystack.service");
    const reference = `GCH-${user.id}-${Date.now()}`;

    const result = await paystackService.initializeTransaction({
      email: user.email,
      amount: parseFloat(amount),
      reference,
      metadata: {
        userId: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        purpose: "wallet_funding",
      },
      callbackUrl: `${process.env.FRONTEND_URL || "https://kirudata.com"}/dashboard/fund-wallet?ref=${reference}`,
    });

    return sendSuccess(res, {
      authorization_url: result.authorization_url,
      access_code: result.access_code,
      reference: result.reference,
    });
  } catch (err) {
    console.error("[Paystack] Initialize error:", err.message);
    return sendError(res, "Failed to initialize payment. Please try again.", 500);
  }
}

module.exports = {
  getProfile,
  getWallet,
  getTransactions,
  getTransactionDetail,
  getBeneficiaries,
  addBeneficiary,
  deleteBeneficiary,
  getNotifications,
  getSupportIssues,
  createSupportIssue,
  getAirtimeToCashRequests,
  getManualFundRequests,
  submitAirtimeToCash,
  getVirtualAccounts,
  requestVendorUpgrade,
  getUpgradeStatus,
  setTransactionPin,
  verifyTransactionPin,
  updateKyc,
  getReferralStats,
  transferReferralToWallet,
  initializePaystackPayment,
};

async function verifyTransactionPin(req, res) {
  const { currentPin } = req.body;
  if (!currentPin || !/^\d{4}$/.test(String(currentPin)))
    return sendError(res, "PIN must be exactly 4 digits.");

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { pin: true },
  });
  if (!user) return sendError(res, "User not found.", 404);
  if (!user.pin) return sendError(res, "No PIN set yet.");

  const match = await bcrypt.compare(String(currentPin), user.pin);
  if (!match) return sendError(res, "Current PIN is incorrect.", 401);

  return sendSuccess(res, {}, "PIN verified.");
}

async function setTransactionPin(req, res) {
  const { newPin, currentPin } = req.body;
  if (!newPin || !/^\d{4}$/.test(String(newPin)))
    return sendError(res, "Transaction PIN must be exactly 4 digits.");

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { pin: true },
  });
  if (!user) return sendError(res, "User not found.", 404);

  // If user already has a PIN, require current PIN to change it
  if (user.pin) {
    if (!currentPin)
      return sendError(res, "Current PIN is required to change your PIN.");
    const match = await bcrypt.compare(String(currentPin), user.pin);
    if (!match) return sendError(res, "Current PIN is incorrect.");
  }

  const hashed = await bcrypt.hash(String(newPin), 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { pin: hashed, pinDisabled: false },
  });

  return sendSuccess(res, {}, "Transaction PIN updated successfully.");
}

async function requestVendorUpgrade(req, res) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, "User not found.", 404);

    if (user.type === 2) return sendError(res, "You are already a vendor.");

    const existing = await prisma.upgradeRequest.findFirst({
      where: { userId, status: 0 },
    });
    if (existing)
      return sendError(res, "You already have a pending upgrade request.");

    await prisma.upgradeRequest.create({ data: { userId } });
    return sendSuccess(
      res,
      {},
      "Upgrade request submitted. Awaiting admin approval.",
    );
  } catch (e) {
    return sendError(res, "Failed.", 500);
  }
}

async function getUpgradeStatus(req, res) {
  try {
    const userId = req.user.id;
    const request = await prisma.upgradeRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, { request });
  } catch (e) {
    return sendError(res, "Failed.", 500);
  }
}

async function updateKyc(req, res) {
  try {
    const { bvn, nin, dob, method } = req.body;
    const userId = req.user.id;

    if (!method || (method !== "BVN" && method !== "NIN")) {
      return sendError(res, "Invalid verification method. Choose BVN or NIN.");
    }

    const number = method === "BVN" ? bvn : nin;
    if (!number) return sendError(res, `${method} is required.`);
    if (!dob) return sendError(res, "Date of birth is required.");

    // Use existing user name for verification record
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const firstName = user.firstname;
    const lastName = user.lastname;

    // Get site settings for charges
    const settings = await prisma.siteSetting.findFirst();
    const bvnCharge = parseFloat(settings?.kycBvnCharges || "10");
    const ninCharge = parseFloat(settings?.kycNinCharges || "70");
    const fee = method === "BVN" ? bvnCharge : ninCharge;

    // Check if user already has a verified KYC
    const existing = await prisma.kycVerification.findUnique({
      where: { userId }
    });

    if (existing && existing.status === "verified") {
      return sendError(res, "You already have a verified KYC.");
    }

    let feePaid = existing?.feePaid || false;

    // Try to deduct fee
    if (user.wallet >= fee) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { wallet: { decrement: fee } }
        }),
        prisma.transaction.create({
          data: {
            userId,
            transref: `KYC-${Date.now()}`,
            servicename: "KYC Verification",
            servicedesc: `${method} Verification Charge`,
            amount: fee.toString(),
            status: 1,
            oldbal: user.wallet.toString(),
            newbal: (user.wallet - fee).toString(),
          }
        })
      ]);
      feePaid = true;
    }

    const fullName = `${firstName || ""} ${lastName || ""}`.trim();

    // Attempt automated validation via Monnify immediately
    const validationResult = await monnifyService.validateIdentity(
      number,
      dob,
      method,
      {
        name: fullName,
        phone: user.phone,
      },
    );

    if (validationResult.success) {
      const updatedFirstName = validationResult.data.firstName || firstName;
      const updatedLastName = validationResult.data.lastName || lastName;

      // Upsert verification record as verified
      await prisma.kycVerification.upsert({
        where: { userId },
        update: {
          method, number, dob, fee, feePaid,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          status: "verified"
        },
        create: {
          userId, method, number, dob, fee, feePaid,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          status: "verified"
        }
      });

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          dob,
          firstname: updatedFirstName,
          lastname: updatedLastName,
          bvn: method === "BVN" ? number : user.bvn,
          nin: method === "NIN" ? number : user.nin,
          kycStatus: "verified"
        }
      });

      let accounts = [];
      try {
        const reserved = await monnifyService.createReservedAccount({
          userId,
          firstname: updatedFirstName,
          lastname: updatedLastName,
          email: user.email,
          bvn: method === "BVN" ? number : user.bvn,
          nin: method === "NIN" ? number : user.nin,
        });
        accounts = (reserved.accounts || []).map((acc) => ({
          bankName: acc.bankName,
          bankCode: acc.bankCode,
          accountNumber: acc.accountNumber,
        }));
      } catch (err) {
        console.error("[Monnify] Reserved account creation failed:", err.message);
      }

      const msg = feePaid 
        ? "KYC verified successfully." 
        : `KYC verified successfully. A debt of ₦${fee} has been recorded and will be deducted from your next funding.`;

      return sendSuccess(res, { verified: true, accounts }, msg);
    }

    // If validation failed, reject the attempt
    return sendError(
      res,
      validationResult.msg || "Identity verification failed. Please check your details and try again.",
    );
  } catch (e) {
    console.error("[updateKyc]", e);
    return sendError(res, "Failed to update KYC information.", 500);
  }
}
