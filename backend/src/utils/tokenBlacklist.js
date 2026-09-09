/**
 * In-memory token blacklist.
 * Tokens are added on logout and auto-purged once their JWT expiry passes.
 * This is sufficient for short-lived tokens (30 min) — no DB migration needed.
 */

// Map<jti_or_token_hash, expiresAtMs>
const _blacklist = new Map();

// Purge expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, exp] of _blacklist.entries()) {
      if (now > exp) _blacklist.delete(key);
    }
  },
  5 * 60 * 1000,
);

/**
 * Add a token to the blacklist.
 * @param {string} token  — raw JWT string
 * @param {number} expMs  — token's exp as millisecond timestamp
 */
function blacklistToken(token, expMs) {
  _blacklist.set(token, expMs);
}

/**
 * Returns true if the token has been blacklisted (i.e. logged out).
 * @param {string} token
 */
function isBlacklisted(token) {
  return _blacklist.has(token);
}

module.exports = { blacklistToken, isBlacklisted };
