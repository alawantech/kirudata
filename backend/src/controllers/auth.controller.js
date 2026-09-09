const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const prisma = require("../config/prisma");
const { sendSuccess, sendError } = require("../helpers/response");
const monnifyService = require("../services/monnify.service");
const paystackService = require("../services/paystack.service");
const { blacklistToken } = require("../utils/tokenBlacklist");

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    signed: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

function signToken(id, type) {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

/**
 * When a user logs in or registers on a device, clear all OTHER users'
 * RecognizedDevice records for that device fingerprint.
 * This ensures only the current account is "remembered" on this device.
 * Other accounts will need OTP to log in again on this device.
 */
async function clearOtherDeviceRecords(currentUserId, deviceFingerprint) {
  if (!deviceFingerprint) return;
  try {
    await prisma.recognizedDevice.deleteMany({
      where: {
        deviceFingerprint,
        userId: { not: currentUserId },
      },
    });
  } catch (err) {
    console.error("[Auth] Failed to clear other device records:", err.message);
  }
}

async function register(req, res) {
  const { fullname, email, phone, password, referral, deviceFingerprint } = req.body;
  if (!fullname || !email || !phone || !password) {
    return sendError(res, "Please fill in all required fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, "Please enter a valid email address.");
  }
  const parts = fullname.trim().split(/\s+/);
  const firstname = parts[0];
  const lastname = parts.slice(1).join(" ") || parts[0];
  if (password.length < 8)
    return sendError(res, "Password must be at least 8 characters.");
  if (!/^0[789][01]\d{8}$/.test(phone))
    return sendError(res, "Please enter a valid Nigerian phone number.");
  try {
    const userId = await UserModel.create({
      firstname,
      lastname,
      email,
      phone,
      password,
      referral,
    });
    const token = signToken(userId, 1);
    res.cookie("auth_token", token, cookieOptions());

    // Fire-and-forget: create Monnify reserved account in background
    // Do NOT await — registration should not fail if Monnify is down
    monnifyService
      .createReservedAccount({ userId, firstname, lastname, email })
      .catch((err) =>
        console.error(
          "[Monnify] Failed to create reserved account:",
          err.message,
        ),
      );

    // Fire-and-forget: create Paystack customer + DVAs in background
    paystackService
      .ensureAllAccounts({ userId, firstname, lastname, phone, email })
      .catch((err) =>
        console.error(
          "[Paystack] Failed to create accounts:",
          err.message,
        ),
      );

    // Recognize this device so user doesn't get OTP on next login
    if (deviceFingerprint) {
      // First: clear all OTHER accounts' device records on this device
      await clearOtherDeviceRecords(userId, deviceFingerprint);
      // Then: create recognized device for this new user
      prisma.recognizedDevice.upsert({
        where: {
          userId_deviceFingerprint: {
            userId,
            deviceFingerprint,
          },
        },
        update: {},
        create: {
          userId,
          deviceFingerprint,
          lastSeen: new Date(),
        },
      }).catch((err) =>
        console.error("[Register] Failed to save device fingerprint:", err.message),
      );
    }

    return sendSuccess(
      res,
      { token, userId },
      "Account created successfully.",
      201,
    );
  } catch (err) {
    if (err.code === "P2002")
      return sendError(
        res,
        "An account with this email or phone already exists.",
      );
    throw err;
  }
}

async function login(req, res) {
  const { identifier, password, deviceFingerprint } = req.body;
  if (!identifier || !password)
    return sendError(res, "Please provide your email/phone and password.");
  const user = await UserModel.findByEmailOrPhone(identifier);
  if (!user) return sendError(res, "Invalid credentials.", 401);
  const match = await bcrypt.compare(password, user.password);
  if (!match) return sendError(res, "Invalid credentials.", 401);
  if (user.regStatus === 3)
    return sendError(res, "Account suspended. Please contact support.", 401);

  // Check if device is recognized
  let isDeviceRecognized = false;
  // Accounts that never require OTP at login (e.g. Play Store test account)
  const OTP_BYPASS_PHONES = ["08032230464"];
  if (user.phone && OTP_BYPASS_PHONES.includes(user.phone)) {
    isDeviceRecognized = true;
  } else if (deviceFingerprint && user.email) {
    const recognized = await prisma.recognizedDevice.findUnique({
      where: {
        userId_deviceFingerprint: {
          userId: user.id,
          deviceFingerprint,
        },
      },
    });
    isDeviceRecognized = !!recognized;
  }

  // If device not recognized, send OTP instead of logging in directly
  const OTP_ENABLED = process.env.OTP_ENABLED !== "false";
  if (OTP_ENABLED && !isDeviceRecognized && user.email) {
    const { sendLoginOtp, signOtpToken } = require("./otp.controller");
    try {
      // Build the OTP record + token FIRST, respond immediately.
      // Email is sent in background so the user isn't blocked on MailerSend latency.
      const result = await sendLoginOtp(user.id, user.email, { fireAndForget: true });
      if (result.cooldown) {
        return sendError(res, `Please wait ${result.cooldown} seconds before requesting a new code.`, 429);
      }
      const otpToken = signOtpToken(user.id, user.email);
      return sendSuccess(
        res,
        {
          requiresOtp: true,
          otpToken,
          email: (() => { const [local, domain] = user.email.split("@"); if (local.length <= 6) return local.slice(0,3) + "***@" + domain; return local.slice(0,3) + "***" + local.slice(-3) + "@" + domain; })(),
        },
        "Verification code sent to your email.",
      );
    } catch (err) {
      console.error("[Login] Failed to send OTP:", err.message);
      return sendError(res, "Failed to send verification code. Please try again.");
    }
  }

  await UserModel.updateLastActivity(user.id);

  // When logging in on this device, clear all OTHER accounts' device records
  // so only this account is remembered on this device — fire-and-forget
  if (deviceFingerprint) {
    clearOtherDeviceRecords(user.id, deviceFingerprint).catch(() => {});
    prisma.recognizedDevice.upsert({
      where: {
        userId_deviceFingerprint: { userId: user.id, deviceFingerprint },
      },
      update: { lastSeen: new Date() },
      create: { userId: user.id, deviceFingerprint, lastSeen: new Date() },
    }).catch(() => {});
  }

  const token = signToken(user.id, user.type);
  res.cookie("auth_token", token, cookieOptions());
  return sendSuccess(
    res,
    {
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        type: user.type,
        wallet: user.wallet,
        verified: user.regStatus === 1,
        pinEnabled: !user.pinDisabled,
      },
    },
    "Login successful.",
  );
}

function logout(req, res) {
  // Extract the raw token and blacklist it so it can't be reused
  let raw;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    raw = req.headers.authorization.split(" ")[1];
  } else if (req.signedCookies?.auth_token) {
    raw = req.signedCookies.auth_token;
  }
  if (raw) {
    try {
      const decoded = require("jsonwebtoken").decode(raw);
      if (decoded?.exp) blacklistToken(raw, decoded.exp * 1000);
      // Remove all recognized devices so next login requires OTP
      if (decoded?.id) {
        prisma.recognizedDevice.deleteMany({ where: { userId: decoded.id } }).catch(() => {});
      }
    } catch {}
  }
  res.clearCookie("auth_token", {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return sendSuccess(res, {}, "Logged out successfully.");
}

async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      type: true,
      wallet: true,
      refWallet: true,
      kycStatus: true,
      state: true,
      regStatus: true,
      pinDisabled: true,
      regDate: true,
      accountReference: true,
      wemaBankRef: true,
      sterlingBankRef: true,
      paystackCustomerCode: true,
      paystackWemaAccount: true,
      paystackTitanAccount: true,
    },
  });
  if (!user) return sendError(res, "User not found.", 404);

  // Lazy generation: if Paystack accounts are missing, create them now (fire-and-forget)
  let pendingAccounts = false;
  if (!user.paystackCustomerCode || !user.paystackWemaAccount || !user.paystackTitanAccount) {
    pendingAccounts = true;
    paystackService
      .ensureAllAccounts({
        userId: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        phone: user.phone,
        email: user.email,
      });
  }

  // Build virtual account list from fields that are set
  const virtualAccounts = [];
  if (user.paystackWemaAccount)
    virtualAccounts.push({
      bankName: "Wema Bank",
      bankCode: "035",
      accountNumber: user.paystackWemaAccount,
    });
  if (user.paystackTitanAccount)
    virtualAccounts.push({
      bankName: "Paystack Titan",
      bankCode: "titan-paystack",
      accountNumber: user.paystackTitanAccount,
    });

  // Count referrals
  const referralCount = await prisma.user.count({
    where: { referral: user.phone },
  });

  return sendSuccess(res, {
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      type: user.type,
      wallet: user.wallet,
      refWallet: user.refWallet,
      kycStatus: user.kycStatus,
      state: user.state,
      verified: user.regStatus === 1,
      pinEnabled: !user.pinDisabled,
      memberSince: user.regDate,
      accountReference: user.accountReference,
      virtualAccounts,
      pendingAccounts,
      referralCount,
    },
  });
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return sendError(res, "Please provide both old and new passwords.");
  if (newPassword.length < 8)
    return sendError(res, "New password must be at least 8 characters.");
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true },
  });
  if (!user) return sendError(res, "User not found.", 404);
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return sendError(res, "Old password is incorrect.");
  await UserModel.updatePassword(req.user.id, newPassword);

  // Invalidate the current session token so a stolen token can't be reused
  let raw;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    raw = req.headers.authorization.split(" ")[1];
  } else if (req.signedCookies?.auth_token) {
    raw = req.signedCookies.auth_token;
  }
  if (raw) {
    try {
      const decoded = jwt.decode(raw);
      if (decoded?.exp) blacklistToken(raw, decoded.exp * 1000);
    } catch {}
  }

  // Issue a fresh token so the user stays logged in after the change
  const newToken = signToken(req.user.id, req.user.type);
  res.cookie("auth_token", newToken, cookieOptions());
  return sendSuccess(
    res,
    { token: newToken },
    "Password updated successfully.",
  );
}

async function checkAccount(req, res) {
  const { email, phone } = req.body;

  try {
    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailExists) {
        return sendSuccess(res, { exists: true, field: "email" }, "Email already registered.", 200);
      }
    }

    if (phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });
      if (phoneExists) {
        return sendSuccess(res, { exists: true, field: "phone" }, "Phone number already registered.", 200);
      }
    }

    return sendSuccess(res, { exists: false }, "Account available for registration.", 200);
  } catch (err) {
    return sendError(res, "Error checking account availability.");
  }
}

module.exports = { register, login, logout, getMe, changePassword, checkAccount };
