const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { blacklistToken } = require("../utils/tokenBlacklist");
const { encrypt, decrypt, isEncrypted } = require("../utils/crypto");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ok = (res, data = {}, statusCode = 200) =>
  res.status(statusCode).json({ status: "success", data });

const fail = (res, msg, statusCode = 400) =>
  res.status(statusCode).json({ status: "error", msg });

// ─── AUTH ─────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return fail(res, "Username and password required.");

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || admin.status !== 1)
      return fail(res, "Invalid credentials.", 401);

    const match = await bcrypt.compare(password, admin.token);
    if (!match) return fail(res, "Invalid credentials.", 401);

    const token = jwt.sign(
      { id: admin.id, role: admin.role, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 12 * 60 * 60 * 1000,
    });

    return ok(res, {
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, "Login failed.", 500);
  }
};

exports.logout = (req, res) => {
  // Blacklist the current admin token so it cannot be reused after logout
  const raw =
    req.signedCookies?.admin_token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);
  if (raw) {
    try {
      const decoded = jwt.decode(raw);
      if (decoded?.exp) blacklistToken(raw, decoded.exp * 1000);
    } catch {}
  }
  res.clearCookie("admin_token");
  return ok(res, { msg: "Logged out." });
};

exports.getMe = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        name: true,
        role: true,
        username: true,
        status: true,
      },
    });
    if (!admin) return fail(res, "Admin not found.", 404);
    return ok(res, { admin });
  } catch (e) {
    return fail(res, "Error fetching admin.", 500);
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const [
      totalRegular,
      totalVendors,
      totalTransactions,
      successTx,
      failedTx,
      pendingTx,
      totalRevenue,
      notifications,
      issues,
    ] = await Promise.all([
      prisma.user.count({ where: { type: 1 } }),
      prisma.user.count({ where: { type: 2 } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 1 } }),
      prisma.transaction.count({ where: { status: 0 } }),
      prisma.transaction.count({ where: { status: 2 } }),
      prisma.transaction.aggregate({ _sum: { profit: true } }),
      prisma.notification.count(),
      prisma.issue.count({ where: { adminRead: false } }),
    ]);

    const walletStats = await prisma.user.aggregate({
      _sum: { wallet: true, refWallet: true },
    });

    return ok(res, {
      totalUsers: totalRegular + totalVendors,
      vendorCount: totalVendors,
      totalTransactions,
      successCount: successTx,
      failedCount: failedTx,
      pendingCount: pendingTx,
      totalRevenue: totalRevenue._sum.profit || 0,
      totalWalletBalance: walletStats._sum.wallet || 0,
      notifications,
      openIssues: issues,
    });
  } catch (e) {
    console.error(e);
    return fail(res, "Failed to fetch stats.", 500);
  }
};

// ─── PROFIT SUMMARY ──────────────────────────────────────────────────────────

const SERVICE_LABELS = {
  "data": "Data",
  "airtime": "Airtime",
  "Airtime to Cash": "Airtime to Cash",
  "cable": "Cable TV",
  "electricity": "Electricity",
  "exam": "Exam Pins",
  "sms": "Bulk SMS",
  "data-card": "Data Card",
  "recharge-card": "Recharge Card",
  "wallet-credit": "Wallet Credit",
  "wallet-debit": "Wallet Debit",
};

exports.getProfitSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    const [todayProfit, monthProfit, yearProfit, allTimeProfit] = await Promise.all([
      prisma.transaction.aggregate({ where: { status: 1, date: { gte: todayStart, lt: todayEnd } }, _sum: { profit: true }, _count: true }),
      prisma.transaction.aggregate({ where: { status: 1, date: { gte: monthStart, lt: monthEnd } }, _sum: { profit: true }, _count: true }),
      prisma.transaction.aggregate({ where: { status: 1, date: { gte: yearStart, lt: yearEnd } }, _sum: { profit: true }, _count: true }),
      prisma.transaction.aggregate({ where: { status: 1 }, _sum: { profit: true }, _count: true }),
    ]);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const dayData = await prisma.transaction.aggregate({
        where: { status: 1, date: { gte: dayStart, lt: dayEnd } },
        _sum: { profit: true },
      });
      last7Days.push({
        date: dayStart.toISOString().split("T")[0],
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        profit: dayData._sum.profit || 0,
      });
    }

    return ok(res, {
      today: { profit: todayProfit._sum.profit || 0, count: todayProfit._count || 0 },
      thisMonth: { profit: monthProfit._sum.profit || 0, count: monthProfit._count || 0 },
      thisYear: { profit: yearProfit._sum.profit || 0, count: yearProfit._count || 0 },
      allTime: { profit: allTimeProfit._sum.profit || 0, count: allTimeProfit._count || 0 },
      last7Days,
    });
  } catch (e) {
    console.error("[getProfitSummary]", e);
    return fail(res, "Failed to fetch profit summary.", 500);
  }
};

// ─── PROFIT REPORT ───────────────────────────────────────────────────────────

exports.getProfitReport = async (req, res) => {
  try {
    const { period = "daily", date, month, year } = req.query;
    let start, end, groupLabel;

    if (period === "daily" && date) {
      start = new Date(date + "T00:00:00.000Z");
      end = new Date(start); end.setDate(end.getDate() + 1);
      groupLabel = "hour";
    } else if (period === "monthly" && month) {
      start = new Date(month + "-01T00:00:00.000Z");
      end = new Date(start); end.setMonth(end.getMonth() + 1);
      groupLabel = "day";
    } else if (period === "yearly" && year) {
      start = new Date(year + "-01-01T00:00:00.000Z");
      end = new Date(start); end.setFullYear(end.getFullYear() + 1);
      groupLabel = "month";
    } else {
      return fail(res, "Provide valid period and date params.");
    }

    const transactions = await prisma.transaction.findMany({
      where: { status: 1, date: { gte: start, lt: end } },
      select: { servicename: true, amount: true, profit: true, date: true },
      orderBy: { date: "asc" },
    });

    const byService = {};
    let totalCost = 0, totalRevenue = 0, totalProfit = 0;

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount) || 0;
      const profit = tx.profit || 0;
      const cost = amount - profit;
      const label = SERVICE_LABELS[tx.servicename] || tx.servicename;

      if (!byService[label]) byService[label] = { profit: 0, cost: 0, revenue: 0, count: 0 };
      byService[label].profit += profit;
      byService[label].cost += cost;
      byService[label].revenue += amount;
      byService[label].count += 1;
      totalCost += cost;
      totalRevenue += amount;
      totalProfit += profit;
    }

    const chartData = {};
    for (const tx of transactions) {
      let key;
      if (groupLabel === "hour") {
        key = tx.date.getUTCHours().toString().padStart(2, "0") + ":00";
      } else if (groupLabel === "day") {
        key = tx.date.toISOString().split("T")[0];
      } else {
        key = (tx.date.getUTCMonth() + 1).toString().padStart(2, "0");
      }
      if (!chartData[key]) chartData[key] = 0;
      chartData[key] += tx.profit;
    }

    return ok(res, {
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      summary: {
        totalCost: Math.round(totalCost * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        transactionCount: transactions.length,
        avgProfitPerTx: transactions.length > 0 ? Math.round((totalProfit / transactions.length) * 100) / 100 : 0,
        margin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
      },
      byService: Object.entries(byService)
        .map(([service, d]) => ({
          service,
          profit: Math.round(d.profit * 100) / 100,
          cost: Math.round(d.cost * 100) / 100,
          revenue: Math.round(d.revenue * 100) / 100,
          count: d.count,
          margin: d.revenue > 0 ? Math.round((d.profit / d.revenue) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit),
      chart: Object.entries(chartData)
        .map(([label, profit]) => ({ label, profit: Math.round(profit * 100) / 100 }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    });
  } catch (e) {
    console.error("[getProfitReport]", e);
    return fail(res, "Failed to fetch profit report.", 500);
  }
};

// ─── USERS ────────────────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", type = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      AND: [
        type ? { type: parseInt(type) } : {},
        search
          ? {
              OR: [
                { firstname: { contains: search, mode: "insensitive" } },
                { lastname: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { regDate: "desc" },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          type: true,
          wallet: true,
          regStatus: true,
          regDate: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ok(res, {
      users,
      meta: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (e) {
    return fail(res, "Failed to fetch users.", 500);
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        type: true,
        wallet: true,
        refWallet: true,
        regStatus: true,
        regDate: true,
        state: true,
        bankName: true,
        bankNo: true,
        _count: { select: { transactions: true } },
      },
    });
    if (!user) return fail(res, "User not found.", 404);
    return ok(res, { user });
  } catch (e) {
    return fail(res, "Error.", 500);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { firstname, lastname, email, phone } = req.body;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, "Invalid email address format.");
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstname !== undefined && { firstname }),
        ...(lastname !== undefined && { lastname }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
    });
    return ok(res, { msg: "User details updated.", user });
  } catch (e) {
    if (e.code === "P2002") {
      return fail(res, "Email or phone number already in use.");
    }
    return fail(res, "Failed to update user details.", 500);
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // 1=Active, 2=Pending, 3=Suspended
    const s = parseInt(status);
    if (![1, 2, 3].includes(s))
      return fail(
        res,
        "Invalid status. Use 1 (Active), 2 (Pending), or 3 (Suspended).",
      );
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { regStatus: s },
    });
    return ok(res, { msg: "User status updated.", regStatus: user.regStatus });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateUserType = async (req, res) => {
  try {
    const { type } = req.body; // 1=Regular, 2=Vendor
    if (![1, 2].includes(parseInt(type))) return fail(res, "Invalid type.");
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { type: parseInt(type) },
    });
    return ok(res, { msg: "User type updated." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!userId) return fail(res, "Invalid user ID.");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(res, "User not found.", 404);

    const tables = [
      { table: "transactions", col: "userId" },
      { table: "beneficiaries", col: "userId" },
      { table: "upgrade_requests", col: "userId" },
      { table: "email_otps", col: "userId" },
      { table: "recognized_devices", col: "userId" },
      { table: "airtime_to_cash", col: "userId" },
      { table: "kyc_verifications", col: "userId" },
      { table: "cac_requests", col: "userId" },
      { table: "user_logins", col: "userId" },
      { table: "user_visits", col: "userId" },
      { table: "manual_funds", col: "userId" },
      { table: "referral_logs", col: "referrerId" },
      { table: "referral_logs", col: "refereeId" },
    ];

    for (const { table, col } of tables) {
      // Cast the column to text so the comparison always works regardless of column type
      await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE "${col}"::text = $1`, String(userId));
    }

    await prisma.user.delete({ where: { id: userId } });

    return ok(res, { msg: "User deleted permanently." });
  } catch (e) {
    console.error("[Admin] deleteUser error:", e.message);
    return fail(res, "Failed to delete user.", 500);
  }
};

exports.creditWallet = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount) return fail(res, "userId and amount required.");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return fail(res, "Invalid amount.");

    let oldBal, newBal;
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: parseInt(userId) },
          select: { id: true, wallet: true },
        });
        oldBal = user.wallet;
        newBal = oldBal + amt;
        await tx.user.update({
          where: { id: user.id },
          data: { wallet: { increment: amt } },
        });
        await tx.transaction.create({
          data: {
            userId: user.id,
            transref: `ADMIN-${Date.now()}`,
            servicename: "Wallet Credit",
            servicedesc: reason || "Admin wallet credit",
            amount: amt.toString(),
            status: 1,
            oldbal: oldBal.toString(),
            newbal: newBal.toString(),
            profit: 0,
          },
        });
      });
    } catch (txErr) {
      if (txErr.code === "P2025") return fail(res, "User not found.", 404);
      throw txErr;
    }

    return ok(res, {
      msg: "Wallet credited with \u20a6" + amt.toFixed(2) + ".",
      newBalance: newBal,
    });
  } catch (e) {
    return fail(res, "Failed to credit wallet.", 500);
  }
};

exports.debitWallet = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount) return fail(res, "userId and amount required.");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return fail(res, "Invalid amount.");

    let oldBal, newBal;
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: parseInt(userId) },
          select: { id: true, wallet: true },
        });
        if (user.wallet < amt) throw new Error("INSUFFICIENT");
        oldBal = user.wallet;
        newBal = oldBal - amt;
        await tx.user.update({
          where: { id: user.id },
          data: { wallet: { decrement: amt } },
        });
        await tx.transaction.create({
          data: {
            userId: user.id,
            transref: `ADMIN-DEBIT-${Date.now()}`,
            servicename: "Wallet Debit",
            servicedesc: reason || "Admin wallet debit",
            amount: amt.toString(),
            status: 1,
            oldbal: oldBal.toString(),
            newbal: newBal.toString(),
            profit: 0,
          },
        });
      });
    } catch (txErr) {
      if (txErr.message === "INSUFFICIENT")
        return fail(res, "Insufficient wallet balance.");
      if (txErr.code === "P2025") return fail(res, "User not found.", 404);
      throw txErr;
    }

    return ok(res, {
      msg: "Wallet debited \u20a6" + amt.toFixed(2) + ".",
      newBalance: newBal,
    });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

exports.getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      status = "",
      service = "",
      search = "",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Map string status labels to integer values
    const statusMap = { success: 1, failed: 0, pending: 2, processing: 2 };
    const statusFilter =
      status !== ""
        ? statusMap[status] !== undefined
          ? statusMap[status]
          : parseInt(status)
        : null;

    const where = {
      AND: [
        statusFilter !== null ? { status: statusFilter } : {},
        service
          ? { servicename: { contains: service, mode: "insensitive" } }
          : {},
        search
          ? {
              OR: [
                { transref: { contains: search, mode: "insensitive" } },
                { servicedesc: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: "desc" },
        include: {
          user: {
            select: { id: true, firstname: true, lastname: true, phone: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return ok(res, {
      transactions,
      meta: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (![0, 1, 2].includes(parseInt(status)))
      return fail(res, "Invalid status.");
    const tx = await prisma.transaction.update({
      where: { id: parseInt(req.params.id) },
      data: { status: parseInt(status) },
    });
    return ok(res, { msg: "Status updated.", transaction: tx });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok(res, { notifications });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { subject, message, msgFor = 3, status = 1 } = req.body;
    if (!subject || !message) return fail(res, "Subject and message required.");
    const n = await prisma.notification.create({
      data: {
        subject,
        message,
        msgFor: parseInt(msgFor),
        status: parseInt(status),
      },
    });
    return ok(res, { notification: n }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { id: parseInt(req.params.id) },
    });
    return ok(res, { msg: "Notification deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── DATA PLANS ───────────────────────────────────────────────────────────────

exports.getDataPlans = async (req, res) => {
  try {
    const plans = await prisma.dataPlan.findMany({
      include: { network: { select: { name: true } } },
      orderBy: [{ networkId: "asc" }, { userPrice: "asc" }],
    });
    return ok(res, { plans });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createDataPlan = async (req, res) => {
  try {
    const {
      name,
      buyingPrice,
      userPrice,
      vendorPrice,
      planCode,
      type,
      networkId,
      validity,
    } = req.body;
    if (!name || !userPrice || !planCode || !networkId)
      return fail(res, "Required fields missing.");
    const plan = await prisma.dataPlan.create({
      data: {
        name,
        buyingPrice: buyingPrice || "0",
        userPrice,
        vendorPrice: vendorPrice || userPrice,
        planCode,
        type,
        networkId: parseInt(networkId),
        validity: validity || "30",
      },
    });
    return ok(res, { plan }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateDataPlan = async (req, res) => {
  try {
    const {
      name,
      buyingPrice,
      userPrice,
      vendorPrice,
      planCode,
      type,
      validity,
      networkId,
    } = req.body;
    const plan = await prisma.dataPlan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name }),
        ...(buyingPrice && { buyingPrice }),
        ...(userPrice && { userPrice }),
        ...(vendorPrice && { vendorPrice }),
        ...(planCode && { planCode }),
        ...(type !== undefined && { type }),
        ...(validity && { validity }),
        ...(networkId && { networkId: parseInt(networkId) }),
      },
    });
    return ok(res, { plan });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteDataPlan = async (req, res) => {
  try {
    await prisma.dataPlan.delete({ where: { id: parseInt(req.params.id) } });
    return ok(res, { msg: "Plan deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── DATA PROVIDERS ───────────────────────────────────────────────────────────

exports.getDataProviders = async (req, res) => {
  try {
    const providers = await prisma.dataProvider.findMany({
      orderBy: { name: "asc" },
    });
    return ok(res, { providers });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createDataProvider = async (req, res) => {
  try {
    const { name, slug, status, apiUrl, apiKey, authType } = req.body;
    if (!name || !slug) return fail(res, "Name and slug are required.", 400);
    const slugNorm = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const provider = await prisma.dataProvider.create({
      data: {
        name,
        slug: slugNorm,
        status: status || "On",
        apiUrl: apiUrl || "",
        apiKey: apiKey ? encrypt(apiKey) : "",
        authType: authType || "basic",
      },
    });
    return ok(res, { provider });
  } catch (e) {
    if (e.code === "P2002")
      return fail(res, "Provider name or slug already exists.", 400);
    return fail(res, "Failed.", 500);
  }
};

exports.updateDataProvider = async (req, res) => {
  try {
    const { name, status, apiUrl, apiKey, authType } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (status !== undefined) data.status = status;
    if (apiUrl !== undefined) data.apiUrl = apiUrl;
    if (apiKey !== undefined) data.apiKey = apiKey ? encrypt(apiKey) : apiKey;
    if (authType !== undefined) data.authType = authType;
    const provider = await prisma.dataProvider.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    return ok(res, { provider });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteDataProvider = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.providerDataPlan.deleteMany({ where: { providerId: id } });
    await prisma.dataProvider.delete({ where: { id } });
    return ok(res, { msg: "Provider deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── DATA PROVIDER BALANCE ─────────────────────────────────────────────────────

exports.getDataProviderBalance = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const provider = await prisma.dataProvider.findUnique({ where: { id } });
    if (!provider) return fail(res, "Provider not found.", 404);
    if (!provider.apiUrl || !provider.apiKey)
      return fail(res, "Provider has no API credentials configured.", 400);

    let balance = null;
    let username = null;
    let error = null;

    try {
      const authType = provider.authType || "basic";
      let authHeader;
      let method = "post";

      const isMbcData = (provider.apiUrl || "").includes("mbcdata.com");
      if (isMbcData) {
        authHeader = `Basic ${provider.apiKey}`;
        method = "post";
      } else if (authType === "basic") {
        authHeader = `Basic ${provider.apiKey}`;
        method = "post";
      } else if (authType === "subwallet") {
        authHeader = `Basic ${provider.apiKey}`;
        method = "post";
      } else if (authType === "direct_token") {
        authHeader = `Token ${provider.apiKey}`;
        method = "post";
      } else {
        authHeader = `Token ${provider.apiKey}`;
        method = "get";
      }

      const userUrl = new URL(provider.apiUrl);
      userUrl.pathname = "/api/user";

      const axios = require("axios");
      const { data } = await axios({
        method,
        url: userUrl.toString(),
        headers: { Authorization: authHeader },
        timeout: 15000,
      });

      if (data?.balance != null) balance = String(data.balance).replace(/,/g, "");
      else if (data?.user?.wallet_balance != null) balance = String(data.user.wallet_balance).replace(/,/g, "");
      else if (data?.user?.wallet != null) balance = String(data.user.wallet).replace(/,/g, "");
      else if (data?.wallet_balance != null) balance = String(data.wallet_balance).replace(/,/g, "");
      else if (data?.data?.balance != null) balance = String(data.data.balance).replace(/,/g, "");
      else if (data?.data?.wallet != null) balance = String(data.data.wallet).replace(/,/g, "");
      else error = "Unrecognised response";

      if (data?.username) username = data.username;
    } catch (e) {
      error = e.response?.data?.message || e.message || "Connection failed";
    }

    return ok(res, {
      provider: provider.name,
      balance,
      username,
      error,
    });
  } catch (e) {
    return fail(res, "Failed to check balance.", 500);
  }
};

exports.getDataProviderBalances = async (req, res) => {
  try {
    const axios = require("axios");

    // ── 1. Collect providers from DataProvider table ────
    const dataProviders = await prisma.dataProvider.findMany({
      where: { apiUrl: { not: "" }, apiKey: { not: "" } },
      orderBy: { name: "asc" },
    });
    const providers = dataProviders.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      apiUrl: p.apiUrl,
      apiKey: p.apiKey,
      authType: p.authType || "basic",
      source: "dataProvider",
    }));

    // ── 2. Also collect unique airtime providers from ApiConfig table ────
    try {
      const configs = await prisma.apiConfig.findMany();
      const cfg = {};
      for (const c of configs) {
        try { cfg[c.name] = decrypt(c.value); } catch { cfg[c.name] = ""; }
      }

      const networks = ["mtn", "glo", "airtel", "9mobile"];
      const seen = new Set();
      for (const net of networks) {
        const host = cfg[`${net}VtuProvider`];
        const key = cfg[`${net}VtuKey`];
        if (!host || !key) continue;
        if (seen.has(host)) continue;
        seen.add(host);
        providers.push({
          id: `api-${net}`,
          name: `${net.toUpperCase()} VTU (Dorosub)`,
          slug: `${net}-vtu`,
          apiUrl: host,
          apiKey: key,
          authType: host.includes("dorosub.com") ? "token" : "basic",
          source: "apiConfig",
        });
      }
    } catch {}

    const results = await Promise.all(
      providers.map(async (p) => {
        let balance = null;
        let username = null;
        let error = null;

        try {
          const isDorosub = (p.apiUrl || "").includes("dorosub.com");
          const isBasic = p.authType === "basic" || p.authType === "subwallet";

          const apiKey = isEncrypted(p.apiKey) ? decrypt(p.apiKey) : p.apiKey;

          if (isDorosub) {
            // Dorosub: POST /api/user with Basic base64(username:password) → returns balance + AccessToken
            const mbcDataProvider = dataProviders.find((d) => (d.apiUrl || "").includes("mbcdata.com"));
            const mbcApiKey = mbcDataProvider ? (isEncrypted(mbcDataProvider.apiKey) ? decrypt(mbcDataProvider.apiKey) : mbcDataProvider.apiKey) : apiKey;
            const { data } = await axios.post("https://dorosub.com/api/user", null, {
              headers: { Authorization: `Basic ${mbcApiKey}` },
              timeout: 15000,
            });
            if (data?.balance != null) balance = String(data.balance).replace(/,/g, "");
            else if (data?.oldbal != null) balance = String(data.oldbal).replace(/,/g, "");
            else if (data?.user?.wallet_balance != null) balance = String(data.user.wallet_balance).replace(/,/g, "");
            else if (data?.wallet_balance != null) balance = String(data.wallet_balance).replace(/,/g, "");
            else error = data?.message || data?.msg || "No balance in response";
            if (data?.username) username = data.username;
          } else {
            // Other providers
            let authHeader;
            let method = "get";
            const isMbcData = (p.apiUrl || "").includes("mbcdata.com");

            if (isMbcData || isBasic) {
              authHeader = `Basic ${apiKey}`;
              method = "post";
            } else {
              authHeader = `Token ${apiKey}`;
              method = "get";
            }

            let balanceUrl;
            try {
              const u = new URL(p.apiUrl);
              u.pathname = "/api/user";
              balanceUrl = u.toString();
            } catch {
              balanceUrl = p.apiUrl.replace(/\/api\/(topup|airtime|data)\/?$/, "/api/user");
            }

            const { data } = await axios({
              method,
              url: balanceUrl,
              headers: { Authorization: authHeader },
              timeout: 15000,
            });

            if (data?.balance != null) balance = String(data.balance).replace(/,/g, "");
            else if (data?.user?.wallet_balance != null) balance = String(data.user.wallet_balance).replace(/,/g, "");
            else if (data?.user?.wallet != null) balance = String(data.user.wallet).replace(/,/g, "");
            else if (data?.wallet_balance != null) balance = String(data.wallet_balance).replace(/,/g, "");
            else if (data?.data?.balance != null) balance = String(data.data.balance).replace(/,/g, "");
            else if (data?.data?.wallet != null) balance = String(data.data.wallet).replace(/,/g, "");
            else error = "Unrecognised response";
            if (data?.username) username = data.username;
          }
        } catch (e) {
          error = e.response?.data?.message || e.response?.data?.msg || e.message || "Connection failed";
        }

        return { id: p.id, name: p.name, slug: p.slug, balance, username, error };
      }),
    );

    return ok(res, { balances: results });
  } catch (e) {
    return fail(res, "Failed to fetch provider balances.", 500);
  }
};

// ─── PROVIDER DATA PLANS ──────────────────────────────────────────────────────

exports.getProviderDataPlans = async (req, res) => {
  try {
    const where = {};
    if (req.query.providerId) where.providerId = parseInt(req.query.providerId);
    if (req.query.networkId) where.networkId = parseInt(req.query.networkId);
    if (req.query.type) where.type = req.query.type;
    const plans = await prisma.providerDataPlan.findMany({
      where,
      include: {
        network: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { providerId: "asc" },
        { networkId: "asc" },
        { type: "asc" },
        { id: "asc" },
      ],
    });
    return ok(res, { plans });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createProviderDataPlan = async (req, res) => {
  try {
    const {
      providerId,
      networkId,
      networkCode,
      name,
      planCode,
      type,
      buyingPrice,
      userPrice,
      vendorPrice,
      validity,
      status,
    } = req.body;
    if (!providerId || !networkId || !name || !planCode || !type || !userPrice)
      return fail(
        res,
        "providerId, networkId, name, planCode, type, and userPrice are required.",
        400,
      );
    const plan = await prisma.providerDataPlan.create({
      data: {
        providerId: parseInt(providerId),
        networkId: parseInt(networkId),
        networkCode: networkCode || "",
        name,
        planCode,
        type,
        buyingPrice: buyingPrice || "0",
        userPrice,
        vendorPrice: vendorPrice || "0",
        validity: validity || "30",
        status: status || "On",
      },
      include: {
        network: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, slug: true } },
      },
    });
    return ok(res, { plan });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateProviderDataPlan = async (req, res) => {
  try {
    const {
      networkCode,
      name,
      planCode,
      type,
      buyingPrice,
      userPrice,
      vendorPrice,
      validity,
      status,
    } = req.body;
    const plan = await prisma.providerDataPlan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(networkCode !== undefined && { networkCode }),
        ...(name && { name }),
        ...(planCode && { planCode }),
        ...(type && { type }),
        ...(buyingPrice !== undefined && { buyingPrice }),
        ...(userPrice !== undefined && { userPrice }),
        ...(vendorPrice !== undefined && { vendorPrice }),
        ...(validity !== undefined && { validity }),
        ...(status && { status }),
      },
      include: {
        network: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, slug: true } },
      },
    });
    return ok(res, { plan });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteProviderDataPlan = async (req, res) => {
  try {
    await prisma.providerDataPlan.delete({
      where: { id: parseInt(req.params.id) },
    });
    return ok(res, { msg: "Plan deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── NETWORK PROVIDER SETTINGS ───────────────────────────────────────────────

exports.getNetworkProviderSettings = async (req, res) => {
  try {
    const where = {};
    if (req.query.networkId) where.networkId = parseInt(req.query.networkId);
    if (req.query.providerSlug) where.providerSlug = req.query.providerSlug;
    const settings = await prisma.networkProviderSetting.findMany({
      where,
      orderBy: [{ networkId: "asc" }, { providerSlug: "asc" }],
    });
    return ok(res, { settings });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.upsertNetworkProviderSetting = async (req, res) => {
  try {
    const { networkId, providerSlug, extNetworkId } = req.body;
    if (!networkId || !providerSlug)
      return fail(res, "networkId and providerSlug are required.", 400);
    const setting = await prisma.networkProviderSetting.upsert({
      where: {
        networkId_providerSlug: {
          networkId: parseInt(networkId),
          providerSlug,
        },
      },
      update: {
        ...(extNetworkId !== undefined && { extNetworkId }),
      },
      create: {
        networkId: parseInt(networkId),
        providerSlug,
        extNetworkId: extNetworkId || "",
      },
    });
    return ok(res, { setting });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── NETWORKS ─────────────────────────────────────────────────────────────────

exports.getNetworks = async (req, res) => {
  try {
    const networks = await prisma.network.findMany({ orderBy: { id: "asc" } });
    return ok(res, { networks });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateNetwork = async (req, res) => {
  try {
    const updates = req.body;
    const network = await prisma.network.update({
      where: { id: parseInt(req.params.id) },
      data: updates,
    });
    return ok(res, { network });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── SERVICES (providers) ─────────────────────────────────────────────────────

exports.getCableProviders = async (req, res) => {
  try {
    const providers = await prisma.cableProvider.findMany({
      include: { plans: true },
    });
    return ok(res, { providers });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.getElectricityProviders = async (req, res) => {
  try {
    const providers = await prisma.electricityProvider.findMany();
    return ok(res, { providers });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.getExamProviders = async (req, res) => {
  try {
    const providers = await prisma.examProvider.findMany({ orderBy: { id: "asc" } });
    return ok(res, { providers });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createExamProvider = async (req, res) => {
  try {
    const { name, examCode, price, buyingPrice, status } = req.body;
    if (!name || !examCode) return fail(res, "name and examCode are required.");
    const provider = await prisma.examProvider.create({
      data: {
        name,
        examCode: examCode.toLowerCase(),
        price: parseInt(price) || 0,
        buyingPrice: parseInt(buyingPrice) || 0,
        status: status || "On",
      },
    });
    return ok(res, { provider }, 201);
  } catch (e) {
    console.error("[createExamProvider]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.updateExamProvider = async (req, res) => {
  try {
    const { name, examCode, price, buyingPrice, status } = req.body;
    const provider = await prisma.examProvider.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(examCode !== undefined && { examCode: examCode.toLowerCase() }),
        ...(price !== undefined && { price: parseInt(price) }),
        ...(buyingPrice !== undefined && { buyingPrice: parseInt(buyingPrice) }),
        ...(status !== undefined && { status }),
      },
    });
    return ok(res, { provider });
  } catch (e) {
    console.error("[updateExamProvider]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.deleteExamProvider = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.examProvider.delete({ where: { id } });
    return ok(res, { msg: "Provider deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateProviderStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    let updated;
    if (type === "cable") {
      updated = await prisma.cableProvider.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    } else if (type === "electricity") {
      updated = await prisma.electricityProvider.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    } else if (type === "exam") {
      updated = await prisma.examProvider.update({
        where: { id: parseInt(id) },
        data: { status },
      });
    } else {
      return fail(res, "Invalid provider type.");
    }

    return ok(res, { msg: "Provider status updated.", provider: updated });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findFirst();
    return ok(res, { settings });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findFirst();
    if (!settings) return fail(res, "Settings not found.", 404);

    // Whitelist only known SiteSetting fields
    const ALLOWED = new Set([
      "sitename",
      "sitetitle",
      "sitedesc",
      "siteurl",
      "address",
      "logoUrl",
      "faviconUrl",
      "phone",
      "email",
      "whatsapp",
      "whatsappGroup",
      "facebook",
      "twitter",
      "instagram",
      "telegram",
      "agentUpgradeFee",
      "vendorUpgradeFee",
      "referralUpgradeBonus",
      "referralAirtimeBonus",
      "referralDataBonus",
      "referralWalletBonus",
      "referralCableBonus",
      "referralExamBonus",
      "referralMeterBonus",
      "referralBonusPercent",
      "walletToWalletFee",
      "siteColor",
      "accountName",
      "accountNo",
      "bankName",
      "electricityCharges",
      "cableFee",
      "electricityFee",
      "airtimeMin",
      "airtimeMax",
      "airtimedaily",
      "smileDiscount",
      "kycOption",
      "kycBvnCharges",
      "kycNinCharges",
      "kycShouldVerify",
      "kycShouldEnable",
      "notificationStatus",
      "loginDesign",
      "homeDesign",
      "apiDocumentation",
      "walletFundingFeePercent",
      "walletFundingFeeCap",
    ]);
    const NUMERIC_FIELDS = new Set([
      "referralUpgradeBonus", "referralAirtimeBonus", "referralDataBonus",
      "referralWalletBonus", "referralCableBonus", "referralExamBonus",
      "referralMeterBonus", "referralBonusPercent", "walletToWalletFee",
    ]);
    const data = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (ALLOWED.has(k)) data[k] = NUMERIC_FIELDS.has(k) ? parseFloat(v) || 0 : v;
    }
    const updated = await prisma.siteSetting.update({
      where: { id: settings.id },
      data,
    });
    return ok(res, { settings: updated });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── BLACKLIST ────────────────────────────────────────────────────────────────

exports.getBlacklist = async (req, res) => {
  try {
    const items = await prisma.blacklist.findMany({
      orderBy: { dateAdded: "desc" },
    });
    return ok(res, { blacklist: items });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.addToBlacklist = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return fail(res, "Phone number required.");
    const item = await prisma.blacklist.upsert({
      where: { phone },
      update: { dateAdded: new Date() },
      create: { phone },
    });
    return ok(res, { item }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.removeFromBlacklist = async (req, res) => {
  try {
    await prisma.blacklist.delete({ where: { id: parseInt(req.params.id) } });
    return ok(res, { msg: "Removed from blacklist." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── CONTACT MESSAGES ───────────────────────────────────────────────────────────────

exports.getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = unread === "1" ? { isRead: false } : {};

    const [messages, total, unreadCount] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.count({ where }),
      prisma.contact.count({ where: { isRead: false } }),
    ]);

    return ok(res, {
      messages,
      meta: {
        total,
        unreadCount,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (e) {
    return fail(res, "Failed to fetch messages.", 500);
  }
};

exports.markContactRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msg = await prisma.contact.findUnique({ where: { id } });
    if (!msg) return fail(res, "Message not found.", 404);
    const updated = await prisma.contact.update({
      where: { id },
      data: { isRead: !msg.isRead },
    });
    return ok(res, { message: updated });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── ISSUES / SUPPORT ─────────────────────────────────────────────────────────

exports.getIssues = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: { replies: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.issue.count(),
    ]);
    await prisma.issue.updateMany({ data: { adminRead: true } });
    return ok(res, { issues });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.replyIssue = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return fail(res, "Reply text required.");
    const r = await prisma.reply.create({
      data: { issueId: parseInt(req.params.id), replyBy: "Admin", reply },
    });
    return ok(res, { reply: r }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── API CONFIGS ──────────────────────────────────────────────────────────────

exports.getApiConfigs = async (req, res) => {
  try {
    const configs = await prisma.apiConfig.findMany({
      orderBy: { name: "asc" },
    });
    // Decrypt values before sending to admin UI
    const decrypted = configs.map((c) => ({
      ...c,
      value: decrypt(c.value),
    }));
    return ok(res, { configs: decrypted });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateApiConfig = async (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name) return fail(res, "Config name required.");
    // Encrypt the value before storing — skip if already encrypted (idempotent)
    const safeValue = value && !isEncrypted(value) ? encrypt(value) : value;
    const config = await prisma.apiConfig.upsert({
      where: { name },
      update: { value: safeValue, updatedAt: new Date() },
      create: { name, value: safeValue },
    });
    return ok(res, { config: { ...config, value: decrypt(config.value) } });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword)
      return fail(res, "userId and newPassword required.");
    if (newPassword.length < 6)
      return fail(res, "Password must be at least 6 characters.");
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { password: hashed },
    });
    return ok(res, {}, 200);
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to reset password.", 500);
  }
};

exports.resetUserPin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { pin } = req.body;
    if (!pin) return fail(res, "New PIN is required.");
    if (!/^\d{4}$/.test(String(pin)))
      return fail(res, "PIN must be exactly 4 digits.");
    const hashed = await bcrypt.hash(String(pin), 10);
    await prisma.user.update({
      where: { id },
      data: { pin: hashed, pinDisabled: false },
    });
    return ok(res, { msg: "Transaction PIN reset successfully." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── FILE UPLOAD: Logo / Favicon ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const type = req.params.type; // "logo" or "favicon"
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${type}${ext}`);
  },
});

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/webp",
]);

const uploadMiddleware = multer({
  storage: uploadStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files are allowed."));
  },
}).single("file");

exports.uploadBranding = (req, res) => {
  const validTypes = ["logo", "favicon"];
  if (!validTypes.includes(req.params.type)) {
    return fail(res, "Invalid type. Use 'logo' or 'favicon'.", 400);
  }

  uploadMiddleware(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return fail(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return fail(res, err.message, 400);
    }
    if (!req.file) return fail(res, "No file uploaded.", 400);

    // Build the public URL the frontend will use
    const protocol = req.protocol;
    const host = req.get("host");
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    // Save URL to site_settings
    const field = req.params.type === "logo" ? "logoUrl" : "faviconUrl";
    const settings = await prisma.siteSetting.findFirst();
    if (!settings) return fail(res, "Settings not found.", 404);

    await prisma.siteSetting.update({
      where: { id: settings.id },
      data: { [field]: fileUrl },
    });

    return ok(res, { url: fileUrl });
  });
};

// ─── UPGRADE REQUESTS ─────────────────────────────────────────────────────────

exports.getUpgradeRequests = async (req, res) => {
  try {
    const { status = "" } = req.query;
    const where = status !== "" ? { status: parseInt(status) } : {};
    const requests = await prisma.upgradeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            phone: true,
            type: true,
          },
        },
      },
    });
    return ok(res, { requests });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.approveUpgradeRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = await prisma.upgradeRequest.findUnique({ where: { id } });
    if (!request) return fail(res, "Request not found.", 404);
    if (request.status !== 0) return fail(res, "Request already processed.");

    await prisma.$transaction([
      prisma.upgradeRequest.update({ where: { id }, data: { status: 1 } }),
      prisma.user.update({ where: { id: request.userId }, data: { type: 2 } }),
    ]);
    return ok(res, { msg: "Upgrade approved." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.rejectUpgradeRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { note } = req.body;
    const request = await prisma.upgradeRequest.findUnique({ where: { id } });
    if (!request) return fail(res, "Request not found.", 404);
    if (request.status !== 0) return fail(res, "Request already processed.");

    await prisma.upgradeRequest.update({
      where: { id },
      data: { status: 2, ...(note && { note }) },
    });
    return ok(res, { msg: "Upgrade rejected." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};


// ─── PROVIDER WALLET BALANCES ─────────────────────────────────────────────────

exports.getProviderBalances = async (req, res) => {
  try {
    const configs = await prisma.apiConfig.findMany();
    const cfg = {};
    for (const c of configs) cfg[c.name] = decrypt(c.value) || "";

    const slots = ["One", "Two", "Three", "Four", "Five"];
    const results = [];

    for (const slot of slots) {
      const apiKey = cfg[`wallet${slot}Api`];
      const url = cfg[`wallet${slot}Provider`];
      const label = cfg[`wallet${slot}Name`] || `Wallet ${slot}`;

      if (!apiKey || !url) continue;

      let balance = null;
      let error = null;

      try {
        // Determine auth type from URL
        const isBasic =
          url.includes("n3tdata") ||
          url.includes("legitdataway") ||
          url.includes("nabatulusub") ||
          url.includes("fatizara") ||
          url.includes("bilalsadasub") ||
          url.includes("rabdata360");
        const isBearer = url.includes("azaravtu");

        const authHeader = isBasic
          ? `Basic ${apiKey}`
          : isBearer
            ? `Bearer ${apiKey}`
            : `Token ${apiKey}`;

        const { data } = await axios({
          method: isBasic ? "post" : "get",
          url,
          headers: { Authorization: authHeader },
          timeout: 10000,
        });

        // Try multiple response shapes
        if (data?.user?.wallet_balance != null)
          balance = data.user.wallet_balance;
        else if (data?.user?.wallet != null) balance = data.user.wallet;
        else if (data?.wallet_balance != null) balance = data.wallet_balance;
        else if (data?.balance != null) balance = data.balance;
        else if (data?.data?.balance != null) balance = data.data.balance;
        else if (data?.data?.wallet != null) balance = data.data.wallet;
        else error = "Unrecognised response";
      } catch (e) {
        error = e.message || "Connection failed";
      }

      results.push({ slot, label, balance, error });
    }

    return ok(res, { balances: results });
  } catch (e) {
    return fail(res, "Failed to fetch provider balances.", 500);
  }
};

// ─── API LINKS (Provider URLs) ─────────────────────────────────────────────────

exports.getApiLinks = async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const links = await prisma.apiLink.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return ok(res, { links });
  } catch (e) {
    return fail(res, "Failed to fetch API links.", 500);
  }
};

exports.createApiLink = async (req, res) => {
  try {
    const { name, value, type, apiKey } = req.body;
    if (!name || !type) return fail(res, "Name and type are required.");
    const link = await prisma.apiLink.create({
      data: { name, value, type, apiKey: apiKey || "" },
    });
    return ok(res, { link }, 201);
  } catch (e) {
    return fail(res, "Failed to create API link.", 500);
  }
};

exports.updateApiLink = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, value, type, apiKey } = req.body;
    if (!name || !type) return fail(res, "Name and type are required.");
    const link = await prisma.apiLink.update({
      where: { id },
      data: { name, value, type, apiKey: apiKey !== undefined ? apiKey : "" },
    });
    return ok(res, { link });
  } catch (e) {
    return fail(res, "Failed to update API link.", 500);
  }
};

exports.deleteApiLink = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.apiLink.delete({ where: { id } });
    return ok(res, { msg: "API link deleted." });
  } catch (e) {
    return fail(res, "Failed to delete API link.", 500);
  }
};

// ─── SERVICE CONFIGS — flat, service-centric endpoints ───────────────────────
// Each "config" = one provider entry for one service key.
// Wraps ApiProvider + ProviderService in a single flat object.

exports.getServiceConfigs = async (req, res) => {
  try {
    const services = await prisma.providerService.findMany({
      include: { provider: true },
      orderBy: { id: "asc" },
    });
    // Group by serviceKey for easy frontend consumption
    const grouped = {};
    for (const svc of services) {
      if (!grouped[svc.serviceKey]) grouped[svc.serviceKey] = [];
      grouped[svc.serviceKey].push({
        id: svc.id,
        providerId: svc.providerId,
        name: svc.provider.name,
        baseUrl: svc.provider.baseUrl,
        apiKey: svc.provider.apiKey,
        apiSecret: svc.provider.apiSecret,
        authType: svc.provider.authType,
        networkCode: svc.networkCode,
        serviceUrl: svc.serviceUrl,
        isActive: svc.isActive,
      });
    }
    return ok(res, { configs: grouped });
  } catch (e) {
    console.error(e);
    return fail(res, "Failed to fetch service configs.", 500);
  }
};

exports.createServiceConfig = async (req, res) => {
  try {
    const {
      serviceKey,
      name,
      baseUrl,
      apiKey,
      apiSecret,
      authType,
      networkCode,
    } = req.body;
    if (!serviceKey || !name)
      return fail(res, "serviceKey and name are required.");
    const provider = await prisma.apiProvider.create({
      data: {
        name: name.trim(),
        baseUrl: (baseUrl || "").trim(),
        apiKey: (apiKey || "").trim(),
        apiSecret: (apiSecret || "").trim(),
        authType: authType || "token",
      },
    });
    const service = await prisma.providerService.create({
      data: {
        providerId: provider.id,
        serviceKey: serviceKey.trim(),
        networkCode: (networkCode || "").trim(),
        isActive: false,
      },
    });
    return ok(
      res,
      {
        config: {
          id: service.id,
          providerId: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          apiSecret: provider.apiSecret,
          authType: provider.authType,
          networkCode: service.networkCode,
          isActive: service.isActive,
        },
      },
      201,
    );
  } catch (e) {
    console.error(e);
    return fail(res, "Failed to create config.", 500);
  }
};

exports.updateServiceConfig = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const { name, baseUrl, apiKey, apiSecret, authType, networkCode } =
      req.body;
    const service = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });
    if (!service) return fail(res, "Config not found.", 404);
    await prisma.apiProvider.update({
      where: { id: service.providerId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(baseUrl !== undefined && { baseUrl: baseUrl.trim() }),
        ...(apiKey !== undefined && { apiKey: apiKey.trim() }),
        ...(apiSecret !== undefined && { apiSecret: apiSecret.trim() }),
        ...(authType !== undefined && { authType }),
      },
    });
    await prisma.providerService.update({
      where: { id: serviceId },
      data: {
        ...(networkCode !== undefined && { networkCode: networkCode.trim() }),
      },
    });
    return ok(res, { msg: "Config updated." });
  } catch (e) {
    return fail(res, "Failed to update config.", 500);
  }
};

exports.deleteServiceConfig = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const service = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });
    if (!service) return fail(res, "Config not found.", 404);
    const providerId = service.providerId;
    await prisma.providerService.delete({ where: { id: serviceId } });
    // Clean up orphan provider
    const remaining = await prisma.providerService.count({
      where: { providerId },
    });
    if (remaining === 0)
      await prisma.apiProvider.delete({ where: { id: providerId } });
    return ok(res, { msg: "Config deleted." });
  } catch (e) {
    return fail(res, "Failed to delete config.", 500);
  }
};

exports.toggleServiceConfig = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const service = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });
    if (!service) return fail(res, "Config not found.", 404);
    const newActive = !service.isActive;
    if (newActive) {
      await prisma.providerService.updateMany({
        where: {
          serviceKey: service.serviceKey,
          isActive: true,
          id: { not: serviceId },
        },
        data: { isActive: false },
      });
    }
    await prisma.providerService.update({
      where: { id: serviceId },
      data: { isActive: newActive },
    });
    return ok(res, { isActive: newActive });
  } catch (e) {
    return fail(res, "Failed to toggle.", 500);
  }
};

// ─── API PROVIDERS (multi-provider system) ────────────────────────────────────

exports.getProviders = async (req, res) => {
  try {
    const providers = await prisma.apiProvider.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        services: {
          orderBy: { serviceKey: "asc" },
          include: { planCodes: true },
        },
      },
    });
    return ok(res, { providers });
  } catch (e) {
    console.error(e);
    return fail(res, "Failed to fetch providers.", 500);
  }
};

exports.createProvider = async (req, res) => {
  try {
    const { name, baseUrl, apiKey, apiSecret, authType, notes } = req.body;
    if (!name) return fail(res, "Provider name is required.");
    const provider = await prisma.apiProvider.create({
      data: {
        name: name.trim(),
        baseUrl: baseUrl?.trim() || "",
        apiKey: apiKey?.trim() || "",
        apiSecret: apiSecret?.trim() || "",
        authType: authType || "token",
        notes: notes?.trim() || "",
      },
    });
    return ok(res, { provider }, 201);
  } catch (e) {
    return fail(res, "Failed to create provider.", 500);
  }
};

exports.updateProvider = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, baseUrl, apiKey, apiSecret, authType, notes } = req.body;
    const provider = await prisma.apiProvider.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(baseUrl !== undefined && { baseUrl: baseUrl.trim() }),
        ...(apiKey !== undefined && { apiKey: apiKey.trim() }),
        ...(apiSecret !== undefined && { apiSecret: apiSecret.trim() }),
        ...(authType !== undefined && { authType }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
    });
    return ok(res, { provider });
  } catch (e) {
    return fail(res, "Failed to update provider.", 500);
  }
};

exports.deleteProvider = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.apiProvider.delete({ where: { id } });
    return ok(res, { msg: "Provider deleted." });
  } catch (e) {
    return fail(res, "Failed to delete provider.", 500);
  }
};

// ─── PROVIDER SERVICES ────────────────────────────────────────────────────────

exports.upsertProviderService = async (req, res) => {
  try {
    const providerId = parseInt(req.params.id);
    const { serviceKey, networkCode, serviceUrl } = req.body;
    if (!serviceKey) return fail(res, "serviceKey is required.");

    // Check provider exists
    const exists = await prisma.apiProvider.findUnique({
      where: { id: providerId },
    });
    if (!exists) return fail(res, "Provider not found.", 404);

    const service = await prisma.providerService.upsert({
      where: { providerId_serviceKey: { providerId, serviceKey } },
      create: {
        providerId,
        serviceKey,
        networkCode: networkCode || "",
        serviceUrl: serviceUrl || "",
        isActive: false,
      },
      update: {
        networkCode: networkCode !== undefined ? networkCode : undefined,
        serviceUrl: serviceUrl !== undefined ? serviceUrl : undefined,
      },
    });
    return ok(res, { service });
  } catch (e) {
    console.error(e);
    return fail(res, "Failed to save service config.", 500);
  }
};

// ─── DATA CARD PLANS ──────────────────────────────────────────────────────────

exports.getDataCardPlans = async (req, res) => {
  try {
    const plans = await prisma.dataCardPlan.findMany({
      orderBy: [{ networkId: "asc" }, { userPrice: "asc" }],
    });
    return ok(res, { plans });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createDataCardPlan = async (req, res) => {
  try {
    const {
      name,
      networkId,
      networkName,
      planType,
      cardName,
      buyingPrice,
      userPrice,
      vendorPrice,
      loadPin,
      checkBalance,
      validity,
      status,
    } = req.body;
    if (!name || !networkId || !planType || !cardName || !userPrice)
      return fail(
        res,
        "name, networkId, planType, cardName and userPrice are required.",
      );
    const plan = await prisma.dataCardPlan.create({
      data: {
        name,
        networkId: parseInt(networkId),
        networkName: networkName || "",
        planType: parseInt(planType),
        cardName,
        buyingPrice: buyingPrice || "0",
        userPrice,
        vendorPrice: vendorPrice || userPrice,
        loadPin: loadPin || null,
        checkBalance: checkBalance || null,
        validity: validity || "30",
        status: status || "On",
      },
    });
    return ok(res, { plan }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateDataCardPlan = async (req, res) => {
  try {
    const {
      name,
      networkId,
      networkName,
      planType,
      cardName,
      buyingPrice,
      userPrice,
      vendorPrice,
      loadPin,
      checkBalance,
      validity,
      status,
    } = req.body;
    const plan = await prisma.dataCardPlan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(networkId !== undefined && { networkId: parseInt(networkId) }),
        ...(networkName !== undefined && { networkName }),
        ...(planType !== undefined && { planType: parseInt(planType) }),
        ...(cardName !== undefined && { cardName }),
        ...(buyingPrice !== undefined && { buyingPrice }),
        ...(userPrice !== undefined && { userPrice }),
        ...(vendorPrice !== undefined && { vendorPrice }),
        ...(loadPin !== undefined && { loadPin }),
        ...(checkBalance !== undefined && { checkBalance }),
        ...(validity !== undefined && { validity }),
        ...(status !== undefined && { status }),
      },
    });
    return ok(res, { plan });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteDataCardPlan = async (req, res) => {
  try {
    await prisma.dataCardPlan.delete({
      where: { id: parseInt(req.params.id) },
    });
    return ok(res, { msg: "Plan deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── Recharge Card Plans ──────────────────────────────────────────────────────

exports.getRechargeCardPlans = async (req, res) => {
  try {
    const plans = await prisma.rechargeCardPlan.findMany({
      orderBy: [{ networkId: "asc" }, { userPrice: "asc" }],
    });
    return ok(res, { plans });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createRechargeCardPlan = async (req, res) => {
  try {
    const {
      name,
      networkId,
      networkName,
      planType,
      cardName,
      buyingPrice,
      userPrice,
      vendorPrice,
      loadPin,
      checkBalance,
      status,
    } = req.body;
    if (!name || !networkId || !planType || !cardName || !userPrice)
      return fail(
        res,
        "name, networkId, planType, cardName and userPrice are required.",
      );
    const plan = await prisma.rechargeCardPlan.create({
      data: {
        name,
        networkId: parseInt(networkId),
        networkName: networkName || "",
        planType: parseInt(planType),
        cardName,
        buyingPrice: buyingPrice || "0",
        userPrice,
        vendorPrice: vendorPrice || userPrice,
        loadPin: loadPin || null,
        checkBalance: checkBalance || null,
        status: status || "On",
      },
    });
    return ok(res, { plan }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateRechargeCardPlan = async (req, res) => {
  try {
    const {
      name,
      networkId,
      networkName,
      planType,
      cardName,
      buyingPrice,
      userPrice,
      vendorPrice,
      loadPin,
      checkBalance,
      status,
    } = req.body;
    const plan = await prisma.rechargeCardPlan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(networkId !== undefined && { networkId: parseInt(networkId) }),
        ...(networkName !== undefined && { networkName }),
        ...(planType !== undefined && { planType: parseInt(planType) }),
        ...(cardName !== undefined && { cardName }),
        ...(buyingPrice !== undefined && { buyingPrice }),
        ...(userPrice !== undefined && { userPrice }),
        ...(vendorPrice !== undefined && { vendorPrice }),
        ...(loadPin !== undefined && { loadPin }),
        ...(checkBalance !== undefined && { checkBalance }),
        ...(status !== undefined && { status }),
      },
    });
    return ok(res, { plan });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteRechargeCardPlan = async (req, res) => {
  try {
    await prisma.rechargeCardPlan.delete({
      where: { id: parseInt(req.params.id) },
    });
    return ok(res, { msg: "Plan deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.toggleProviderService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const service = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });
    if (!service) return fail(res, "Service not found.", 404);

    const newActive = !service.isActive;

    // If activating, deactivate any other provider's service with the same serviceKey
    if (newActive) {
      await prisma.providerService.updateMany({
        where: {
          serviceKey: service.serviceKey,
          isActive: true,
          id: { not: serviceId },
        },
        data: { isActive: false },
      });
    }

    const updated = await prisma.providerService.update({
      where: { id: serviceId },
      data: { isActive: newActive },
    });
    return ok(res, { service: updated });
  } catch (e) {
    return fail(res, "Failed to toggle service.", 500);
  }
};

exports.deleteProviderService = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    await prisma.providerService.delete({ where: { id: serviceId } });
    return ok(res, { msg: "Service config deleted." });
  } catch (e) {
    return fail(res, "Failed to delete service config.", 500);
  }
};

// ─── PROVIDER PLAN CODES ──────────────────────────────────────────────────────

exports.getProviderPlanCodes = async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const planCodes = await prisma.providerPlanCode.findMany({
      where: { providerServiceId: serviceId },
      orderBy: { planId: "asc" },
    });

    // Also return all data plans for the relevant network/type so admin can map them
    const service = await prisma.providerService.findUnique({
      where: { id: serviceId },
    });
    let dataPlans = [];
    if (service) {
      const parts = service.serviceKey.split("_"); // "mtn_sme" → ["mtn", "sme"]
      if (
        parts.length >= 2 &&
        ["sme", "sme2", "gifting", "corporate", "coupon", "awoof"].includes(
          parts[1],
        )
      ) {
        const typeMap = {
          sme: "SME",
          gifting: "Gifting",
          cooperategifting: "Cooperate Gifting",
        };
        const network = await prisma.network.findFirst({
          where: { name: { equals: parts[0], mode: "insensitive" } },
          select: { id: true, name: true },
        });
        if (network) {
          dataPlans = await prisma.dataPlan.findMany({
            where: {
              networkId: network.id,
              type: typeMap[parts[1]] || parts[1].toUpperCase(),
            },
            orderBy: { id: "asc" },
          });
        }
      }
    }

    return ok(res, { planCodes, dataPlans });
  } catch (e) {
    return fail(res, "Failed to fetch plan codes.", 500);
  }
};

exports.upsertProviderPlanCode = async (req, res) => {
  try {
    const providerServiceId = parseInt(req.params.serviceId);
    const { planId, providerCode, buyingPrice } = req.body;
    if (!planId || !providerCode)
      return fail(res, "planId and providerCode are required.");

    const record = await prisma.providerPlanCode.upsert({
      where: {
        providerServiceId_planId: {
          providerServiceId,
          planId: parseInt(planId),
        },
      },
      create: {
        providerServiceId,
        planId: parseInt(planId),
        providerCode: providerCode.trim(),
        buyingPrice: parseFloat(buyingPrice) || 0,
      },
      update: {
        providerCode: providerCode.trim(),
        buyingPrice: parseFloat(buyingPrice) || 0,
      },
    });
    return ok(res, { record });
  } catch (e) {
    return fail(res, "Failed to save plan code.", 500);
  }
};

exports.deleteProviderPlanCode = async (req, res) => {
  try {
    const id = parseInt(req.params.planCodeId);
    await prisma.providerPlanCode.delete({ where: { id } });
    return ok(res, { msg: "Plan code deleted." });
  } catch (e) {
    return fail(res, "Failed to delete plan code.", 500);
  }
};

// ─── AIRTIME DISCOUNTS ────────────────────────────────────────────────────────

exports.getAirtimeDiscounts = async (req, res) => {
  try {
    const { providerSlug } = req.query;
    const where = providerSlug ? { providerSlug } : {};
    const discounts = await prisma.airtimeDiscount.findMany({
      where,
      include: { network: { select: { name: true } } },
      orderBy: [{ networkId: "asc" }, { type: "asc" }],
    });
    return ok(res, { discounts });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createAirtimeDiscount = async (req, res) => {
  try {
    const {
      networkId,
      type,
      providerSlug,
      buyDiscount,
      userDiscount,
      vendorDiscount,
    } = req.body;
    if (!networkId || !type || userDiscount === undefined)
      return fail(res, "Network, type and user discount are required.", 400);

    const data = {
      networkId: parseInt(networkId),
      type,
      providerSlug: providerSlug || "",
      buyDiscount: parseFloat(buyDiscount ?? 96),
      userDiscount: parseFloat(userDiscount),
      vendorDiscount: parseFloat(vendorDiscount ?? userDiscount),
    };

    // Prevent duplicates: update existing record for same network+type if found
    const existing = await prisma.airtimeDiscount.findFirst({
      where: { networkId: parseInt(networkId), type },
    });

    let discount;
    if (existing) {
      discount = await prisma.airtimeDiscount.update({
        where: { id: existing.id },
        data,
        include: { network: { select: { name: true } } },
      });
    } else {
      discount = await prisma.airtimeDiscount.create({
        data,
        include: { network: { select: { name: true } } },
      });
    }
    return ok(res, { discount }, 201);
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.updateAirtimeDiscount = async (req, res) => {
  try {
    const {
      networkId,
      type,
      providerSlug,
      buyDiscount,
      userDiscount,
      vendorDiscount,
    } = req.body;
    const discount = await prisma.airtimeDiscount.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(networkId && { networkId: parseInt(networkId) }),
        ...(type !== undefined && { type }),
        ...(providerSlug !== undefined && { providerSlug }),
        ...(buyDiscount !== undefined && {
          buyDiscount: parseFloat(buyDiscount),
        }),
        ...(userDiscount !== undefined && {
          userDiscount: parseFloat(userDiscount),
        }),
        ...(vendorDiscount !== undefined && {
          vendorDiscount: parseFloat(vendorDiscount),
        }),
      },
      include: { network: { select: { name: true } } },
    });
    return ok(res, { discount });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.deleteAirtimeDiscount = async (req, res) => {
  try {
    await prisma.airtimeDiscount.delete({
      where: { id: parseInt(req.params.id) },
    });
    return ok(res, { msg: "Discount deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── DIAGNOSTICS ─────────────────────────────────────────────────────────────
exports.getVtuDiagnostics = async (req, res) => {
  try {
    const recent = await prisma.transaction.findMany({
      where: { status: 0 },
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        transref: true,
        servicename: true,
        servicedesc: true,
        date: true,
        apiResponseLog: true,
        apiResponse: true,
      },
    });
    return ok(res, { recent });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── KYC MANAGEMENT ──────────────────────────────────────────────────────────

exports.getKycVerifications = async (req, res) => {
  try {
    const verifications = await prisma.kycVerification.findMany({
      include: {
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    return ok(res, { verifications });
  } catch (e) {
    console.error("[getKycVerifications]", e);
    return fail(res, "Failed to fetch KYC records.", 500);
  }
};

exports.approveKycVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const kyc = await prisma.kycVerification.findUnique({
      where: { id: parseInt(id) || undefined },
      include: { user: true }
    });

    if (!kyc) return fail(res, "Record not found.", 404);

    await prisma.$transaction([
      prisma.kycVerification.update({
        where: { id: kyc.id },
        data: { status: "verified" }
      }),
      prisma.user.update({
        where: { id: kyc.userId },
        data: { 
          kycStatus: "verified",
          bvn: kyc.method === "BVN" ? kyc.number : undefined,
          nin: kyc.method === "NIN" ? kyc.number : undefined,
          dob: kyc.dob
        }
      })
    ]);

    return ok(res, {}, "KYC approved successfully.");
  } catch (e) {
    console.error("[approveKyc]", e);
    return fail(res, "Failed to approve KYC.", 500);
  }
};

// ─── CABLE PLANS ─────────────────────────────────────────────────────────────

exports.getCablePlans = async (req, res) => {
  try {
    const plans = await prisma.cablePlan.findMany({
      include: { provider: true },
      orderBy: [{ providerId: "asc" }, { userPrice: "asc" }],
    });
    return ok(res, { plans });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createCablePlan = async (req, res) => {
  try {
    const { name, providerId, planCode, buyingPrice, userPrice, validity, type, status } = req.body;
    if (!name || !providerId || !planCode || !buyingPrice)
      return fail(res, "name, providerId, planCode and buyingPrice are required.");
    const plan = await prisma.cablePlan.create({
      data: {
        name,
        providerId: parseInt(providerId),
        planCode,
        buyingPrice: String(buyingPrice),
        userPrice: String(userPrice || buyingPrice),
        vendorPrice: String(userPrice || buyingPrice),
        validity: validity || "30 days",
        type: type || null,
        status: status || "On",
      },
    });
    return ok(res, { plan }, 201);
  } catch (e) {
    console.error("[createCablePlan]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.updateCablePlan = async (req, res) => {
  try {
    const { name, providerId, planCode, buyingPrice, userPrice, validity, type, status } = req.body;
    const plan = await prisma.cablePlan.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(providerId !== undefined && { providerId: parseInt(providerId) }),
        ...(planCode !== undefined && { planCode }),
        ...(buyingPrice !== undefined && { buyingPrice: String(buyingPrice) }),
        ...(userPrice !== undefined && { userPrice: String(userPrice), vendorPrice: String(userPrice) }),
        ...(validity !== undefined && { validity }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
      },
    });
    return ok(res, { plan });
  } catch (e) {
    console.error("[updateCablePlan]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.deleteCablePlan = async (req, res) => {
  try {
    await prisma.cablePlan.delete({ where: { id: parseInt(req.params.id) } });
    return ok(res, { msg: "Plan deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── CABLE PROVIDERS ─────────────────────────────────────────────────────────

exports.getCableProviders = async (req, res) => {
  try {
    const providers = await prisma.cableProvider.findMany({
      include: { plans: true },
      orderBy: { id: "asc" },
    });
    return ok(res, { providers });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createCableProvider = async (req, res) => {
  try {
    const { name, cableCode, status } = req.body;
    if (!name || !cableCode) return fail(res, "name and cableCode are required.");
    const provider = await prisma.cableProvider.create({
      data: { name, cableCode: cableCode.toUpperCase(), status: status || "On" },
    });
    return ok(res, { provider }, 201);
  } catch (e) {
    console.error("[createCableProvider]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.updateCableProvider = async (req, res) => {
  try {
    const { name, cableCode, status } = req.body;
    const provider = await prisma.cableProvider.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(cableCode !== undefined && { cableCode: cableCode.toUpperCase() }),
        ...(status !== undefined && { status }),
      },
    });
    return ok(res, { provider });
  } catch (e) {
    console.error("[updateCableProvider]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.deleteCableProvider = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const planCount = await prisma.cablePlan.count({ where: { providerId: id } });
    if (planCount > 0) return fail(res, "Cannot delete provider with plans. Delete plans first.");
    await prisma.cableProvider.delete({ where: { id } });
    return ok(res, { msg: "Provider deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

// ─── ELECTRICITY PROVIDERS ───────────────────────────────────────────────────

exports.getElectricityProviders = async (req, res) => {
  try {
    const providers = await prisma.electricityProvider.findMany({
      orderBy: { id: "asc" },
    });
    return ok(res, { providers });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.createElectricityProvider = async (req, res) => {
  try {
    const { name, electricityCode, abbreviation, status } = req.body;
    if (!name || !electricityCode || !abbreviation)
      return fail(res, "name, electricityCode and abbreviation are required.");
    const provider = await prisma.electricityProvider.create({
      data: { name, electricityCode, abbreviation: abbreviation.toUpperCase(), status: status || "On" },
    });
    return ok(res, { provider }, 201);
  } catch (e) {
    console.error("[createElectricityProvider]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.updateElectricityProvider = async (req, res) => {
  try {
    const { name, electricityCode, abbreviation, status } = req.body;
    const provider = await prisma.electricityProvider.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(electricityCode !== undefined && { electricityCode }),
        ...(abbreviation !== undefined && { abbreviation: abbreviation.toUpperCase() }),
        ...(status !== undefined && { status }),
      },
    });
    return ok(res, { provider });
  } catch (e) {
    console.error("[updateElectricityProvider]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.deleteElectricityProvider = async (req, res) => {
  try {
    await prisma.electricityProvider.delete({ where: { id: parseInt(req.params.id) } });
    return ok(res, { msg: "Provider deleted." });
  } catch (e) {
    return fail(res, "Failed.", 500);
  }
};

exports.rejectKycVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const kyc = await prisma.kycVerification.findUnique({
      where: { id: parseInt(id) || undefined }
    });

    if (!kyc) return fail(res, "Record not found.", 404);

    await prisma.$transaction([
      prisma.kycVerification.update({
        where: { id: kyc.id },
        data: { status: "rejected" }
      }),
      prisma.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: "not-started" }
      })
    ]);

    return ok(res, {}, "KYC rejected successfully.");
  } catch (e) {
    console.error("[rejectKyc]", e);
    return fail(res, "Failed to reject KYC.", 500);
  }
};

// ─── AIRTIME TO CASH ──────────────────────────────────────────────────────

exports.getAtcSettings = async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findFirst();
    return ok(res, {
      atcEnabled: settings?.atcEnabled || "yes",
      atcRate: settings?.atcRate || "80",
      atcMtnNumber: settings?.atcMtnNumber || "",
      atcAirtelNumber: settings?.atcAirtelNumber || "",
      atcMinAmount: settings?.atcMinAmount || "100",
      atcMaxAmount: settings?.atcMaxAmount || "50000",
    });
  } catch (e) {
    console.error("[getAtcSettings]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.updateAtcSettings = async (req, res) => {
  try {
    const { atcEnabled, atcRate, atcMtnNumber, atcAirtelNumber, atcMinAmount, atcMaxAmount } = req.body;
    const settings = await prisma.siteSetting.findFirst();
    if (!settings) return fail(res, "Settings not found.", 404);

    await prisma.siteSetting.update({
      where: { id: settings.id },
      data: {
        ...(atcEnabled !== undefined && { atcEnabled }),
        ...(atcRate !== undefined && { atcRate: String(atcRate) }),
        ...(atcMtnNumber !== undefined && { atcMtnNumber: String(atcMtnNumber) }),
        ...(atcAirtelNumber !== undefined && { atcAirtelNumber: String(atcAirtelNumber) }),
        ...(atcMinAmount !== undefined && { atcMinAmount: String(atcMinAmount) }),
        ...(atcMaxAmount !== undefined && { atcMaxAmount: String(atcMaxAmount) }),
      },
    });
    return ok(res, { msg: "ATC settings updated." });
  } catch (e) {
    console.error("[updateAtcSettings]", e);
    return fail(res, "Failed to update settings.", 500);
  }
};

exports.getAtcTransactions = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status && status !== "all" ? { status } : {};
    const requests = await prisma.airtimeToCash.findMany({
      where,
      include: { user: { select: { id: true, firstname: true, lastname: true, phone: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, { requests });
  } catch (e) {
    console.error("[getAtcTransactions]", e);
    return fail(res, "Failed.", 500);
  }
};

exports.verifyAtcTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["completed", "rejected"].includes(status))
      return fail(res, "Status must be 'completed' or 'rejected'.");

    const request = await prisma.airtimeToCash.findUnique({ where: { id: parseInt(id) } });
    if (!request) return fail(res, "Transaction not found.", 404);
    if (request.status !== "pending") return fail(res, "Transaction already processed.");

    if (status === "completed") {
      const atcProfit = request.amount - request.receiveAmount;
      if (request.payoutMethod === "wallet") {
        const user = await prisma.user.findUnique({ where: { id: request.userId }, select: { wallet: true } });
        const newWallet = (user.wallet || 0) + request.receiveAmount;
        await prisma.$transaction([
          prisma.airtimeToCash.update({
            where: { id: request.id },
            data: { status: "completed", adminNote: adminNote || null },
          }),
          prisma.user.update({
            where: { id: request.userId },
            data: { wallet: newWallet },
          }),
          prisma.transaction.updateMany({
            where: { transref: request.ref },
            data: {
              status: 1,
              oldbal: (user.wallet || 0).toString(),
              newbal: newWallet.toString(),
              profit: atcProfit,
            },
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.airtimeToCash.update({
            where: { id: request.id },
            data: { status: "completed", adminNote: adminNote || null },
          }),
          prisma.transaction.updateMany({
            where: { transref: request.ref },
            data: { status: 1, profit: atcProfit },
          }),
        ]);
      }
    } else {
      await prisma.$transaction([
        prisma.airtimeToCash.update({
          where: { id: request.id },
          data: { status: "rejected", adminNote: adminNote || "Rejected by admin" },
        }),
        prisma.transaction.updateMany({
          where: { transref: request.ref },
          data: { status: 0 },
        }),
      ]);
    }

    return ok(res, { msg: `Transaction ${status}.` });
  } catch (e) {
    console.error("[verifyAtc]", e);
    return fail(res, "Failed to verify transaction.", 500);
  }
};
