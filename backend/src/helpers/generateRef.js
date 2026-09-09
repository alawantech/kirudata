const { randomUUID } = require("crypto");

/**
 * Generate a unique transaction reference.
 * Format: ZDR-<timestamp>-<random8>
 */
function generateRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `ZDR-${ts}-${rand}`;
}

module.exports = { generateRef };
