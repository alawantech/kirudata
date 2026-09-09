const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key";
const REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET || JWT_SECRET + "-refresh";
const ACCESS_TOKEN_MINUTES = 30;
const REFRESH_TOKEN_MINUTES = 30;

/**
 * Create a fingerprint hash from User-Agent to prevent CGNAT/dynamic IP rotation issues
 */
function createFingerprint(ip, userAgent) {
  const raw = `${userAgent || "unknown"}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/**
 * Sign a short-lived access token (30 min)
 */
function signAccessToken(admin, fingerprint) {
  return jwt.sign(
    { id: admin.id, role: admin.role, isAdmin: true, fp: fingerprint },
    JWT_SECRET,
    { expiresIn: `${ACCESS_TOKEN_MINUTES}m` }
  );
}

/**
 * Sign a short-lived refresh token (30 min)
 */
function signRefreshToken(adminId, sessionId) {
  return jwt.sign(
    { adminId, sessionId, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_MINUTES}m` }
  );
}

/**
 * Set access + refresh cookies on the response
 */
function setAuthCookies(res, admin, fingerprint, session) {
  const accessToken = signAccessToken(admin, fingerprint);
  const refreshToken = signRefreshToken(admin.id, session.id);

  const accessMaxAge = ACCESS_TOKEN_MINUTES * 60 * 1000;
  const refreshMaxAge = REFRESH_TOKEN_MINUTES * 60 * 1000;

  res.cookie("admin_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  res.cookie("admin_refresh", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });

  return { accessToken, refreshToken };
}

/**
 * Create a new session in the database
 */
async function createSession(adminId, ip, userAgent) {
  const fingerprint = createFingerprint(ip, userAgent);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MINUTES * 60 * 1000);

  // Mark all other sessions for this admin as not current
  await prisma.adminSession.updateMany({
    where: { adminId, isCurrent: true },
    data: { isCurrent: false },
  });

  // Create a temporary placeholder with a unique random value
  const tempToken = crypto.randomBytes(32).toString("hex");
  const session = await prisma.adminSession.create({
    data: {
      adminId,
      refreshToken: tempToken,
      fingerprint,
      ip,
      userAgent: userAgent || "unknown",
      isCurrent: true,
      expiresAt,
    },
  });

  return session;
}

/**
 * Validate a refresh token and return the session
 */
async function validateRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== "refresh") return null;

    const session = await prisma.adminSession.findUnique({
      where: { id: decoded.sessionId },
      include: { admin: true },
    });

    if (!session) return null;
    if (session.refreshToken !== token) return null; // token was rotated
    if (new Date() > session.expiresAt) return null; // expired
    if (session.admin.status !== 1) return null; // inactive

    return { session, admin: session.admin };
  } catch {
    return null;
  }
}

/**
 * Rotate refresh token — invalidate old, issue new
 */
async function rotateRefreshToken(oldToken, ip, userAgent) {
  const result = await validateRefreshToken(oldToken);
  if (!result) return null;

  const { session, admin } = result;
  const newRefreshToken = signRefreshToken(admin.id, session.id);

  await prisma.adminSession.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      fingerprint: createFingerprint(ip, userAgent),
      ip,
      userAgent: userAgent || session.userAgent,
      lastActivityAt: new Date(),
    },
  });

  return { admin, session, newRefreshToken };
}

/**
 * Revoke a session (logout from a device)
 */
async function revokeSession(sessionId) {
  await prisma.adminSession.delete({ where: { id: sessionId } }).catch(() => {});
}

/**
 * Revoke all sessions for an admin
 */
async function revokeAllSessions(adminId) {
  await prisma.adminSession.deleteMany({ where: { adminId } });
}

/**
 * Cleanup expired sessions
 */
async function cleanupExpiredSessions() {
  await prisma.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

// Cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

/**
 * Check if a fingerprint is new for this admin
 */
async function isNewFingerprint(adminId, fingerprint) {
  const count = await prisma.adminSession.count({
    where: { adminId, fingerprint },
  });
  return count === 0;
}

module.exports = {
  createFingerprint,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  createSession,
  validateRefreshToken,
  rotateRefreshToken,
  revokeSession,
  revokeAllSessions,
  isNewFingerprint,
  ACCESS_TOKEN_MINUTES,
  REFRESH_TOKEN_MINUTES,
};
