const { PrismaClient } = require("@prisma/client");

// Singleton pattern — prevents multiple Prisma instances during hot-reload in dev
const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

module.exports = prisma;
