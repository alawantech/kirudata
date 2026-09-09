async function generateDeviceFingerprint() {
  const components = [
    navigator.userAgent || "",
    navigator.language || "",
    screen.width + "x" + screen.height,
    screen.colorDepth + "",
    new Date().getTimezoneOffset() + "",
    navigator.hardwareConcurrency + "",
    navigator.platform || "",
  ];

  const str = components.join("|||");

  // Use SubtleCrypto to hash the fingerprint
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "fallback-" + Math.abs(hash).toString(36);
}

export default generateDeviceFingerprint;
