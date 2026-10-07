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

// Detect Paystack "Customer not found" — happens when the stored customer code
// is stale/foreign (e.g. came from another platform's Paystack account dump).
function isCustomerNotFound(err) {
  const data = err?.response?.data;
  if (data?.code === "customer_not_found") return true;
  return /customer not found/i.test(String(data?.message || err?.message || ""));
}

// Paystack refuses to create dedicated accounts when the customer record has
// no phone number ("Customer phone number is required", code missing_params).
function isCustomerPhoneMissing(err) {
  const data = err?.response?.data;
  if (data?.code === "missing_params" && /phone/i.test(String(data?.message || ""))) return true;
  return /phone number is required/i.test(String(data?.message || err?.message || ""));
}

// Same process as registration: the customer must carry the user's phone before
// DVA creation. Sync it whenever it's missing on the Paystack customer record.
async function syncCustomerPhone({ userId, email, phone }) {
  if (!phone) return;
  try {
    const customer = await getCustomerByEmail(email);
    if (!customer || customer.phone) return;
    await paystackRequest("PUT", `/customer/${customer.id}`, { phone });
    console.log(
      `[Paystack] Synced missing phone on customer ${customer.customer_code} for user ${userId}`
    );
  } catch (err) {
    console.error(
      "[Paystack] Failed to sync customer phone:",
      err?.response?.data || err.message
    );
  }
}

// Self-heal: discard the stale/foreign customer code, recreate the customer
// under THIS Paystack account, and return the new valid code.
async function healCustomer({ userId, email, firstname, lastname, phone }) {
  let customer;
  try {
    customer = await createCustomer({
      email,
      firstName: firstname,
      lastName: lastname,
      phone: phone || "",
    });
  } catch (err) {
    // A customer with this email may already exist under our Paystack account
    // (e.g. created earlier without a phone) — reuse it instead of failing.
    const existing = await getCustomerByEmail(email);
    if (!existing) throw err;
    customer = existing;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { paystackCustomerCode: customer.customer_code },
  });
  console.log(
    `[Paystack] Healed stale customer code for user ${userId} -> ${customer.customer_code}`
  );
  return customer.customer_code;
}

async function ensureAllAccounts({ userId, firstname, lastname, phone, email }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    if (user.paystackCustomerCode && user.paystackWemaAccount && user.paystackTitanAccount) return;

    // Throttle retries (15s per user) so background checks (getMe, virtual-accounts
    // polling) can recover automatically without hammering Paystack or racing
    // duplicate runs when multiple endpoints fire at once.
    if (user.paystackCustomerCode && !user.paystackWemaAccount && !user.paystackTitanAccount) {
      const retryAt = (global.__paystackDvaRetry = global.__paystackDvaRetry || {});
      const last = retryAt[userId] || 0;
      if (Date.now() - last < 15 * 1000) return;
      retryAt[userId] = Date.now();
    }

    let customerCode = user.paystackCustomerCode;

    if (!customerCode) {
      const customer = await createCustomer({
        email,
        firstName: firstname,
        lastName: lastname,
        phone: phone || "",
      });
      customerCode = customer.customer_code;
      await prisma.user.update({
        where: { id: userId },
        data: { paystackCustomerCode: customerCode },
      });
    }

    // Before creating any missing DVAs, make sure the customer carries the
    // user's phone (Paystack requires it) — same as what happens on registration.
    await syncCustomerPhone({ userId, email, phone });

    if (!user.paystackWemaAccount) {
      try {
        let dva;
        try {
          dva = await createDva(customerCode, "wema-bank");
        } catch (err) {
          if (isCustomerNotFound(err)) {
            customerCode = await healCustomer({ userId, email, firstname, lastname, phone });
          } else if (isCustomerPhoneMissing(err)) {
            await syncCustomerPhone({ userId, email, phone });
          } else {
            throw err;
          }
          dva = await createDva(customerCode, "wema-bank");
        }
        await prisma.user.update({
          where: { id: userId },
          data: { paystackWemaAccount: dva.account_number },
        });
      } catch (err) {
        console.error(
          "[Paystack] Failed to create Wema DVA:",
          err?.response?.data || err.message
        );
      }
    }

    if (!user.paystackTitanAccount) {
      try {
        let dva;
        try {
          dva = await createDva(customerCode, "titan-paystack");
        } catch (err) {
          if (isCustomerNotFound(err)) {
            customerCode = await healCustomer({ userId, email, firstname, lastname, phone });
          } else if (isCustomerPhoneMissing(err)) {
            await syncCustomerPhone({ userId, email, phone });
          } else {
            throw err;
          }
          dva = await createDva(customerCode, "titan-paystack");
        }
        await prisma.user.update({
          where: { id: userId },
          data: { paystackTitanAccount: dva.account_number },
        });
      } catch (err) {
        console.error(
          "[Paystack] Failed to create Titan DVA:",
          err?.response?.data || err.message
        );
      }
    }
  } catch (err) {
    console.error(
      "[Paystack] ensureAllAccounts error:",
      err?.response?.data || err.message
    );
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
