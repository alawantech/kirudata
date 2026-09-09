const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { createFingerprint } = require("../services/adminSession");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key";

/**
 * Protect admin routes — verifies JWT from httpOnly cookie,
 * checks session binding (IP+UA fingerprint), attaches req.admin
 */
async function protectAdmin(req, res, next) {
  try {
    const token = req.cookies?.admin_token;
    if (!token) {
      console.log(`[AdminAuth] NO TOKEN - cookies:`, Object.keys(req.cookies || {}));
      return res.status(401).json({ ok: false, msg: "Not authenticated." });
    }

    const { isBlacklisted } = require("../utils/tokenBlacklist");
    if (isBlacklisted(token))
      return res.status(401).json({ ok: false, msg: "Session expired." });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(401).json({ ok: false, msg: "Invalid token." });

    // Session binding — verify IP+UA fingerprint hasn't changed
    if (decoded.fp) {
      const currentFp = createFingerprint(req.ip, req.headers["user-agent"]);
      if (decoded.fp !== currentFp) {
        console.log(`[AdminAuth] FINGERPRINT MISMATCH - ip: ${req.ip}, ua: ${(req.headers["user-agent"] || "").substring(0, 50)}`);
        return res.status(401).json({ ok: false, msg: "Session compromised. Please log in again." });
      }
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin || admin.status !== 1)
      return res.status(401).json({ ok: false, msg: "Account inactive." });

    req.admin = { id: admin.id, role: admin.role, permissions: admin.permissions };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ ok: false, msg: "Session expired." });
    console.log(`[AdminAuth] VERIFY ERROR:`, err.message);
    return res.status(401).json({ ok: false, msg: "Invalid token." });
  }
}

/**
 * Check if admin has a specific permission
 */
function requirePermission(...perms) {
  return (req, res, next) => {
    if (req.admin.role === "super_admin") return next();

    let adminPerms = req.admin.permissions;
    if (typeof adminPerms === "string") adminPerms = JSON.parse(adminPerms);
    if (!Array.isArray(adminPerms)) adminPerms = [];

    const hasPermission = perms.some((p) => adminPerms.includes(p));
    if (!hasPermission)
      return res.status(403).json({ ok: false, msg: "You don't have permission for this action." });

    next();
  };
}

module.exports = { protectAdmin, requirePermission };
