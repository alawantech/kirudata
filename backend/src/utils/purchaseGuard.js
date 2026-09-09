const locks = new Map();
const blacklistCache = new Map();
const BLACKLIST_TTL = 60_000;

function withPurchaseLock(userId, fn) {
  if (locks.has(userId)) return locks.get(userId);
  const p = fn().finally(() => locks.delete(userId));
  locks.set(userId, p);
  return p;
}

async function isBlacklistedCached(phone) {
  const cached = blacklistCache.get(phone);
  if (cached !== undefined) return cached;
  const prisma = require("../config/prisma");
  const row = await prisma.blacklist.findFirst({ where: { phone } });
  const result = !!row;
  blacklistCache.set(phone, result);
  setTimeout(() => blacklistCache.delete(phone), BLACKLIST_TTL);
  return result;
}

module.exports = { withPurchaseLock, isBlacklistedCached };
