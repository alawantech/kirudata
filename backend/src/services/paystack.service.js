const prisma = require("../config/prisma");
const axios = require("axios");
const { decrypt } = require("../utils/crypto");

const PAYSTACK_API = "https://api.paystack.co";

async function getPaystackSecretKey() {
  const config = await prisma.apiConfig.findUnique({
    where: { name: "paystack_secret_key" },
  });
  if (!config) return null;
  return decrypt(config.value || "");
}

async function getPaystackPublicKey() {
  const config = await prisma.apiConfig.findUnique({
    where: { name: "paystack_public_key" },
  });
  if (!config) return null;
  return decrypt(config.value || "");
}

async function paystackRequest(method, path, data) {
  const secretKey = await getPaystackSecretKey();
  if (!secretKey) throw new Error("Paystack not configured");

  const res = await axios({
    method,
    url: `${PAYSTACK_API}${path}`,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    data,
  });
  return res.data;
}

async function createCustomer({ email, firstName, lastName, phone }) {
  const res = await paystackRequest("POST", "/customer", {
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
  });
  return res.data;
}

async function createDva(customerCode, preferredBank) {
  const res = await paystackRequest("POST", "/dedicated_account", {
    customer: customerCode,
    preferred_bank: preferredBank,
  });
  return res.data;
}

async function getCustomerDvas(customerId) {
  const res = await paystackRequest("GET", `/dedicated_account?customer=${customerId}`);
  return res.data;
}

async function getCustomerByEmail(email) {
  const res = await paystackRequest("GET", `/customer?email=${encodeURIComponent(email)}`);
  const customers = res.data;
  return customers.length > 0 ? customers[0] : null;
}

async function ensureAllAccounts({ userId, firstname, lastname, phone, email }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    if (user.paystackCustomerCode && user.paystackWemaAccount && user.paystackTitanAccount) return;

    // If customer already exists but DVA creation failed previously, don't retry endlessly
    if (user.paystackCustomerCode && !user.paystackWemaAccount && !user.paystackTitanAccount) {
      return;
    }

    let customerCode = user.paystackCustomerCode;
    let paystackCustomerId = null;

    if (!customerCode) {
      const customer = await createCustomer({
        email,
        firstName: firstname,
        lastName: lastname,
        phone: phone || "",
      });
      customerCode = customer.customer_code;
      paystackCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { paystackCustomerCode: customerCode },
      });
    }

    if (!user.paystackWemaAccount) {
      try {
        const dva = await createDva(customerCode, "wema-bank");
        await prisma.user.update({
          where: { id: userId },
          data: { paystackWemaAccount: dva.account_number },
        });
      } catch (err) {
        console.error("[Paystack] Failed to create Wema DVA:", err.message);
      }
    }

    if (!user.paystackTitanAccount) {
      try {
        const dva = await createDva(customerCode, "titan-paystack");
        await prisma.user.update({
          where: { id: userId },
          data: { paystackTitanAccount: dva.account_number },
        });
      } catch (err) {
        console.error("[Paystack] Failed to create Titan DVA:", err.message);
      }
    }
  } catch (err) {
    console.error("[Paystack] ensureAllAccounts error:", err.message);
  }
}

async function initializeTransaction({ email, amount, reference, metadata, callbackUrl }) {
  const res = await paystackRequest("POST", "/transaction/initialize", {
    email,
    amount: Math.round(amount * 100), // Paystack expects kobo
    reference,
    metadata: metadata || {},
    callback_url: callbackUrl,
  });
  return res.data;
}

async function verifyTransaction(reference) {
  const res = await paystackRequest("GET", `/transaction/verify/${reference}`);
  return res.data;
}

module.exports = {
  getPaystackSecretKey,
  getPaystackPublicKey,
  paystackRequest,
  createCustomer,
  createDva,
  getCustomerDvas,
  getCustomerByEmail,
  ensureAllAccounts,
  initializeTransaction,
  verifyTransaction,
};
