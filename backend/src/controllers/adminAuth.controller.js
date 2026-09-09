const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { sendOtpEmail } = require("../services/mailersend.service");
const session = require("../services/adminSession");
const { logAdminAction } = require("../services/adminAudit");

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key";
const OTP_EXPIRY_MINUTES = 10;
const DEFAULT_SESSION_TIMEOUT = 30;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: "lax", path: "/" };

function clearAuthCookies(res) {
  res.clearCookie("admin_token", COOKIE_OPTS);
  res.clearCookie("admin_refresh", COOKIE_OPTS);
}

// POST /admin/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ ok: false, msg: "Email and password are required." });

    const OTP_ENABLED = process.env.OTP_ENABLED !== "false";
    const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!admin) return res.status(401).json({ ok: false, msg: "Invalid email or password." });
    if (admin.status !== 1) return res.status(403).json({ ok: false, msg: "Account is inactive." });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ ok: false, msg: "Invalid email or password." });

    if (!OTP_ENABLED) {
      const ip = req.ip;
      const userAgent = req.headers["user-agent"] || "";
      const newSession = await session.createSession(admin.id, ip, userAgent);
      session.setAuthCookies(res, admin, session.createFingerprint(ip, userAgent), newSession);
      await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
      await logAdminAction({ adminId: admin.id, action: "login_success", details: { ip, otpSkipped: true }, ip, userAgent });
      return res.json({
        ok: true,
        msg: "Login successful.",
        data: { admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions, sessionTimeout: admin.sessionTimeout } },
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { otpCode: otp, otpExpiresAt: expiresAt, otpAttempts: 0 },
    });

    const emailSent = await sendOtpEmail({ to: admin.email, otpCode: otp, expiresInMinutes: OTP_EXPIRY_MINUTES, purpose: "login" });

    await logAdminAction({ adminId: admin.id, action: "login_requested", ip: req.ip, userAgent: req.headers["user-agent"] });

    return res.json({
      ok: true,
      msg: emailSent ? "OTP sent to your email." : "OTP generated but email could not be sent. Contact support.",
      data: { adminId: admin.id, email: admin.email },
      requiresOtp: true,
      emailFailed: !emailSent,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ ok: false, msg: "Login failed." });
  }
}

// POST /admin/auth/verify-otp
async function verifyOtp(req, res) {
  try {
    const { adminId, otp } = req.body;
    if (!adminId || !otp)
      return res.status(400).json({ ok: false, msg: "Admin ID and OTP are required." });

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ ok: false, msg: "Admin not found." });
    if (admin.status !== 1) return res.status(403).json({ ok: false, msg: "Account is inactive." });

    if (!admin.otpCode || !admin.otpExpiresAt)
      return res.status(400).json({ ok: false, msg: "No OTP pending. Please login again." });

    if (new Date() > admin.otpExpiresAt)
      return res.status(400).json({ ok: false, msg: "OTP has expired. Please login again." });

    if (admin.otpAttempts >= 5)
      return res.status(429).json({ ok: false, msg: "Too many attempts. Please login again." });

    if (admin.otpCode !== otp) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { otpAttempts: { increment: 1 } },
      });
      return res.status(401).json({ ok: false, msg: "Invalid OTP." });
    }

    // Create session and set cookies FIRST (before clearing OTP)
    const ip = req.ip;
    const userAgent = req.headers["user-agent"] || "";
    const newSession = await session.createSession(admin.id, ip, userAgent);
    session.setAuthCookies(res, admin, session.createFingerprint(ip, userAgent), newSession);

    // Only clear OTP AFTER session creation succeeds
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    // Check if this is a new device — send notification email
    const isNewDevice = await session.isNewFingerprint(admin.id, session.createFingerprint(ip, userAgent));
    if (isNewDevice) {
      sendLoginNotification({ admin, ip, userAgent }).catch(() => {});
    }

    await logAdminAction({
      adminId: admin.id,
      action: "login_success",
      details: { ip, isNewDevice },
      ip,
      userAgent,
    });

    return res.json({
      ok: true,
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          sessionTimeout: admin.sessionTimeout,
        },
      },
    });
  } catch (err) {
    console.error("Admin OTP verify error:", err);
    return res.status(500).json({ ok: false, msg: "Verification failed." });
  }
}

// POST /admin/auth/refresh — refresh access token using refresh cookie
async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies?.admin_refresh;
    if (!refreshToken) return res.status(401).json({ ok: false, msg: "No refresh token." });

    const result = await session.validateRefreshToken(refreshToken);
    if (!result) {
      clearAuthCookies(res);
      return res.status(401).json({ ok: false, msg: "Session expired." });
    }

    const { admin, session: activeSession } = result;

    // Update last activity time in the session
    await prisma.adminSession.update({
      where: { id: activeSession.id },
      data: { lastActivityAt: new Date() },
    });

    const fingerprint = session.createFingerprint(req.ip, req.headers["user-agent"]);
    const accessToken = session.signAccessToken(admin, fingerprint);

    res.cookie("admin_token", accessToken, { ...COOKIE_OPTS, maxAge: session.ACCESS_TOKEN_MINUTES * 60 * 1000 });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin token refresh error:", err);
    clearAuthCookies(res);
    return res.status(401).json({ ok: false, msg: "Refresh failed." });
  }
}

// GET /admin/auth/me
async function getMe(req, res) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, permissions: true, status: true,
        sessionTimeout: true, lastLoginAt: true,
      },
    });
    if (!admin) return res.status(404).json({ ok: false, msg: "Admin not found." });
    return res.json({ ok: true, data: { admin } });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed." });
  }
}

// POST /admin/auth/logout
async function logout(req, res) {
  try {
    // Revoke current session
    const refreshToken = req.cookies?.admin_refresh;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.ADMIN_REFRESH_SECRET || JWT_SECRET + "-refresh");
        await session.revokeSession(decoded.sessionId);
      } catch {}
    }

    clearAuthCookies(res);

    await logAdminAction({ adminId: req.admin.id, action: "logout", ip: req.ip, userAgent: req.headers["user-agent"] });

    return res.json({ ok: true, msg: "Logged out." });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Logout failed." });
  }
}

// POST /admin/auth/change-password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ ok: false, msg: "Current and new password are required." });
    if (newPassword.length < 8)
      return res.status(400).json({ ok: false, msg: "New password must be at least 8 characters." });

    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(401).json({ ok: false, msg: "Current password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({ where: { id: admin.id }, data: { password: hashed } });

    // Revoke all other sessions on password change
    await session.revokeAllSessions(admin.id);

    await logAdminAction({ adminId: admin.id, action: "password_changed", ip: req.ip, userAgent: req.headers["user-agent"] });

    return res.json({ ok: true, msg: "Password changed successfully. All other sessions revoked." });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed to change password." });
  }
}

// GET /admin/auth/sessions — list active sessions
async function getSessions(req, res) {
  try {
    const sessions = await prisma.adminSession.findMany({
      where: { adminId: req.admin.id },
      orderBy: { lastActivityAt: "desc" },
      select: {
        id: true, ip: true, userAgent: true, isCurrent: true,
        lastActivityAt: true, createdAt: true, expiresAt: true,
      },
    });
    return res.json({ ok: true, data: { sessions } });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed." });
  }
}

// DELETE /admin/auth/sessions/:id — revoke a session
async function revokeSession(req, res) {
  try {
    const { id } = req.params;
    await session.revokeSession(parseInt(id));
    await logAdminAction({
      adminId: req.admin.id,
      action: "session_revoked",
      details: { sessionId: parseInt(id) },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return res.json({ ok: true, msg: "Session revoked." });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed." });
  }
}

// GET /admin/auth/audit-logs — get audit trail
async function getAuditLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const adminId = req.admin.role === "super_admin" ? undefined : req.admin.id;
    const result = await require("../services/adminAudit").getAuditLogs({ adminId, page, limit });
    return res.json({ ok: true, data: result });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed." });
  }
}

// GET /admin/auth/admins — list all admins (super_admin only)
async function getAdmins(req, res) {
  try {
    if (req.admin.role !== "super_admin")
      return res.status(403).json({ ok: false, msg: "Forbidden." });

    const admins = await prisma.admin.findMany({
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, permissions: true, status: true,
        lastLoginAt: true, createdAt: true, createdBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ ok: true, data: { admins } });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed." });
  }
}

// POST /admin/auth/admins — create admin (super_admin only)
async function createAdmin(req, res) {
  try {
    if (req.admin.role !== "super_admin")
      return res.status(403).json({ ok: false, msg: "Only super admin can create admins." });

    const { name, email, phone, password, role, permissions, status } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ ok: false, msg: "Name, email, and password are required." });
    if (password.length < 8)
      return res.status(400).json({ ok: false, msg: "Password must be at least 8 characters." });

    const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing)
      return res.status(400).json({ ok: false, msg: "An admin with this email already exists." });

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        password: hashed,
        role: role === "super_admin" ? "super_admin" : "admin",
        permissions: JSON.stringify(permissions || []),
        status: status !== undefined ? status : 1,
        createdBy: req.admin.id,
      },
    });

    await logAdminAction({
      adminId: req.admin.id,
      action: "admin_created",
      details: { newAdminId: admin.id, email: admin.email, role: admin.role },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      ok: true,
      msg: "Admin created.",
      data: {
        id: admin.id, name: admin.name, email: admin.email,
        role: admin.role, permissions: admin.permissions,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    return res.status(500).json({ ok: false, msg: "Failed to create admin." });
  }
}

// PUT /admin/auth/admins/:id — update admin (super_admin only)
async function updateAdmin(req, res) {
  try {
    if (req.admin.role !== "super_admin")
      return res.status(403).json({ ok: false, msg: "Only super admin can update admins." });

    const { id } = req.params;
    const { name, email, phone, role, permissions, status, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: parseInt(id) } });
    if (!admin) return res.status(404).json({ ok: false, msg: "Admin not found." });

    if (admin.role === "super_admin" && parseInt(id) !== req.admin.id) {
      return res.status(403).json({ ok: false, msg: "Cannot modify another super admin." });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (role) {
      if (admin.role === "super_admin") return res.status(403).json({ ok: false, msg: "Cannot change super admin role." });
      updateData.role = role;
    }
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    if (status !== undefined) {
      if (admin.role === "super_admin" && status !== 1) return res.status(403).json({ ok: false, msg: "Cannot deactivate super admin." });
      updateData.status = status;
    }
    if (password && password.length >= 8) updateData.password = await bcrypt.hash(password, 12);

    const updated = await prisma.admin.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await logAdminAction({
      adminId: req.admin.id,
      action: "admin_updated",
      details: { targetAdminId: parseInt(id), changes: Object.keys(updateData) },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      ok: true,
      msg: "Admin updated.",
      data: {
        id: updated.id, name: updated.name, email: updated.email,
        role: updated.role, permissions: updated.permissions, status: updated.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed to update admin." });
  }
}

// DELETE /admin/auth/admins/:id — delete admin (super_admin only)
async function deleteAdmin(req, res) {
  try {
    if (req.admin.role !== "super_admin")
      return res.status(403).json({ ok: false, msg: "Only super admin can delete admins." });

    const { id } = req.params;
    if (parseInt(id) === req.admin.id)
      return res.status(400).json({ ok: false, msg: "Cannot delete yourself." });

    const admin = await prisma.admin.findUnique({ where: { id: parseInt(id) } });
    if (!admin) return res.status(404).json({ ok: false, msg: "Admin not found." });

    if (admin.role === "super_admin")
      return res.status(403).json({ ok: false, msg: "Cannot delete super admin." });

    await prisma.admin.delete({ where: { id: parseInt(id) } });

    await logAdminAction({
      adminId: req.admin.id,
      action: "admin_deleted",
      details: { deletedAdminId: parseInt(id), email: admin.email },
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({ ok: true, msg: "Admin deleted." });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Failed to delete admin." });
  }
}

const RESEND_COOLDOWN_SECONDS = 60;

// POST /admin/auth/resend-otp
async function resendOtp(req, res) {
  try {
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ ok: false, msg: "Admin ID required." });

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ ok: false, msg: "Admin not found." });
    if (admin.status !== 1) return res.status(403).json({ ok: false, msg: "Account is inactive." });

    if (admin.otpExpiresAt) {
      const otpAge = (new Date() - new Date(admin.otpExpiresAt)) / 1000;
      const timeSinceOtpSent = (OTP_EXPIRY_MINUTES * 60) - otpAge;
      if (timeSinceOtpSent > 0 && timeSinceOtpSent < RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceOtpSent);
        return res.status(429).json({ ok: false, msg: `Please wait ${remaining} seconds before resending.`, cooldown: remaining });
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { otpCode: otp, otpExpiresAt: expiresAt, otpAttempts: 0 },
    });

    await sendOtpEmail({ to: admin.email, otpCode: otp, expiresInMinutes: OTP_EXPIRY_MINUTES, purpose: "login" });

    return res.json({ ok: true, msg: "OTP resent to your email.", cooldown: RESEND_COOLDOWN_SECONDS });
  } catch (err) {
    console.error("Admin resend OTP error:", err);
    return res.status(500).json({ ok: false, msg: "Failed to resend OTP." });
  }
}

// GET /admin/auth/clear-cookie — clears old cookies
function clearCookie(req, res) {
  clearAuthCookies(res);
  return res.json({ ok: true });
}

// Send login notification email
async function sendLoginNotification({ admin, ip, userAgent }) {
  try {
    const axios = require("axios");
    const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
    const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || "noreply@gwarzodatasub.com";
    const MAILERSEND_FROM_NAME = process.env.MAILERSEND_FROM_NAME || "KIRU DATA";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" maxWidth="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 24px;text-align:center;">
            <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:800;">KIRU DATA</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0;">New Login Detected</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="color:#334155;font-size:15px;margin:0 0 8px;">Hello ${admin.name},</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
              We detected a new login to your admin account from a device we haven't seen before.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
              <p style="color:#64748b;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Device Details</p>
              <p style="color:#334155;font-size:14px;margin:0 0 8px;"><strong>IP:</strong> ${ip}</p>
              <p style="color:#334155;font-size:14px;margin:0;"><strong>Device:</strong> ${(userAgent || "Unknown").substring(0, 120)}</p>
            </div>
            <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 16px;">
              If this was you, no action is needed. If you don't recognize this login, please change your password immediately and contact support.
            </p>
            <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:8px;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated security alert. Please do not reply.</p>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await axios.post("https://api.mailersend.com/v1/email", {
      from: { email: MAILERSEND_FROM_EMAIL, name: MAILERSEND_FROM_NAME },
      to: [{ email: admin.email }],
      subject: "New Login Alert — KIRU DATA Admin",
      html,
      text: `New login detected from IP: ${ip}. Device: ${userAgent || "Unknown"}. If this wasn't you, change your password immediately.`,
    }, {
      headers: { Authorization: `Bearer ${MAILERSEND_API_KEY}`, "Content-Type": "application/json" },
      timeout: 15000,
    });
  } catch (err) {
    console.error("[LoginNotification] Failed to send:", err.message);
  }
}

module.exports = {
  login, verifyOtp, refreshToken, getMe, logout, changePassword,
  getSessions, revokeSession, getAuditLogs,
  getAdmins, createAdmin, updateAdmin, deleteAdmin, resendOtp, clearCookie,
};
