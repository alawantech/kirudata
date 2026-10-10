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
const CACHED_USER_KEY = "cached_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUser, setLastUser] = useState(null);
  // True only after a FRESH login/register/OTP in this app run. A cold start
  // never sets it — that is what forces the Welcome Back re-auth gate.
  const [sessionStarted, setSessionStarted] = useState(false);
  const appState = useRef(AppState.currentState);

  const _cacheUser = async (u) => {
    try {
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
    } catch {}
  };

  // Token is dead (401/403) — drop it without another network call.
  const _endSession = async () => {
    try {
      await SecureStore.deleteItemAsync("auth_token");
      await AsyncStorage.removeItem(CACHED_USER_KEY);
    } catch {}
    setToken(null);
    setUser(null);
    setSessionStarted(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const [stored, existingToken, cachedProfile] = await Promise.all([
          AsyncStorage.getItem(LAST_USER_KEY),
          SecureStore.getItemAsync("auth_token"),
          AsyncStorage.getItem(CACHED_USER_KEY),
        ]);

        let parsed = null;
        if (stored) {
          try {
            parsed = JSON.parse(stored);
          } catch {}
          const nameIsEmail =
            parsed &&
            parsed.name &&
            (parsed.name.includes("@") || parsed.name === parsed.identifier);
          const missingPhone = parsed && parsed.phone === undefined;
          if (!parsed || nameIsEmail || missingPhone) {
            await AsyncStorage.removeItem(LAST_USER_KEY);
            parsed = null;
          }
        }

        let restored = null;
        if (cachedProfile) {
          try {
            restored = JSON.parse(cachedProfile);
          } catch {}
        }

        if (existingToken) {
          setToken(existingToken);
          // Restore the cached profile instantly — no network on cold start.
          // The Welcome Back gate means the dashboard is never auto-entered.
          if (restored) setUser(restored);
        } else if (restored) {
          // No token — the cached profile is useless.
          await AsyncStorage.removeItem(CACHED_USER_KEY);
          restored = null;
        }

        // A known account must always have a lastUser record so cold start
        // lands on Welcome Back (never onboarding). Synthesise it from the
        // cached profile if the stored one was dropped/missing.
        if (parsed) {
          setLastUser(parsed);
        } else if (restored) {
          const name =
            [restored.firstname, restored.lastname].filter(Boolean).join(" ") ||
            restored.name ||
            restored.fullname ||
            "";
          const identifier = restored.email || restored.phone || "";
          const okName =
            name && !name.includes("@") && name !== identifier;
          if (okName && identifier) {
            const userInfo = {
              name,
              identifier,
              phone: restored.phone ?? "",
            };
            await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(userInfo));
            setLastUser(userInfo);
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
    await AsyncStorage.multiRemove([BG_TIME_KEY, CACHED_USER_KEY]);
    await SecureStore.deleteItemAsync("auth_token");
    setToken(null);
    setUser(null);
    setSessionStarted(false);
    // LAST_USER_KEY is intentionally kept: a locked/timed-out session must
    // come back to the Welcome Back screen, never the onboarding carousel.
  };

  const clearLastUser = async () => {
    await AsyncStorage.multiRemove([LAST_USER_KEY, CACHED_USER_KEY]);
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
    setSessionStarted(true);
    await _cacheUser(u);
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
    setSessionStarted(true);
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
    await _cacheUser(u);
    return userId;
  };

  const logout = async () => {
    await _clearSession();
  };

  const refreshUser = async () => {
    const r = await client.get("/auth/me");
    setUser(r.data.data.user);
    await _cacheUser(r.data.data.user);
    return r.data.data.user;
  };

  const completeOtpLogin = async (userData) => {
    setUser(userData);
    setSessionStarted(true);
    await _cacheUser(userData);
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
        sessionStarted,
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
