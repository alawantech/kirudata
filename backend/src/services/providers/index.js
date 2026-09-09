const MBCDataProvider = require("./mbcdata");
const FirstSubProvider = require("./firstsub");
const DorosubProvider = require("./dorosub");
const MySubwalletProvider = require("./mysubwallet");
const GenericProvider = require("./generic");

// Provider Registry
// Maps provider hostnames/slugs to their custom implementations.
// When adding a new provider:
//   1. Create a new file in providers/ (e.g., newprovider.js)
//   2. Implement the standard interface: purchaseData, purchaseAirtime, etc.
//   3. Add a detection rule in getProvider() below

const PROVIDER_HOST_MAP = {
  // MBC Data
  "mbcdata.com": "mbcdata",
  "first-sub.com": "firstsub",
  "dorosub.com": "dorosub",

  // mySubwallet
  "mysubwallet.ng": "mysubwallet",
};

function detectProvider(host) {
  if (!host) return "generic";
  const hostLower = host.toLowerCase();
  for (const [pattern, provider] of Object.entries(PROVIDER_HOST_MAP)) {
    if (hostLower.includes(pattern)) return provider;
  }
  return "generic";
}

function getProvider(host, apiKey, authType) {
  const providerType = detectProvider(host);

  switch (providerType) {
    case "mbcdata":
      return new MBCDataProvider(apiKey, host || "https://mbcdata.com/api");
    case "mysubwallet":
      return new MySubwalletProvider(apiKey, host || "https://api.mysubwallet.ng/api");
    case "firstsub":
      return new FirstSubProvider(apiKey, host || "https://first-sub.com/api");
    case "dorosub":
      return new DorosubProvider(apiKey, host || "https://dorosub.com/api");
    default:
      return new GenericProvider(apiKey, authType || "direct_token");
  }
}

function detectAuthType(host) {
  if (!host) return "token";
  const hostLower = host.toLowerCase();

  const basicHosts = [
    "n3tdata247.com", "n3tdata.com", "bilalsadasub.com",
    "rabdata360.com", "nabatulu", "dorosub.com",
  ];
  const directTokenHosts = [
    "legitdataway.com", "kirudata.com",
  ];

  if (basicHosts.some((h) => hostLower.includes(h))) return "basic";
  if (directTokenHosts.some((h) => hostLower.includes(h))) return "direct_token";
  if (hostLower.includes("mysubwallet.ng")) return "subwallet";
  if (hostLower.includes("mbcdata.com")) return "direct_token";
  if (hostLower.includes("first-sub.com")) return "basic";
  if (hostLower.includes("dorosub.com")) return "basic";
  return "token";
}

module.exports = {
  getProvider,
  detectProvider,
  detectAuthType,
  MBCDataProvider,
  MySubwalletProvider,
  FirstSubProvider,
  DorosubProvider,
  GenericProvider,
};
