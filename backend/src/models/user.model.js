const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const UserModel = {
  async findByEmailOrPhone(identifier) {
    return prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async exists(email, phone) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { id: true },
    });
    return !!user;
  },

  async create({
    firstname,
    lastname,
    email,
    phone,
    password,
    state,
    referral,
  }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const apiKey = randomUUID().replace(/-/g, "");
    const user = await prisma.user.create({
      data: {
        apiKey,
        firstname,
        lastname,
        email,
        phone,
        password: hashedPassword,
        state: state || "",
        referral: referral || null,
        pin: "",
        pinDisabled: true,
      },
    });
    return user.id;
  },

  async verify(id) {
    await prisma.user.update({
      where: { id },
      data: { regStatus: 1, verCode: 0 },
    });
  },

  async setVerificationCode(id, code) {
    await prisma.user.update({ where: { id }, data: { verCode: code } });
  },

  async getVerificationCode(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { verCode: true },
    });
    return user?.verCode ?? null;
  },

  async updateLastActivity(id) {
    await prisma.user.update({
      where: { id },
      data: { lastActivity: new Date() },
    });
  },

  async updatePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
  },

  // Returns user object if PIN correct (or PIN disabled), null if wrong
  async verifyTransactionPin(id, pin) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        apiKey: true,
        wallet: true,
        type: true,
        pin: true,
        pinDisabled: true,
      },
    });
    if (!user) return null;
    if (user.pinDisabled) return user; // skip PIN check
    if (!user.pin) return null; // pin not set but not disabled — inconsistent state
    const match = await bcrypt.compare(String(pin), user.pin);
    if (!match) return null;
    return user;
  },

  // Atomic wallet deduction � safe, will not go negative
  async deductWallet(id, amount) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id },
          select: { wallet: true },
        });
        if (user.wallet < amount) throw new Error("Insufficient balance");
        await tx.user.update({
          where: { id },
          data: { wallet: { decrement: amount } },
        });
      });
      return true;
    } catch {
      return false;
    }
  },

  async creditWallet(id, amount) {
    await prisma.user.update({
      where: { id },
      data: { wallet: { increment: amount } },
    });
  },

  async getWallet(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { wallet: true },
    });
    return user?.wallet ?? null;
  },
};

module.exports = UserModel;
