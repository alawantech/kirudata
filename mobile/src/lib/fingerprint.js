import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_FP_KEY = "device_fingerprint";

let cachedFingerprint = null;

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getDeviceFingerprint() {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_FP_KEY);
    if (stored) {
      cachedFingerprint = stored;
      return stored;
    }
  } catch {}

  const components = [
    Platform.OS,
    String(Platform.Version),
    "zedro-app",
  ];

  const str = components.join("|||");
  const fp = "mobile-" + simpleHash(str);

  try {
    await AsyncStorage.setItem(DEVICE_FP_KEY, fp);
  } catch {}

  cachedFingerprint = fp;
  return fp;
}
