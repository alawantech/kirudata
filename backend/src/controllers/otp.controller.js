const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { sendOtpEmail } = require("../services/mailersend.service");
const { sendSuccess, sendError } = require("../helpers/response");

const OTP_EXPIRY_MINUTES = 20;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// Separate secret for OTP tokens — even if auth JWT_SECRET leaks, OTP tokens can't be forged
const OTP_JWT_SECRET = process.env.JWT_SECRET + "_otp_verify_2024";

function signOtpToken(userId, email) {
  return jwt.sign(
    { id: userId, email, purpose: "otp-verify" },
    OTP_JWT_SECRET,
    { expiresIn: `${OTP_EXPIRY_MINUTES}m` }
  );
}

function verifyOtpToken(otpToken) {
  return jwt.verify(otpToken, OTP_JWT_SECRET);
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

// Constant-time comparison to prevent timing attacks
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a).trim());
  const bufB = Buffer.from(String(b).trim());
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function sendLoginOtp(userId, email, opts = {}) {
  const now = new Date();

  // Check for recent OTP (resend cooldown)
  const recentOtp = await prisma.emailOtp.findFirst({
    where: {
      userId,
      used: false,
      createdAt: { gte: new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const elapsed = Math.floor((now.getTime() - recentOtp.createdAt.getTime()) / 1000);
    const remaining = RESEND_COOLDOWN_SECONDS - elapsed;
    return { cooldown: remaining };
  }

  // Invalidate any unused OTPs for this user
  await prisma.emailOtp.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  // Generate new OTP
  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtp.create({
    data: { userId, email, code, expiresAt },
  });

  // Send email — fire-and-forget if requested (login path shouldn't block on MailerSend)
  const emailPromise = sendOtpEmail({
    to: email,
    otpCode: code,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    purpose: "login",
  });

  if (opts.fireAndForget) {
    emailPromise.catch((err) =>
      console.error("[OTP] Background email send failed:", err.message)
    );
  } else {
    await emailPromise;
  }

  return { sent: true };
}

// POST /auth/otp/send
async function sendOtp(req, res) {
  const { identifier } = req.body;
  if (!identifier) return sendError(res, "Please provide your email or phone.");

  // Use generic error messages to prevent account enumeration
  const GENERIC_MSG = "If an account exists with that identifier, a verification code has been sent.";

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
    select: { id: true, email: true, regStatus: true },
  });

  if (!user) return sendSuccess(res, {}, GENERIC_MSG);
  if (user.regStatus === 3) return sendSuccess(res, {}, GENERIC_MSG);
  if (!user.email) return sendSuccess(res, {}, GENERIC_MSG);

  try {
    const result = await sendLoginOtp(user.id, user.email);
    if (result.cooldown) {
      return sendError(res, `Please wait ${result.cooldown} seconds before requesting a new code.`, 429);
    }
    const otpToken = signOtpToken(user.id, user.email);
    return sendSuccess(res, {
      otpToken,
      email: (() => { const [local, domain] = user.email.split("@"); if (local.length <= 6) return local.slice(0,3) + "***@" + domain; return local.slice(0,3) + "***" + local.slice(-3) + "@" + domain; })(),
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      cooldown: RESEND_COOLDOWN_SECONDS,
    }, "Verification code sent to your email.");
  } catch (err) {
    console.error("[OTP] Send error:", err.message);
    return sendError(res, "Failed to send verification code. Please try again.");
  }
}

// POST /auth/otp/verify
async function verifyOtp(req, res) {
  const { otpToken, code, deviceFingerprint } = req.body;
  if (!otpToken || !code) return sendError(res, "Please provide the verification code.");

  // Verify the OTP token using the separate OTP secret
  let decoded;
  try {
    decoded = verifyOtpToken(otpToken);
  } catch {
    return sendError(res, "Verification session expired. Please log in again.", 401);
  }

  if (decoded.purpose !== "otp-verify") {
    return sendError(res, "Invalid verification session.", 401);
  }

  const { id: userId, email } = decoded;

  // Find the LATEST unused OTP for this user
  const otpRecord = await prisma.emailOtp.findFirst({
    where: {
      userId,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return sendError(res, "Invalid or expired verification code.", 401);
  }

  // Increment attempt count and check for brute-force
  const newAttempts = (otpRecord.attempts || 0) + 1;
  if (newAttempts > MAX_OTP_ATTEMPTS) {
    // Too many wrong attempts — invalidate this OTP
    await prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });
    return sendError(res, "Too many failed attempts. Please request a new code.", 429);
  }

  // Update attempt count
  await prisma.emailOtp.update({
    where: { id: otpRecord.id },
    data: { attempts: newAttempts },
  });

  // Constant-time comparison to prevent timing attacks
  if (!safeCompare(code, otpRecord.code)) {
    return sendError(res, "Invalid verification code.", 401);
  }

  // Mark OTP as used
  await prisma.emailOtp.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // Store recognized device if fingerprint provided
  if (deviceFingerprint) {
    // Clear all OTHER accounts' device records on this device
    await prisma.recognizedDevice.deleteMany({
      where: { deviceFingerprint, userId: { not: userId } },
    }).catch(() => {});

    await prisma.recognizedDevice.upsert({
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
      },
    });
  }

  // Issue the real auth token
  const bcrypt = require("bcryptjs");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, firstname: true, lastname: true, email: true, phone: true,
      type: true, wallet: true, regStatus: true, pinDisabled: true,
    },
  });

  if (!user) return sendError(res, "Account not found.", 404);
  if (user.regStatus === 3) return sendError(res, "Account suspended.", 403);

  const token = jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    signed: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  res.cookie("auth_token", token, cookieOpts);

  return sendSuccess(res, {
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
  }, "Login successful.");
}

// POST /auth/otp/resend
async function resendOtp(req, res) {
  const { otpToken } = req.body;
  if (!otpToken) return sendError(res, "Verification session required.");

  let decoded;
  try {
    decoded = verifyOtpToken(otpToken);
  } catch {
    return sendError(res, "Verification session expired. Please log in again.", 401);
  }

  if (decoded.purpose !== "otp-verify") {
    return sendError(res, "Invalid verification session.", 401);
  }

  const { id: userId, email } = decoded;

  const now = new Date();
  const recentOtp = await prisma.emailOtp.findFirst({
    where: {
      userId,
      used: false,
      createdAt: { gte: new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const elapsed = Math.floor((now.getTime() - recentOtp.createdAt.getTime()) / 1000);
    const remaining = RESEND_COOLDOWN_SECONDS - elapsed;
    return sendError(res, `Please wait ${remaining} seconds before resending.`, 429);
  }

  // Invalidate old OTPs
  await prisma.emailOtp.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  // Generate new OTP
  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtp.create({
    data: { userId, email, code, expiresAt },
  });

  // Send email
  await sendOtpEmail({
    to: email,
    otpCode: code,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    purpose: "login",
  });

  // Issue a new OTP token (refresh expiry)
  const newOtpToken = signOtpToken(userId, email);

  return sendSuccess(res, {
    otpToken: newOtpToken,
    expiresIn: OTP_EXPIRY_MINUTES * 60,
    cooldown: RESEND_COOLDOWN_SECONDS,
  }, "New verification code sent.");
}

module.exports = { sendOtp, verifyOtp, resendOtp, sendLoginOtp, signOtpToken };
