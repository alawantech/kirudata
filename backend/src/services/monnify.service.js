/**
 * Monnify Reserved Account Service
 * Docs: https://developers.monnify.com/docs/reserved-account
 *
 * All credentials come from ApiConfig rows:
 *   MONNIFY_API_KEY    — your API key
 *   MONNIFY_SECRET_KEY — your secret key
 *   MONNIFY_CONTRACT   — contract code
 *   MONNIFY_BASE_URL   — https://api.monnify.com  (or sandbox)
 */

const axios = require("axios");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { decrypt } = require("../utils/crypto");

// ---------------------------------------------------------------------------
// Get Monnify credentials from DB
// ---------------------------------------------------------------------------
async function getMonnifyConfig() {
  const rows = await prisma.apiConfig.findMany({
    where: {
      name: {
        in: [
          "monnifyApiKey",
          "monnifySecretKey",
          "monnifyContractCode",
          "monnifyBaseUrl",
          "monnifyContractCodePro",
          "monnifyContractCodeSandbox",
        ],
      },
    },
  });
  const cfg = {};
  for (const r of rows) cfg[r.name] = decrypt(r.value);

  const baseUrl = (cfg.monnifyBaseUrl || "https://api.monnify.com").replace(
    /\/$/,
    "",
  );

  // Auto-select contract code based on URL if specific ones are provided
  let contractCode = cfg.monnifyContractCode;
  if (baseUrl.includes("sandbox")) {
    contractCode = cfg.monnifyContractCodeSandbox || contractCode;
  } else {
    contractCode = cfg.monnifyContractCodePro || contractCode;
  }

  return {
    apiKey: cfg.monnifyApiKey || "",
    secretKey: cfg.monnifySecretKey || "",
    contractCode: contractCode || "",
    baseUrl,
  };
}

// ---------------------------------------------------------------------------
// Get a short-lived Monnify bearer token
// ---------------------------------------------------------------------------
async function getMonnifyToken(cfg) {
  const credentials = Buffer.from(`${cfg.apiKey}:${cfg.secretKey}`).toString(
    "base64",
  );
  try {
    const res = await axios.post(
      `${cfg.baseUrl}/api/v1/auth/login`,
      {},
      {
        headers: { Authorization: `Basic ${credentials}` },
        timeout: 15000,
      },
    );

    if (!res.data.requestSuccessful || !res.data.responseBody?.accessToken) {
      console.error(
        "[Monnify Auth] Failed Details:",
        JSON.stringify(res.data),
      );
      throw new Error("Failed to authenticate with Monnify");
    }

    return res.data.responseBody.accessToken;
  } catch (error) {
    console.error("[Monnify Auth] Error:", error.response?.data || error.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Create a reserved (dedicated) virtual account for a user
// Returns { accountNumber, bankName, accountReference } or throws
// ---------------------------------------------------------------------------
async function createReservedAccount({ userId, firstname, lastname, email, bvn, nin }) {
  const cfg = await getMonnifyConfig();
  if (!cfg.apiKey || !cfg.secretKey || !cfg.contractCode) {
    throw new Error("Monnify credentials not configured in admin API configs.");
  }

  const token = await getMonnifyToken(cfg);

  // Get site name for the account name suffix
  const settings = await prisma.siteSetting.findFirst({
    select: { sitename: true },
  });
  const siteName = settings?.sitename || "KIRU DATA";

  // accountReference must be unique — use userId + timestamp
  const accountReference = `ZDR-USER-${userId}-${Date.now()}`;
  const fullName = `${firstname} ${lastname}`.substring(0, 40);
  const accountName = firstname;

  const payload = {
    accountReference,
    accountName,
    currencyCode: "NGN",
    contractCode: cfg.contractCode,
    customerEmail: email,
    customerName: fullName,
    getAllAvailableBanks: false,
    preferredBanks: ["035", "232", "50515"],
  };

  // Add BVN or NIN if provided (required by CBN/Monnify for production)
  if (bvn) payload.customerBvn = bvn;
  if (nin) payload.customerNin = nin;

  console.log("[Monnify] Creating reserved account for user:", userId, email);
  try {
    const res = await axios.post(
      `${cfg.baseUrl}/api/v2/bank-transfer/reserved-accounts`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    if (!res.data.requestSuccessful) {
      console.error(
        "[Monnify] Reserved account creation failed:",
        res.data.responseMessage || "Unknown error",
        JSON.stringify(res.data),
      );
      throw new Error(res.data.responseMessage || "Monnify API error");
    }

    const body = res.data.responseBody;
    console.log("[Monnify] Full Response Body:", JSON.stringify(body));
    const accounts = body.accounts || [];

    if (accounts.length === 0) {
      console.warn(`[Monnify] No accounts returned for user ${userId}`);
    }

    // Persist to monnify_accounts table
    await prisma.monnifyAccount.create({
      data: {
        accountReference,
        email: email || "",
      },
    });

    // Persist reference fields on user
    // Map bank accounts by code (035=Wema, 232=Sterling, 50515=Moniepoint, etc.)
    const wema = accounts.find((a) => a.bankCode === "035");
    const sterling = accounts.find((a) => a.bankCode === "232");

    await prisma.user.update({
      where: { id: userId },
      data: {
        accountReference,
        ...(wema && { wemaBankRef: wema.accountNumber }),
        ...(sterling && { sterlingBankRef: sterling.accountNumber }),
      },
    });

    return {
      accountReference,
      accountName,
      accounts,
    };
  } catch (err) {
    const errorMessage = err.response?.data?.responseMessage || "";
    if (err.response?.data) {
      console.error("[Monnify] API Error Response:", JSON.stringify(err.response.data));
    } else {
      console.error("[Monnify] Axios Error:", err.message);
    }

    const needsBvnOrNin = /bvn or nin is required/i.test(errorMessage);
    if (needsBvnOrNin && (bvn || nin)) {
      const altPayload = {
        ...payload,
        ...(bvn ? { bvn } : {}),
        ...(nin ? { nin } : {}),
      };
      const retry = await axios.post(
        `${cfg.baseUrl}/api/v2/bank-transfer/reserved-accounts`,
        altPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        },
      );

      if (!retry.data.requestSuccessful) {
        console.error(
          "[Monnify] Reserved account retry failed:",
          retry.data.responseMessage || "Unknown error",
          JSON.stringify(retry.data),
        );
        throw new Error(retry.data.responseMessage || "Monnify API error");
      }

      const body = retry.data.responseBody;
      console.log("[Monnify] Full Response Body:", JSON.stringify(body));
      const accounts = body.accounts || [];

      if (accounts.length === 0) {
        console.warn(`[Monnify] No accounts returned for user ${userId}`);
      }

      await prisma.monnifyAccount.create({
        data: {
          accountReference: body.accountReference || payload.accountReference,
          email: email || "",
        },
      });

      const wema = accounts.find((a) => a.bankCode === "035");
      const sterling = accounts.find((a) => a.bankCode === "232");

      await prisma.user.update({
        where: { id: userId },
        data: {
          accountReference: body.accountReference || payload.accountReference,
          ...(wema && { wemaBankRef: wema.accountNumber }),
          ...(sterling && { sterlingBankRef: sterling.accountNumber }),
        },
      });

      return {
        accountReference: body.accountReference || payload.accountReference,
        accountName: body.accountName || payload.accountName,
        accounts,
      };
    }

    throw err;
  }
}

// ---------------------------------------------------------------------------
// Verify Monnify webhook HMAC signature
// header: monnify-signature  (SHA512 HMAC of raw body)
// ---------------------------------------------------------------------------
function verifyWebhookSignature(rawBody, signature, secretKey) {
  if (!signature || !secretKey) return false;
  const computed = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(signature, "hex"),
  );
}

// ---------------------------------------------------------------------------
// Get existing reserved account info from Monnify API
// ---------------------------------------------------------------------------
async function getReservedAccount(accountReference) {
  const cfg = await getMonnifyConfig();
  if (!cfg.apiKey) return null;
  const token = await getMonnifyToken(cfg);
  const res = await axios.get(
    `${cfg.baseUrl}/api/v2/bank-transfer/reserved-accounts/${accountReference}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    },
  );
  return res.data.responseBody;
}

/**
 * Validates BVN or NIN with Monnify VAS API
 * @param {string} bvnOrNin
 * @param {string} dob - Expected format "DD-MMM-YYYY" or "YYYY-MM-DD"
 * @param {string} type - "BVN" or "NIN"
 * @param {object} details
 * @param {string} details.name
 * @param {string} [details.phone]
 */
async function validateIdentity(bvnOrNin, dob, type = "BVN", details = {}) {
  const cfg = await getMonnifyConfig();
  const token = await getMonnifyToken(cfg);

  const formatDob = (value) => {
    if (!value) return value;
    if (/[A-Za-z]{3}/.test(value)) return value;
    if (value.includes("-") && value.split("-")[0].length === 4) {
      const [y, m, d] = value.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[Number(m) - 1];
      return monthName ? `${d}-${monthName}-${y}` : value;
    }
    return value;
  };

  const formattedDob = formatDob(dob);
  const cleanName = (details.name || "").trim();

  const endpoint = type === "BVN"
    ? "/api/v1/vas/bvn-details-match"
    : "/api/v1/vas/nin-verification";

  const payload = { dateOfBirth: formattedDob, name: cleanName };
  if (type === "BVN") {
    payload.bvn = bvnOrNin;
    if (details.phone) payload.mobileNo = details.phone;
  } else {
    payload.nin = bvnOrNin;
  }

  const fullUrl = `${cfg.baseUrl}${endpoint}`;
  console.log(`[Monnify ${type} Validate] Calling URL: ${fullUrl}`);

  try {
    const res = await axios.post(
      fullUrl,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      }
    );
    
    const responseBody = res.data.responseBody || {};
    const matchFlag = type === "BVN"
      ? responseBody.bvnInformationMatch
      : responseBody.ninInformationMatch;

    // Monnify returns user details if valid
    return {
      success: Boolean(res.data.requestSuccessful && matchFlag !== false),
      data: responseBody,
      msg: res.data.responseMessage
    };
  } catch (err) {
    console.error(`[Monnify ${type} Validate] Error:`, err.response?.data || err.message);
    return {
      success: false,
      msg: err.response?.data?.responseMessage || "Identity verification failed"
    };
  }
}


// ---------------------------------------------------------------------------
// Add missing linked accounts to an existing customer's reserved account
// ---------------------------------------------------------------------------
async function addLinkedAccounts(accountReference) {
  const cfg = await getMonnifyConfig();
  if (!cfg.apiKey || !cfg.secretKey) {
    throw new Error("Monnify credentials not configured.");
  }
  const token = await getMonnifyToken(cfg);

  const payload = {
    getAllAvailableBanks: false,
    preferredBanks: ["035", "232", "50515"], // Wema, Sterling, Moniepoint
  };

  console.log("[Monnify] Adding linked accounts for reference:", accountReference);
  try {
    const res = await axios.put(
      `${cfg.baseUrl}/api/v1/bank-transfer/reserved-accounts/add-linked-accounts/${accountReference}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    if (!res.data.requestSuccessful) {
      console.error(
        "[Monnify] Add linked accounts failed:",
        res.data.responseMessage || "Unknown error",
        JSON.stringify(res.data),
      );
      throw new Error(res.data.responseMessage || "Monnify API error");
    }

    return res.data.responseBody;
  } catch (err) {
    if (err.response?.data) {
      console.error("[Monnify Add Linked] API Error Response:", JSON.stringify(err.response.data));
    } else {
      console.error("[Monnify Add Linked] Axios Error:", err.message);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Update a reserved account's name on Monnify
// ---------------------------------------------------------------------------
async function updateReservedAccountName(accountReference, newAccountName) {
  const cfg = await getMonnifyConfig();
  if (!cfg.apiKey || !cfg.secretKey) {
    throw new Error("Monnify credentials not configured.");
  }
  const token = await getMonnifyToken(cfg);

  const payload = {
    accountName: newAccountName,
  };

  console.log(`[Monnify] Updating reserved account name for ${accountReference} to: ${newAccountName}`);
  try {
    const res = await axios.put(
      `${cfg.baseUrl}/api/v1/bank-transfer/reserved-accounts/update-customer-name/${accountReference}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    if (!res.data.requestSuccessful) {
      console.error(
        "[Monnify] Update account name failed:",
        res.data.responseMessage || "Unknown error",
        JSON.stringify(res.data),
      );
      throw new Error(res.data.responseMessage || "Monnify API error");
    }

    return res.data.responseBody;
  } catch (err) {
    if (err.response?.data) {
      console.error("[Monnify Update Name] API Error Response:", JSON.stringify(err.response.data));
    } else {
      console.error("[Monnify Update Name] Axios Error:", err.message);
    }
    throw err;
  }
}

module.exports = {
  getMonnifyConfig,
  createReservedAccount,
  verifyWebhookSignature,
  getReservedAccount,
  validateIdentity,
  addLinkedAccounts,
  updateReservedAccountName,
};
