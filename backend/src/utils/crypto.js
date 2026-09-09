/**
 * AES-256-GCM encryption/decryption for sensitive config values stored in DB.
 * The master key lives only in .env as ENCRYPTION_KEY (64 hex chars = 32 bytes).
 *
 * Encrypted format stored in DB:
 *   enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 * Plain values (no "enc:" prefix) are returned as-is so existing unencrypted
 * rows still work until the migration script encrypts them.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const ENC_PREFIX = "enc:";

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set in .env as 64 hex characters (32 bytes).",
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plain-text value.
 * Returns a string with prefix "enc:<iv>:<authTag>:<ciphertext>" — safe to store in DB.
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a value produced by encrypt().
 * If the value does not start with "enc:" it is returned as-is (backward compat).
 */
function decrypt(value) {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;
  try {
    const key = getKey();
    const parts = value.slice(ENC_PREFIX.length).split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted value format.");
    const [ivHex, authTagHex, ctHex] = parts;
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ctHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption failed for value:", value);
    return ""; // Fallback gracefully if key changed or data corrupted
  }
}

/**
 * Returns true if the value is already encrypted.
 */
function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

module.exports = { encrypt, decrypt, isEncrypted };
