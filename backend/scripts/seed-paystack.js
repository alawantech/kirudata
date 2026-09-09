const prisma = require('../src/config/prisma');
const { encrypt } = require('../src/utils/crypto');

async function run() {
  const keys = [
    { name: 'paystack_secret_key', value: 'sk_live_REPLACED_IN_DB' },
    { name: 'paystack_public_key', value: 'pk_live_REPLACED_IN_DB' },
  ];

  for (const k of keys) {
    const existing = await prisma.apiConfig.findUnique({ where: { name: k.name } });
    if (existing) {
      await prisma.apiConfig.update({ where: { name: k.name }, data: { value: encrypt(k.value) } });
      console.log(`Updated: ${k.name}`);
    } else {
      await prisma.apiConfig.create({ data: { name: k.name, value: encrypt(k.value) } });
      console.log(`Created: ${k.name}`);
    }
  }
  console.log('Done');
}

run().catch((e) => { console.error(e); process.exit(1); });
