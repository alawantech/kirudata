const prisma = require("../config/prisma");

// Normalise string status values ("success", "fail", "processing") to the
// integer values stored in the DB:  1 = Success, 0 = Failed, 2 = Processing
function normalizeStatus(status) {
  if (typeof status === "number") return status;
  const s = String(status).toLowerCase().trim();
  if (s === "success" || s === "successful" || s === "delivered") return 1;
  if (s === "processing" || s === "pending") return 2;
  return 0; // failed / fail / anything else
}

const TransactionModel = {
  async create({
    userId,
    transref,
    servicename,
    servicedesc,
    amount,
    status,
    oldbal,
    newbal,
    profit = 0,
    apiResponse = null,
    apiResponseLog = null,
  }) {
    return prisma.transaction.create({
      data: {
        userId,
        transref,
        servicename,
        servicedesc,
        amount: String(amount),
        status: normalizeStatus(status),
        oldbal: String(oldbal),
        newbal: String(newbal),
        profit,
        apiResponse,
        apiResponseLog,
      },
    });
  },

  async updateStatus(
    transref,
    status,
    apiResponse = null,
    apiResponseLog = null,
  ) {
    const updateData = { status: normalizeStatus(status) };
    if (apiResponse !== null) updateData.apiResponse = String(apiResponse);
    if (apiResponseLog !== null)
      updateData.apiResponseLog = String(apiResponseLog);
    await prisma.transaction.update({
      where: { transref },
      data: updateData,
    });
  },

  // Returns true if an identical transaction was made in the last 30 seconds
  async checkDuplicate(userId, servicedesc) {
    const since = new Date(Date.now() - 30 * 1000);
    const tx = await prisma.transaction.findFirst({
      where: {
        userId,
        servicedesc,
        date: { gte: since },
        status: { not: 0 }, // 0 = Failed — allow immediate retry of failed transactions
      },
      select: { id: true },
    });
    return !!tx;
  },

  async findByRef(transref, userId) {
    return prisma.transaction.findFirst({
      where: { transref, userId },
      include: {
        user: { select: { firstname: true, lastname: true, phone: true } },
      },
    });
  },

  async findByUser(userId, limit = 20, offset = 0) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });
  },

  async refExists(transref) {
    const tx = await prisma.transaction.findUnique({
      where: { transref },
      select: { id: true },
    });
    return !!tx;
  },
};

module.exports = TransactionModel;
