const axios = require("axios");
const prisma = require("../config/prisma");
const { decrypt, isEncrypted } = require("../utils/crypto");

// ---------------------------------------------------------
// Get all API configs from DB as a key-value map (decrypted)
// ---------------------------------------------------------
async function getApiConfigs() {
  const configs = await prisma.apiConfig.findMany();
  const map = {};
  for (const c of configs) {
    try {
      map[c.name] = decrypt(c.value);
    } catch {
      map[c.name] = ""; // Decryption failed (key mismatch) — treat as empty
    }
  }
  return map;
}

// ---------------------------------------------------------
// Get network details
// ---------------------------------------------------------
async function getNetworkDetails(networkId) {
  return prisma.network.findUnique({ where: { id: parseInt(networkId) } });
}

// ---------------------------------------------------------
// Get airtime discount rates for a network + type
// ---------------------------------------------------------
async function getAirtimeDiscount(networkId, airtimeType) {
  return prisma.airtimeDiscount.findFirst({
    where: { networkId: parseInt(networkId), type: airtimeType },
  });
}

// ---------------------------------------------------------
// Get data plan with its network included
// ---------------------------------------------------------
async function getDataPlan(planId, source) {
  if (source === "provider") {
    return prisma.providerDataPlan.findUnique({
      where: { id: parseInt(planId) },
      include: { network: true, provider: true },
    });
  }
  return prisma.dataPlan.findUnique({
    where: { id: parseInt(planId) },
    include: { network: true },
  });
}

// ---------------------------------------------------------
// Get site settings
// ---------------------------------------------------------
async function getSiteSettings() {
  return prisma.siteSetting.findFirst({ where: { id: 1 } });
}

// ---------------------------------------------------------
// Check if phone is blacklisted
// ---------------------------------------------------------
async function isBlacklisted(phone) {
  const entry = await prisma.blacklist.findUnique({
    where: { phone },
    select: { id: true },
  });
  return !!entry;
}

// ---------------------------------------------------------
// Extract actual API error message from error detail
// ---------------------------------------------------------
function extractApiError(errDetail) {
  if (!errDetail) return null;
  try {
    const parsed = JSON.parse(errDetail);
    return parsed.message || parsed.msg || parsed.error || parsed.detail || null;
  } catch {
    if (errDetail.startsWith("Request failed with status code")) return null;
    if (errDetail.includes("ECONNREFUSED")) return null;
    if (errDetail.includes("ENOTFOUND")) return null;
    if (errDetail.includes("timeout")) return "Request timed out. Please try again.";
    return errDetail.length < 200 ? errDetail : null;
  }
}

// ---------------------------------------------------------
// Detect auth type from legacy provider URL (backward compat)
// ---------------------------------------------------------
function detectAuthType(host) {
  if (!host) return "token";
  if (host.includes("mysubwallet.ng")) return "subwallet";
  if (host.includes("vtpass")) return "vtpass";
  if (host.includes("mbcdata.com")) return "token";
  if (host.includes("dorosub.com")) return "token";
  return "basic";
}

// ---------------------------------------------------------
// Get active provider for a service key (new provider system)
// Returns { provider, service } or null
// ---------------------------------------------------------
async function getActiveProviderForService(serviceKey) {
  const service = await prisma.providerService.findFirst({
    where: { serviceKey, isActive: true },
    include: { provider: true },
  });
  if (!service) return null;
  return { provider: service.provider, service };
}

// ---------------------------------------------------------
// Get provider-specific plan code override (new provider system)
// ---------------------------------------------------------
async function getProviderPlanCode(providerServiceId, planId) {
  return prisma.providerPlanCode.findUnique({
    where: {
      providerServiceId_planId: { providerServiceId, planId: parseInt(planId) },
    },
  });
}

// ---------------------------------------------------------
// Purchase Airtime — routes to correct provider
// ---------------------------------------------------------
async function purchaseAirtime({
  network,
  amount,
  phone,
  ref,
  airtimeType,
  apiConfigs,
}) {
  const networkName = network.name.toLowerCase(); // "mtn", "glo", etc.
  const serviceKey = `${networkName}_${airtimeType === "VTU" ? "vtu" : "sharesell"}`;

  let host, apiKey, apiSecret, authType, networkId;

  // ── 1. Try admin configs page first (admin-managed) ────
  const typeSuffix = airtimeType === "VTU" ? "Vtu" : "Sharesell";
  host = apiConfigs[`${networkName}${typeSuffix}Provider`];
  apiKey = apiConfigs[`${networkName}${typeSuffix}Key`];

  if (host && apiKey) {
    apiSecret = "";
    networkId = airtimeType === "VTU" ? network.vtuId : network.sharesellId;
    authType = detectAuthType(host);
  } else {
    // ── 2. Fall back to new provider system ──────────────
    const activeProvider = await getActiveProviderForService(serviceKey);
    if (activeProvider) {
      host = activeProvider.service.serviceUrl || activeProvider.provider.baseUrl;
      apiKey = isEncrypted(activeProvider.provider.apiKey) ? decrypt(activeProvider.provider.apiKey) : activeProvider.provider.apiKey;
      apiSecret = activeProvider.provider.apiSecret;
      authType = activeProvider.provider.authType;
      networkId =
        activeProvider.service.networkCode ||
        (airtimeType === "VTU" ? network.vtuId : network.sharesellId);
    }
  }

  if (!host || !apiKey) {
    return {
      status: "fail",
      msg: "Service not configured. Please contact admin.",
    };
  }

  if (authType === "direct_token") {
    return purchaseAirtimeDirectToken({
      host,
      apiKey,
      networkId,
      amount,
      phone,
      ref,
      airtimeType,
    });
  }
  if (authType === "basic") {
    const userUrl = host
      .replace(/\/api\/topup\/?$/, "/api/user/")
      .replace(/\/api\/airtime\/?$/, "/api/user/")
      .replace(/\/airtime\/?$/, "/user/");
    return purchaseAirtimeBasicAuth({
      host,
      userUrl,
      apiKey,
      networkId,
      amount,
      phone,
      ref,
      airtimeType,
    });
  }
  if (authType === "subwallet") {
    const userUrl = host.replace(/\/api\/topup\/?$/, "/api/user");
    return purchaseAirtimeSubWallet({
      host,
      userUrl,
      apiKey,
      networkId: networkId || network.networkCode || network.name,
      amount,
      phone,
      ref,
      airtimeType,
    });
  }
  if (authType === "vtpass") {
    return purchaseAirtimeVTPass({
      host,
      apiKey,
      networkId,
      amount,
      phone,
      ref,
      networkName,
    });
  }
  return purchaseAirtimeToken({
    host,
    apiKey,
    networkId,
    amount,
    phone,
    ref,
    airtimeType,
  });
}

async function purchaseAirtimeDirectToken({
  host,
  apiKey,
  networkId,
  amount,
  phone,
  ref,
  airtimeType,
}) {
  const body = {
    network: parseInt(networkId) || networkId,
    amount,
    phone,
    bypass: false,
    "request-id": ref,
    plan_type: airtimeType,
  };
  try {
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseAirtimeDirectToken error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

async function purchaseAirtimeToken({
  host,
  apiKey,
  networkId,
  amount,
  phone,
  ref,
  airtimeType,
}) {
  const body = {
    network: parseInt(networkId),
    phone,
    plan_type: airtimeType || "VTU",
    amount: parseFloat(amount),
    bypass: false,
    "request-id": ref,
  };
  try {
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseAirtimeToken error:", errDetail);
    return {
      status: "fail",
      msg: "Unable to connect to service. Please try again.",
      apiResponseLog: errDetail,
    };
  }
}

async function purchaseAirtimeBasicAuth({
  host,
  userUrl,
  apiKey,
  networkId,
  amount,
  phone,
  ref,
  airtimeType,
}) {
  try {
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    const { data } = await axios.post(
      host,
      {
        network: parseInt(networkId) || networkId,
        amount,
        phone,
        bypass: true,
        "request-id": ref,
        plan_type: airtimeType,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${accessToken}`,
        },
        timeout: 30000,
      },
    );
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseAirtimeBasicAuth error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

async function purchaseAirtimeSubWallet({
  host,
  userUrl,
  apiKey,
  networkId,
  amount,
  phone,
  ref,
  airtimeType,
}) {
  // mySubwallet network IDs: MTN=1, Airtel=2, GLO=3, 9mobile=4
  const networkMap = {
    MTN: 1,
    mtn: 1,
    Airtel: 2,
    airtel: 2,
    AIRTEL: 2,
    GLO: 3,
    glo: 3,
    Glo: 3,
    "9mobile": 4,
    "9MOBILE": 4,
    Etisalat: 4,
    etisalat: 4,
  };
  const resolvedNetworkId = networkMap[networkId] || parseInt(networkId) || 1;

  const body = {
    network: resolvedNetworkId,
    phone,
    plan_type: airtimeType || "VTU",
    amount,
    bypass: false,
    "request-id": ref,
  };
  try {
    // Step 1: Exchange Basic credentials for AccessToken
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) {
      const errDetail = JSON.stringify(tokenData);
      console.error("[VTU] purchaseAirtimeSubWallet token error:", errDetail);
      return {
        status: "fail",
        msg: extractApiError(errDetail) || "Failed to get access token from provider.",
        apiResponseLog: errDetail,
      };
    }
    console.log(
      "[VTU] purchaseAirtimeSubWallet → POST",
      host,
      "network:",
      resolvedNetworkId,
      "amount:",
      amount,
    );
    // Step 2: Purchase airtime with AccessToken
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${accessToken}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseAirtimeSubWallet error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

async function purchaseAirtimeVTPass({
  host,
  apiKey,
  networkId,
  amount,
  phone,
  ref,
  networkName,
}) {
  const networkMap = {
    mtn: "mtn",
    airtel: "airtel",
    glo: "glo",
    "9mobile": "etisalat",
  };
  try {
    const credentials = Buffer.from(apiKey).toString("base64");
    const { data } = await axios.post(
      `${host}pay`,
      {
        request_id: ref,
        serviceID: networkMap[networkName] || networkName,
        amount,
        phone,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        timeout: 30000,
      },
    );
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseAirtimeVTPass error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

// ---------------------------------------------------------
// Purchase Data — routes to correct provider
// ---------------------------------------------------------
async function purchaseData({ plan, phone, ref, apiConfigs }) {
  const networkName = plan.network.name.toLowerCase();
  const typeKeyMap = {
    SME: "sme",
    SME2: "sme2",
    Gifting: "gifting",
    Corporate: "corporate",
    Coupon: "coupon",
    Awoof: "awoof",
  };
  const typeKey = typeKeyMap[plan.type] || "sme";
  const serviceKey = `${networkName}_${typeKey}`;

  let host, apiKey, apiSecret, authType, extNetworkId, planCode;

  // ── 1. Use plan's own provider credentials (checkbox-based system) ──
  if (plan.provider && plan.provider.apiUrl && plan.provider.apiKey) {
    const prov = plan.provider;
    host = prov.apiUrl;
    apiKey = isEncrypted(prov.apiKey) ? decrypt(prov.apiKey) : prov.apiKey;
    apiSecret = prov.apiSecret || "";
    authType = prov.authType || detectAuthType(host);
    const slug = prov.slug || "";
    let providerNetId = "";
    if (slug && plan.networkId) {
      const ps = await prisma.networkProviderSetting.findUnique({
        where: {
          networkId_providerSlug: {
            networkId: plan.networkId,
            providerSlug: slug,
          },
        },
      });
      if (ps) providerNetId = ps.extNetworkId || "";
    }
    extNetworkId =
      providerNetId || plan.networkCode || plan.network.networkCode;
    planCode = plan.planCode;
  } else {
    // ── 2. Fallback: admin configs page (legacy per-network+type) ────
    const typeSuffixMap = {
      SME: "Sme",
      SME2: "Sme2",
      Gifting: "Gifting",
      Corporate: "Corporate",
      Coupon: "Coupon",
      Awoof: "Awoof",
    };
    const typeSuffix = typeSuffixMap[plan.type] || "Sme";
    host = apiConfigs[`${networkName}${typeSuffix}Provider`];
    apiKey = apiConfigs[`${networkName}${typeSuffix}Api`];

    if (host && apiKey) {
      apiSecret = "";
      authType = detectAuthType(host);
      const legacyProviderSlug = apiConfigs[`${typeKey}DataProvider`] || "";
      let providerNetId = "";
      if (legacyProviderSlug && plan.networkId) {
        const ps = await prisma.networkProviderSetting.findUnique({
          where: {
            networkId_providerSlug: {
              networkId: plan.networkId,
              providerSlug: legacyProviderSlug,
            },
          },
        });
        if (ps) providerNetId = ps.extNetworkId || "";
      }
      extNetworkId =
        providerNetId || plan.networkCode || plan.network.networkCode;
      planCode = plan.planCode;
    } else {
      // ── 3. Fall back to ProviderService system ──────────────
      const activeProvider = await getActiveProviderForService(serviceKey);
      if (activeProvider) {
        host = activeProvider.service.serviceUrl || activeProvider.provider.baseUrl;
        apiKey = isEncrypted(activeProvider.provider.apiKey) ? decrypt(activeProvider.provider.apiKey) : activeProvider.provider.apiKey;
        apiSecret = activeProvider.provider.apiSecret;
        authType = activeProvider.provider.authType;
        extNetworkId =
          activeProvider.service.networkCode || plan.network.networkCode;
        const planCodeRecord = await getProviderPlanCode(
          activeProvider.service.id,
          plan.id,
        );
        planCode = planCodeRecord ? planCodeRecord.providerCode : plan.planCode;
      }
    }
  }

  if (!host || !apiKey) {
    return {
      status: "fail",
      msg: "Data service not configured. Please contact admin.",
    };
  }

  console.log("[VTU] purchaseData →", { host, authType, extNetworkId, planCode, phone });

  // Convert network name to integer if needed — ALL providers expect integer IDs
  const NETWORK_NAME_MAP = { mtn: 1, airtel: 2, glo: 3, "9mobile": 4, etisalat: 4 };
  const resolvedNetwork = NETWORK_NAME_MAP[String(extNetworkId).toLowerCase()] || parseInt(extNetworkId) || extNetworkId;

  const planObj = { ...plan, planCode }; // use resolved planCode

  if (authType === "basic" || authType === "direct_token") {
    const userUrl = host.replace(/\/api\/data\/?$/, "/api/user/");
    return purchaseDataBasicAuth({
      host,
      userUrl,
      apiKey,
      extNetworkId: resolvedNetwork,
      plan: planObj,
      phone,
      ref,
    });
  }
  if (authType === "subwallet") {
    const userUrl = host.replace(/\/api\/data\/?$/, "/api/user");
    return purchaseDataSubWallet({
      host,
      userUrl,
      apiKey,
      extNetworkId: resolvedNetwork,
      plan: planObj,
      phone,
      ref,
    });
  }
  return purchaseDataToken({
    host,
    apiKey,
    extNetworkId: resolvedNetwork,
    plan: planObj,
    phone,
    ref,
  });
}

async function purchaseDataDirectToken({
  host,
  apiKey,
  extNetworkId,
  plan,
  phone,
  ref,
}) {
  const body = {
    network: parseInt(extNetworkId) || extNetworkId,
    phone,
    bypass: false,
    "request-id": ref,
    data_plan: plan.planCode,
  };
  try {
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseDataDirectToken error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

async function purchaseDataToken({
  host,
  apiKey,
  extNetworkId,
  plan,
  phone,
  ref,
}) {
  const body = {
    network: parseInt(extNetworkId) || extNetworkId,
    phone,
    bypass: false,
    "request-id": ref,
    data_plan: plan.planCode,
  };
  try {
    console.log(
      "[VTU] purchaseDataToken → POST",
      host,
      "network:",
      extNetworkId,
      "plan:",
      plan.planCode,
    );
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseDataToken error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

async function purchaseDataBasicAuth({
  host,
  userUrl,
  apiKey,
  extNetworkId,
  plan,
  phone,
  ref,
}) {
  const body = {
    network: parseInt(extNetworkId) || extNetworkId,
    phone,
    bypass: true,
    "request-id": ref,
    data_plan: plan.planCode,
  };
  try {
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${accessToken}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseDataBasicAuth error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

// ---------------------------------------------------------
// Purchase Data — mySubwallet (2-step Basic auth, integer network ID)
// ---------------------------------------------------------
async function purchaseDataSubWallet({
  host,
  userUrl,
  apiKey,
  extNetworkId,
  plan,
  phone,
  ref,
}) {
  // mySubwallet network IDs: MTN=1, Airtel=2, GLO=3, 9mobile=4
  const networkMap = {
    MTN: 1,
    mtn: 1,
    Airtel: 2,
    airtel: 2,
    AIRTEL: 2,
    GLO: 3,
    glo: 3,
    Glo: 3,
    "9mobile": 4,
    "9MOBILE": 4,
    Etisalat: 4,
    etisalat: 4,
  };
  const networkId = networkMap[extNetworkId] ?? parseInt(extNetworkId) ?? 1;

  const body = {
    network: networkId,
    phone,
    data_plan: plan.planCode,
    bypass: false,
    "request-id": ref,
  };
  try {
    // Step 1: Exchange Basic credentials for AccessToken
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) {
      const errDetail = JSON.stringify(tokenData);
      console.error("[VTU] purchaseDataSubWallet token error:", errDetail);
      return {
        status: "fail",
        msg: extractApiError(errDetail) || "Failed to get access token from provider.",
        apiResponseLog: errDetail,
      };
    }
    console.log(
      "[VTU] purchaseDataSubWallet → POST",
      host,
      "network:",
      networkId,
      "plan:",
      plan.planCode,
    );
    // Step 2: Purchase data with AccessToken
    const { data } = await axios.post(host, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${accessToken}`,
      },
      timeout: 30000,
    });
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseDataSubWallet error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

// ---------------------------------------------------------
// Cable name → mySubwallet cable ID mapping (for verification)
// ---------------------------------------------------------
const CABLE_MAP = {
  "GOTV": 1,
  "DSTV": 2,
  "STARTIMES": 3,
};

// ---------------------------------------------------------
// Exam code → Dorosub integer ID mapping
// ---------------------------------------------------------
const EXAM_MAP = {
  "waec": 1,
  "neco": 2,
  "nabteb": 3,
};

// ---------------------------------------------------------
// Verify Cable IUC / Smart Card
// GET https://api.mysubwallet.ng/api/cable/cable-validation?iuc=...&cable=1
// ---------------------------------------------------------
async function verifyCableIUC({ iuc, provider, apiConfigs }) {
  let host, apiKey;
  const active = await getActiveProviderForService("cable_verification");
  if (active) {
    host = active.service.serviceUrl || active.provider.baseUrl;
    apiKey = active.provider.apiKey;
  } else {
    host = apiConfigs["cableVerificationProvider"];
    apiKey = apiConfigs["cableVerificationApi"];
  }
  if (!host || !apiKey)
    return { status: "fail", msg: "Cable verification not configured." };

  const cableId = CABLE_MAP[provider] || CABLE_MAP[provider.toUpperCase()];
  if (!cableId)
    return { status: "fail", msg: `Unknown cable provider: ${provider}` };

  const userUrl = host.replace(/\/api\/cable\/cable-validation\/?$/, "/api/user");
  try {
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) return { status: "fail", msg: "Cable verification auth failed." };

    const url = `${host}?iuc=${encodeURIComponent(iuc)}&cable=${cableId}`;
    const { data } = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${accessToken}`,
      },
      timeout: 15000,
    });
    return { status: "success", customer: data };
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] verifyCableIUC error:", errDetail);
    if (err.response?.data) {
      return { status: "fail", msg: err.response.data.message || "Unable to verify IUC." };
    }
    return {
      status: "fail",
      msg: "Unable to verify IUC. Please check the number.",
    };
  }
}

// ---------------------------------------------------------
// Purchase Cable TV
// ---------------------------------------------------------
async function purchaseCable({
  iuc,
  planCode,
  provider,
  phone,
  ref,
  apiConfigs,
}) {
  let host, apiKey;
  const active = await getActiveProviderForService("cable");
  if (active) {
    host = active.service.serviceUrl || active.provider.baseUrl;
    apiKey = active.provider.apiKey;
  } else {
    host = apiConfigs["cableProvider"];
    apiKey = apiConfigs["cableApi"];
  }
  if (!host || !apiKey)
    return { status: "fail", msg: "Cable service not configured." };

  const userUrl = host.replace(/\/api\/cable\/?$/, "/api/user");
  try {
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) {
      const errDetail = JSON.stringify(tokenData);
      return { status: "fail", msg: "Cable service auth failed.", apiResponseLog: errDetail };
    }
    const { data } = await axios.post(
      host,
      {
        cable: CABLE_MAP[provider] || CABLE_MAP[provider.toUpperCase()] || provider,
        cable_plan: planCode,
        iuc: iuc,
        bypass: false,
        "request-id": ref,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${accessToken}`,
        },
        timeout: 30000,
      },
    );
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseCable error:", errDetail);
    if (err.response?.data) {
      return {
        status: "fail",
        msg: err.response.data.message || "Cable purchase failed.",
        apiResponseLog: errDetail,
      };
    }
    return {
      status: "fail",
      msg: "Cable service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

// ---------------------------------------------------------
// Electricity disco code → mySubwallet integer ID mapping
// ---------------------------------------------------------
const DISCO_MAP = {
  "ikeja-electric": 1,
  "eko-electric": 2,
  "kano-electric": 3,
  "ph-electric": 4,
  "jos-electric": 5,
  "ibadan-electric": 6,
  "kaduna-electric": 7,
  "abuja-electric": 8,
};

// ---------------------------------------------------------
// Verify Electricity Meter
// GET https://api.mysubwallet.ng/api/bill/bill-validation?meter_number=...&disco=1&meter_type=prepaid
// ---------------------------------------------------------
async function verifyMeter({ meter, provider, meterType, apiConfigs }) {
  let host, apiKey;
  const active = await getActiveProviderForService("electricity_verification");
  if (active) {
    host = active.service.serviceUrl || active.provider.baseUrl;
    apiKey = active.provider.apiKey;
  } else {
    host = apiConfigs["meterVerificationProvider"];
    apiKey = apiConfigs["meterVerificationApi"];
  }
  if (!host || !apiKey)
    return { status: "fail", msg: "Electricity verification not configured." };

  const discoId = DISCO_MAP[provider];
  if (!discoId)
    return { status: "fail", msg: `Unknown electricity provider: ${provider}` };

  const userUrl = host.replace(/\/api\/bill\/bill-validation\/?$/, "/api/user");
  try {
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) return { status: "fail", msg: "Electricity verification auth failed." };

    const url = `${host}?meter_number=${encodeURIComponent(meter)}&disco=${discoId}&meter_type=${meterType}`;
    const { data } = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${accessToken}`,
      },
      timeout: 15000,
    });
    return { status: "success", customer: data };
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] verifyMeter error:", errDetail);
    if (err.response?.data) {
      return { status: "fail", msg: err.response.data.message || "Unable to verify meter number." };
    }
    return { status: "fail", msg: "Unable to verify meter number." };
  }
}

// ---------------------------------------------------------
// Purchase Electricity
// ---------------------------------------------------------
async function purchaseElectricity({
  meter,
  provider,
  amount,
  phone,
  meterType,
  ref,
  apiConfigs,
}) {
  let host, apiKey;
  const active = await getActiveProviderForService("electricity");
  if (active) {
    host = active.service.serviceUrl || active.provider.baseUrl;
    apiKey = active.provider.apiKey;
  } else {
    host = apiConfigs["meterProvider"];
    apiKey = apiConfigs["meterApi"];
  }
  if (!host || !apiKey)
    return { status: "fail", msg: "Electricity service not configured." };

  const discoId = DISCO_MAP[provider];
  if (!discoId)
    return { status: "fail", msg: `Unknown electricity provider: ${provider}` };

  const userUrl = host.replace(/\/api\/bill\/?$/, "/api/user");
  try {
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) {
      const errDetail = JSON.stringify(tokenData);
      return { status: "fail", msg: "Electricity service auth failed.", apiResponseLog: errDetail };
    }
    const { data } = await axios.post(
      host,
      {
        disco: discoId,
        meter_type: meterType,
        meter_number: meter,
        amount,
        bypass: false,
        "request-id": ref,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${accessToken}`,
        },
        timeout: 30000,
      },
    );
    return interpretApiResponse(data, JSON.stringify(data));
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseElectricity error:", errDetail);
    if (err.response?.data) {
      return {
        status: "fail",
        msg: err.response.data.message || "Electricity purchase failed.",
        apiResponseLog: errDetail,
      };
    }
    return {
      status: "fail",
      msg: "Electricity service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

// ---------------------------------------------------------
// Purchase Exam PIN
// ---------------------------------------------------------
async function purchaseExamPin({ provider, quantity, ref, apiConfigs }) {
  let host, apiKey;
  const active = await getActiveProviderForService("exam");
  if (active) {
    host = active.service.serviceUrl || active.provider.baseUrl;
    apiKey = active.provider.apiKey;
  } else {
    host = apiConfigs["examProvider"];
    apiKey = apiConfigs["examApi"];
  }
  if (!host || !apiKey)
    return { status: "fail", msg: "Exam service not configured." };
  try {
    const { data } = await axios.post(
      host,
      {
        exam: EXAM_MAP[provider] || EXAM_MAP[String(provider).toLowerCase()] || provider,
        quantity,
        "request-id": ref,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        timeout: 30000,
      },
    );
    const apiResult = interpretApiResponse(data, JSON.stringify(data));
    if (data?.pin) {
      apiResult.tokens = data.pin.split("\n").filter(Boolean).map((entry) => {
        const [pin, serial] = entry.split("<=>").map((s) => s?.trim());
        return { pin: pin || entry, serial: serial || "" };
      });
    }
    return apiResult;
  } catch (err) {
    const errDetail = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("[VTU] purchaseExamPin error:", errDetail);
    return {
      status: "fail",
      msg: extractApiError(errDetail) || "Service connection error.",
      apiResponseLog: errDetail,
    };
  }
}

// ---------------------------------------------------------
// Shared response interpreter
// ---------------------------------------------------------
function interpretApiResponse(data, rawLog) {
  const apiStatus = (data?.Status || data?.status || "").toLowerCase();
  const result = { apiResponseLog: rawLog };

  if (["successful", "success", "delivered"].includes(apiStatus)) {
    result.status = "success";
    if (data?.token) result.token = data.token;
  } else if (["processing", "process", "pending"].includes(apiStatus)) {
    result.status = "processing";
  } else if (["failed", "fail", "error"].includes(apiStatus)) {
    result.status = "fail";
    const msg =
      data?.msg || data?.error?.[0] || "Transaction failed. Please try again.";
    result.msg = /(balance|insufficient)/i.test(msg)
      ? "Unable to complete transaction. Please report to admin. (Error: BB)"
      : msg;
  } else {
    result.status = "fail";
    result.msg = "Transaction failed. Please try again.";
  }

  return result;
}

// ---------------------------------------------------------
// Send Bulk SMS via configured provider (Legitdataway etc.)
// ---------------------------------------------------------
async function sendBulkSms({ phone, message, senderName, ref, apiConfigs }) {
  const host = apiConfigs["bulkSmsProvider"];
  const apiKey = apiConfigs["bulkSmsApi"];
  if (!host || !apiKey) {
    return { status: "fail", msg: "Bulk SMS service not configured." };
  }

  let apiResponseLog = null;
  try {
    const { data } = await axios.post(
      host,
      {
        sender: senderName || "API",
        number: phone,
        message,
        "request-id": ref,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        timeout: 30000,
      },
    );
    apiResponseLog = JSON.stringify(data);
    return interpretApiResponse(data, apiResponseLog);
  } catch (err) {
    apiResponseLog = err?.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    return {
      status: "fail",
      msg: "SMS service connection error.",
      apiResponseLog,
    };
  }
}

// ---------------------------------------------------------
// Purchase Data Card (Legitdataway / GwarzoData)
// ---------------------------------------------------------
async function purchaseDataCard({
  networkId,
  planType,
  quantity,
  cardName,
  ref,
  apiConfigs,
}) {
  const host = apiConfigs["dataCardProvider"];
  const apiKey = apiConfigs["dataCardApi"];
  if (!host || !apiKey) {
    return { status: "fail", msg: "Data card service not configured." };
  }

  const userUrl = host.replace(/\/api\/data_card\/?$/, "/api/user");
  let apiResponseLog = null;
  try {
    // Step 1: Exchange Basic credentials for AccessToken
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) {
      apiResponseLog = JSON.stringify(tokenData);
      return { status: "fail", msg: "Data card service auth failed.", apiResponseLog };
    }
    // Step 2: Purchase with AccessToken
    const { data } = await axios.post(
      host,
      {
        network: networkId,
        plan_type: String(planType),
        quantity,
        card_name: cardName,
        "request-id": ref,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${accessToken}`,
        },
        timeout: 30000,
      },
    );
    apiResponseLog = JSON.stringify(data);

    if (data.status === "success" || data.status === "successful") {
      const rawSerials = data.serial
        ? String(data.serial)
            .split(",")
            .map((s) => s.trim())
        : [];
      const rawPins = data.pin
        ? String(data.pin)
            .split(",")
            .map((p) => p.trim())
        : [];
      const cards = rawSerials.map((serial, i) => ({
        serial,
        pin: rawPins[i] || "",
      }));
      return {
        status: "success",
        msg: data.message || "Data cards purchased successfully.",
        cards,
        loadPin: data.load_pin || null,
        checkBalance: data.check_balance || null,
        apiResponseLog,
      };
    }

    return {
      status: "fail",
      msg: data.message || "Data card purchase failed.",
      apiResponseLog,
    };
  } catch (err) {
    console.error("[VTU] purchaseDataCard error:", err?.response?.data || err.message);
    if (err.response?.data) {
      apiResponseLog = JSON.stringify(err.response.data);
      return {
        status: "fail",
        msg: err.response.data.message || "Data card purchase failed.",
        apiResponseLog,
      };
    }
    apiResponseLog = err.message;
    return {
      status: "fail",
      msg: "Data card service connection error.",
      apiResponseLog,
    };
  }
}

async function purchaseRechargeCard({
  networkId,
  planType,
  quantity,
  cardName,
  ref,
  apiConfigs,
}) {
  const host = apiConfigs["rechargeCardProvider"];
  const apiKey = apiConfigs["rechargeCardApi"];
  if (!host || !apiKey) {
    return { status: "fail", msg: "Recharge card service not configured." };
  }

  const userUrl = host.replace(/\/api\/recharge_card\/?$/, "/api/user");
  let apiResponseLog = null;
  try {
    // Step 1: Exchange Basic credentials for AccessToken
    const { data: tokenData } = await axios.post(userUrl, null, {
      headers: { Authorization: `Basic ${apiKey}` },
      timeout: 15000,
    });
    const accessToken = tokenData.AccessToken;
    if (!accessToken) {
      apiResponseLog = JSON.stringify(tokenData);
      return { status: "fail", msg: "Recharge card service auth failed.", apiResponseLog };
    }
    // Step 2: Purchase with AccessToken
    const { data } = await axios.post(
      host,
      {
        network: networkId,
        plan_type: String(planType),
        quantity,
        card_name: cardName,
        "request-id": ref,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${accessToken}`,
        },
        timeout: 30000,
      },
    );
    apiResponseLog = JSON.stringify(data);

    if (data.status === "success" || data.status === "successful") {
      const rawSerials = data.serial
        ? String(data.serial)
            .split(",")
            .map((s) => s.trim())
        : [];
      const rawPins = data.pin
        ? String(data.pin)
            .split(",")
            .map((p) => p.trim())
        : [];
      const cards = rawSerials.map((serial, i) => ({
        serial,
        pin: rawPins[i] || "",
      }));
      return {
        status: "success",
        msg: data.message || "Recharge cards purchased successfully.",
        cards,
        loadPin: data.load_pin || null,
        checkBalance: data.check_balance || null,
        apiResponseLog,
      };
    }

    return {
      status: "fail",
      msg: data.message || "Recharge card purchase failed.",
      apiResponseLog,
    };
  } catch (err) {
    console.error("[VTU] purchaseRechargeCard error:", err?.response?.data || err.message);
    if (err.response?.data) {
      apiResponseLog = JSON.stringify(err.response.data);
      return {
        status: "fail",
        msg: err.response.data.message || "Recharge card purchase failed.",
        apiResponseLog,
      };
    }
    apiResponseLog = err.message;
    return {
      status: "fail",
      msg: "Recharge card service connection error.",
      apiResponseLog,
    };
  }
}

module.exports = {
  getApiConfigs,
  getNetworkDetails,
  getAirtimeDiscount,
  getDataPlan,
  getSiteSettings,
  isBlacklisted,
  purchaseAirtime,
  purchaseData,
  verifyCableIUC,
  purchaseCable,
  verifyMeter,
  purchaseElectricity,
  purchaseExamPin,
  sendBulkSms,
  purchaseDataCard,
  purchaseRechargeCard,
  interpretApiResponse,
};
