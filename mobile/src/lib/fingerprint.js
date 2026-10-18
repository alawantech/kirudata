import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const DEVICE_FP_KEY = "device_fingerprint";

let cachedFingerprint = null;

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceFingerprint() {
  if (cachedFingerprint) return cachedFingerprint;

  // Prefer SecureStore: it survives AsyncStorage/app-data clears.
  let stored = null;
  try {
    stored = await SecureStore.getItemAsync(DEVICE_FP_KEY);
  } catch {}
  if (!stored) {
    try {
      stored = await AsyncStorage.getItem(DEVICE_FP_KEY);
    } catch {}
  }
  if (stored) {
    cachedFingerprint = stored;
    try {
      await SecureStore.setItemAsync(DEVICE_FP_KEY, stored);
    } catch {}
    try {
      await AsyncStorage.setItem(DEVICE_FP_KEY, stored);
    } catch {}
    return stored;
  }

  // First run on this install: mint a unique per-install id. The old
  // Platform.OS+Version hash was identical for every device on the same OS
  // version, so users on the same OS kept deleting each other's
  // recognized-device rows -> OTP on every login.
  const fp = "mobile-" + uuidv4();
  try {
    await SecureStore.setItemAsync(DEVICE_FP_KEY, fp);
  } catch {}
  try {
    await AsyncStorage.setItem(DEVICE_FP_KEY, fp);
  } catch {}
  cachedFingerprint = fp;
  return fp;
}
