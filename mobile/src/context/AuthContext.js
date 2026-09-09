import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import client from "../api/client";
import { getDeviceFingerprint } from "../lib/fingerprint";

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const BG_TIME_KEY = "bg_timestamp";
const LAST_USER_KEY = "last_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUser, setLastUser] = useState(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LAST_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const nameIsEmail =
            parsed.name &&
            (parsed.name.includes("@") || parsed.name === parsed.identifier);
          const missingPhone = parsed.phone === undefined;
          if (nameIsEmail || missingPhone) {
            await AsyncStorage.removeItem(LAST_USER_KEY);
          } else {
            setLastUser(parsed);
          }
        }
      } catch {}

      try {
        const existingToken = await SecureStore.getItemAsync("auth_token");
        if (existingToken) {
          setToken(existingToken);
          try {
            const me = await client.get("/auth/me");
            setUser(me.data.data.user);
          } catch {
            await SecureStore.deleteItemAsync("auth_token");
            setToken(null);
          }
        }
      } catch {}

      await AsyncStorage.removeItem(BG_TIME_KEY);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      const prev = appState.current;
      appState.current = nextState;

      if (
        (prev === "active" || prev === "inactive") &&
        nextState === "background"
      ) {
        await AsyncStorage.setItem(BG_TIME_KEY, String(Date.now()));
      } else if (nextState === "active" && prev === "background") {
        try {
          const bgTimeStr = await AsyncStorage.getItem(BG_TIME_KEY);
          await AsyncStorage.removeItem(BG_TIME_KEY);
          if (bgTimeStr) {
            const elapsed = Date.now() - parseInt(bgTimeStr, 10);
            if (elapsed > SESSION_TIMEOUT_MS) {
              await _clearSession();
            }
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, []);

  const _clearSession = async () => {
    try {
      await client.post("/auth/logout");
    } catch {}
    await AsyncStorage.multiRemove([BG_TIME_KEY, LAST_USER_KEY]);
    await SecureStore.deleteItemAsync("auth_token");
    setToken(null);
    setUser(null);
    setLastUser(null);
  };

  const clearLastUser = async () => {
    await AsyncStorage.removeItem(LAST_USER_KEY);
    setLastUser(null);
  };

  const login = async (identifier, password, deviceFingerprint) => {
    const payload = { identifier, password };
    if (deviceFingerprint) payload.deviceFingerprint = deviceFingerprint;
    const r = await client.post("/auth/login", payload);
    const data = r.data.data;

    // If OTP is required, return the full response (don't set user yet)
    if (data.requiresOtp) {
      return { requiresOtp: true, otpToken: data.otpToken, email: data.email };
    }

    // No OTP needed — user is logged in
    const { token: t, user: u } = data;
    await SecureStore.setItemAsync("auth_token", t);
    const name =
      [u.firstname, u.lastname].filter(Boolean).join(" ") ||
      u.name ||
      u.fullname ||
      identifier;
    const userInfo = { name, identifier, phone: u.phone || "" };
    await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(userInfo));
    setLastUser(userInfo);
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    // Include device fingerprint so the device is recognized on next login
    const fingerprint = await getDeviceFingerprint();
    const r = await client.post("/auth/register", { ...payload, deviceFingerprint: fingerprint });
    const { token: t, userId } = r.data.data;
    // Save token to SecureStore BEFORE calling /auth/me so it uses the new account's token
    await SecureStore.setItemAsync("auth_token", t);
    setToken(t);
    const me = await client.get("/auth/me");
    const u = me.data.data.user;
    setUser(u);
    const name =
      [u.firstname, u.lastname].filter(Boolean).join(" ") ||
      u.name ||
      u.fullname ||
      payload.fullname ||
      "";
    const identifier = payload.email || payload.phone || "";
    const userInfo = {
      name,
      identifier,
      phone: u.phone || payload.phone || "",
    };
    await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(userInfo));
    setLastUser(userInfo);
    return userId;
  };

  const logout = async () => {
    await _clearSession();
  };

  const refreshUser = async () => {
    const r = await client.get("/auth/me");
    setUser(r.data.data.user);
    return r.data.data.user;
  };

  const completeOtpLogin = async (userData) => {
    setUser(userData);
    // Update lastUser with the OTP-verified user so welcome back shows correct account
    try {
      const name =
        [userData.firstname, userData.lastname].filter(Boolean).join(" ") ||
        userData.name ||
        userData.fullname ||
        "";
      const identifier = userData.email || userData.phone || "";
      const userInfo = { name, identifier, phone: userData.phone || "" };
      await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(userInfo));
      setLastUser(userInfo);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        lastUser,
        login,
        register,
        logout,
        refreshUser,
        clearLastUser,
        completeOtpLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
