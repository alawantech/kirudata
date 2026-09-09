/**
 * One-time migration: encrypt all existing plain-text api_configs values.
 *
 * Run once after adding ENCRYPTION_KEY to .env:
 *   node backend/scripts/encrypt-api-configs.js
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const { PrismaClient } = require("@prisma/client");
const { encrypt, isEncrypted } = require("../src/utils/crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching api_configs...");
  const configs = await prisma.apiConfig.findMany();

  let encrypted = 0;
  let skipped = 0;

  for (const config of configs) {
    if (!config.value) {
      skipped++;
      continue;
    }
    if (isEncrypted(config.value)) {
      console.log(`  SKIP (already encrypted): ${config.name}`);
      skipped++;
      continue;
    }
    const encryptedValue = encrypt(config.value);
    await prisma.apiConfig.update({
      where: { id: config.id },
      data: { value: encryptedValue },
    });
    console.log(`  ENCRYPTED: ${config.name}`);
    encrypted++;
  }

  console.log(`\nDone. Encrypted: ${encrypted}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
