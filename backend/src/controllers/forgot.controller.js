const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { sendOtpEmail } = require("../services/mailersend.service");
const { sendSuccess, sendError } = require("../helpers/response");

const OTP_EXPIRY_MINUTES = 20;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY = "15m";

// Separate secret for forgot/reset tokens — isolated from auth + OTP tokens
const RESET_JWT_SECRET = process.env.JWT_SECRET + "_reset_token_2024";

function signResetToken(userId, purpose) {
  return jwt.sign(
    { id: userId, purpose },
    RESET_JWT_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY }
  );
}

function verifyResetToken(token) {
  return jwt.verify(token, RESET_JWT_SECRET);
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

async function sendOtp(userId, email, purpose, purposeLabel, emailPurpose) {
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
    return { cooldown: RESEND_COOLDOWN_SECONDS - elapsed };
  }

  await prisma.emailOtp.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.emailOtp.create({
    data: { userId, email, code, expiresAt },
  });

  await sendOtpEmail({
    to: email,
    otpCode: code,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    purpose: emailPurpose || "login",
  });

  return { sent: true };
}

async function verifyOtpAndGetToken(userId, code, purpose) {
  const otpRecord = await prisma.emailOtp.findFirst({
    where: {
      userId,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) return null;

  // Constant-time comparison to prevent timing attacks
  if (!safeCompare(otpRecord.code, code)) {
    // Track failed attempt
    await prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    // Invalidate if too many attempts
    if (otpRecord.attempts + 1 >= MAX_OTP_ATTEMPTS) {
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
    }
    return null;
  }

  await prisma.emailOtp.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return signResetToken(userId, purpose);
}

// ─── FORGOT PASSWORD ───

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, "Please provide your registered email.");

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true },
    });

    // Generic message to prevent account enumeration
    if (!user) {
      return sendSuccess(res, {}, "If an account exists with that email, a verification code has been sent.");
    }

    const result = await sendOtp(user.id, user.email, "forgot-password", "password reset", "password reset");
    if (result.cooldown) {
      return sendError(res, `Please wait ${result.cooldown} seconds before requesting a new code.`, 429);
    }

    const otpToken = signResetToken(user.id, "forgot-password");
    return sendSuccess(res, {
      otpToken,
      email: user.email.replace(/(.{3})(.*)(.{0,}@.*)/, (_, a, b, c) => {
        const [local, domain] = user.email.split("@");
        if (local.length <= 6) return local.slice(0,3) + "***@" + domain;
        return local.slice(0,3) + "***" + local.slice(-3) + "@" + domain;
      }),
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      cooldown: RESEND_COOLDOWN_SECONDS,
    }, "If an account exists with that email, a verification code has been sent.");
  } catch (err) {
    console.error("[ForgotPassword] Send error:", err.message);
    return sendError(res, "Failed to send verification code. Please try again.");
  }
}

async function verifyForgotPassword(req, res) {
  try {
    const { otpToken, code } = req.body;
    if (!otpToken || !code) return sendError(res, "Please provide the verification code.");

    let decoded;
    try {
      decoded = verifyResetToken(otpToken);
    } catch {
      return sendError(res, "Verification session expired. Please try again.", 401);
    }

    if (decoded.purpose !== "forgot-password") {
      return sendError(res, "Invalid verification session.", 401);
    }

    const resetToken = await verifyOtpAndGetToken(decoded.id, code, "reset-password");
    if (!resetToken) {
      return sendError(res, "Invalid or expired verification code.", 401);
    }

    return sendSuccess(res, { resetToken }, "Email verified. You can now set a new password.");
  } catch (err) {
    console.error("[ForgotPassword] Verify error:", err.message);
    return sendError(res, "Verification failed. Please try again.");
  }
}

async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return sendError(res, "Please provide the reset code and new password.");
    if (!/^\d{8}$/.test(newPassword)) return sendError(res, "Password must be exactly 8 digits.");

    let decoded;
    try {
      decoded = verifyResetToken(resetToken);
    } catch {
      return sendError(res, "Reset session expired. Please start over.", 401);
    }

    if (decoded.purpose !== "reset-password") {
      return sendError(res, "Invalid reset session.", 401);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashed },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, firstname: true, lastname: true, email: true, phone: true,
        type: true, wallet: true, regStatus: true, pinDisabled: true,
      },
    });

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
    }, "Password reset successful.");
  } catch (err) {
    console.error("[ForgotPassword] Reset error:", err.message);
    return sendError(res, "Failed to reset password. Please try again.");
  }
}

async function resendForgotPassword(req, res) {
  try {
    const { otpToken } = req.body;
    if (!otpToken) return sendError(res, "Verification session required.");

    let decoded;
    try {
      decoded = verifyResetToken(otpToken);
    } catch {
      return sendError(res, "Verification session expired. Please start over.", 401);
    }

    if (decoded.purpose !== "forgot-password") {
      return sendError(res, "Invalid verification session.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true },
    });
    if (!user) return sendError(res, "Account not found.", 404);

    const result = await sendOtp(user.id, user.email, "forgot-password", "password reset", "password reset");
    if (result.cooldown) {
      return sendError(res, `Please wait ${result.cooldown} seconds before requesting a new code.`, 429);
    }

    const newOtpToken = signResetToken(user.id, "forgot-password");
    return sendSuccess(res, {
      otpToken: newOtpToken,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      cooldown: RESEND_COOLDOWN_SECONDS,
    }, "New verification code sent!");
  } catch (err) {
    console.error("[ForgotPassword] Resend error:", err.message);
    return sendError(res, "Failed to resend code. Please try again.");
  }
}

// ─── FORGOT PIN ───

async function forgotPin(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, pinDisabled: true },
    });
    if (!user) return sendError(res, "Account not found.", 404);
    if (!user.email) return sendError(res, "No email on file. Please contact support.");
    if (user.pinDisabled) return sendError(res, "You don't have a PIN set. Please set one from your profile.");

    const result = await sendOtp(user.id, user.email, "forgot-pin", "PIN reset", "PIN reset");
    if (result.cooldown) {
      return sendError(res, `Please wait ${result.cooldown} seconds before requesting a new code.`, 409);
    }

    const otpToken = signResetToken(user.id, "forgot-pin");
    return sendSuccess(res, {
      otpToken,
      email: user.email.replace(/(.{3})(.*)(.{0,}@.*)/, (_, a, b, c) => {
        const [local, domain] = user.email.split("@");
        if (local.length <= 6) return local.slice(0,3) + "***@" + domain;
        return local.slice(0,3) + "***" + local.slice(-3) + "@" + domain;
      }),
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      cooldown: RESEND_COOLDOWN_SECONDS,
    }, "If an account exists with your email, a verification code has been sent.");
  } catch (err) {
    console.error("[ForgotPin] Send error:", err.message);
    return sendError(res, "Failed to send verification code. Please try again.");
  }
}

async function verifyForgotPin(req, res) {
  try {
    const { otpToken, code } = req.body;
    if (!otpToken || !code) return sendError(res, "Please provide the verification code.");

    let decoded;
    try {
      decoded = verifyResetToken(otpToken);
    } catch {
      return sendError(res, "Verification session expired. Please try again.", 401);
    }

    if (decoded.purpose !== "forgot-pin") {
      return sendError(res, "Invalid verification session.", 401);
    }

    const resetToken = await verifyOtpAndGetToken(decoded.id, code, "reset-pin");
    if (!resetToken) {
      return sendError(res, "Invalid or expired verification code.", 401);
    }

    return sendSuccess(res, { resetToken }, "Email verified. You can now set a new PIN.");
  } catch (err) {
    console.error("[ForgotPin] Verify error:", err.message);
    return sendError(res, "Verification failed. Please try again.");
  }
}

async function resetPin(req, res) {
  try {
    const { resetToken, newPin } = req.body;
    if (!resetToken || !newPin) return sendError(res, "Please provide the reset code and new PIN.");
    if (!/^\d{4}$/.test(newPin)) return sendError(res, "PIN must be exactly 4 digits.");

    let decoded;
    try {
      decoded = verifyResetToken(resetToken);
    } catch {
      return sendError(res, "Reset session expired. Please start over.", 401);
    }

    if (decoded.purpose !== "reset-pin") {
      return sendError(res, "Invalid reset session.", 401);
    }

    const hashed = await bcrypt.hash(newPin, 12);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { pin: hashed, pinDisabled: false },
    });

    return sendSuccess(res, {}, "Transaction PIN reset successful.");
  } catch (err) {
    console.error("[ForgotPin] Reset error:", err.message);
    return sendError(res, "Failed to reset PIN. Please try again.");
  }
}

async function resendForgotPin(req, res) {
  try {
    const { otpToken } = req.body;
    if (!otpToken) return sendError(res, "Verification session required.");

    let decoded;
    try {
      decoded = verifyResetToken(otpToken);
    } catch {
      return sendError(res, "Verification session expired. Please start over.", 401);
    }

    if (decoded.purpose !== "forgot-pin") {
      return sendError(res, "Invalid verification session.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true },
    });
    if (!user) return sendError(res, "Account not found.", 404);

    const result = await sendOtp(user.id, user.email, "forgot-pin", "PIN reset", "PIN reset");
    if (result.cooldown) {
      return sendError(res, `Please wait ${result.cooldown} seconds before requesting a new code.`, 409);
    }

    const newOtpToken = signResetToken(user.id, "forgot-pin");
    return sendSuccess(res, {
      otpToken: newOtpToken,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      cooldown: RESEND_COOLDOWN_SECONDS,
    }, "New verification code sent!");
  } catch (err) {
    console.error("[ForgotPin] Resend error:", err.message);
    return sendError(res, "Failed to resend code. Please try again.");
  }
}

module.exports = {
  forgotPassword,
  verifyForgotPassword,
  resetPassword,
  resendForgotPassword,
  forgotPin,
  verifyForgotPin,
  resetPin,
  resendForgotPin,
};
