const NETWORKS = {
  MTN: ["0703", "0706", "0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916"],
  Airtel: ["0701", "0708", "0802", "0808", "0812", "0902", "0907", "0908", "0912"],
  Glo: ["0705", "0805", "0807", "0811", "0815", "0905", "0915"],
  "9mobile": ["0809", "0817", "0818", "0909", "0908"],
};

export function detectNetwork(phone) {
  if (!phone || phone.length < 4) return null;
  const prefix = phone.slice(0, 4);
  for (const [network, prefixes] of Object.entries(NETWORKS)) {
    if (prefixes.includes(prefix)) return network;
  }
  return null;
}
