const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Log an admin action to the audit trail
 */
async function logAdminAction({ adminId, action, details, ip, userAgent }) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        details: details ? JSON.stringify(details) : null,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to log action:", err.message);
  }
}

/**
 * Get audit logs for an admin (or all admins for super_admin)
 */
async function getAuditLogs({ adminId, page = 1, limit = 50 }) {
  const where = adminId ? { adminId } : {};
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return { logs, total, page, limit, pages: Math.ceil(total / limit) };
}

module.exports = { logAdminAction, getAuditLogs };
