#!/usr/bin/env node
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("\n========================================");
  console.log("   CREATE SUPER ADMIN");
  console.log("========================================\n");

  const name = await ask("Full Name: ");
  const email = await ask("Email: ");
  const phone = await ask("Phone (optional): ");
  const password = await ask("Password (min 8 chars): ");

  if (password.length < 8) {
    console.error("\nPassword must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.error("\nAn admin with this email already exists.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: "super_admin",
      permissions: JSON.stringify([
        "admin_manage",
        "dashboard_view",
        "users_view",
        "users_edit",
        "users_credit",
        "users_debit",
        "users_reset_pin",
        "users_reset_password",
        "transactions_view",
        "transactions_edit",
        "notifications_manage",
        "issues_manage",
        "messages_manage",
        "networks_manage",
        "data_plans_manage",
        "provider_data_plans_manage",
        "data_card_plans_manage",
        "recharge_card_plans_manage",
        "cable_plans_manage",
        "electricity_manage",
        "exam_providers_manage",
        "airtime_discounts_manage",
        "airtime_to_cash_manage",
        "api_configs_manage",
        "api_links_manage",
        "settings_manage",
        "blacklist_manage",
        "upgrade_requests_manage",
        "kyc_manage",
      ]),
      status: 1,
    },
  });

  console.log(`\n========================================`);
  console.log(`   SUPER ADMIN CREATED!`);
  console.log(`========================================`);
  console.log(`   ID:    ${admin.id}`);
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  console.log(`========================================\n`);

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  rl.close();
  prisma.$disconnect();
  process.exit(1);
});
