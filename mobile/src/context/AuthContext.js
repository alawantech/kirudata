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
const BOOT_TIMEOUT_MS = 12000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUser, setLastUser] = useState(null);
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
  };

  useEffect(() => {
    (async () => {
      try {
        const [stored, existingToken, cachedProfile] = await Promise.all([
          AsyncStorage.getItem(LAST_USER_KEY),
          SecureStore.getItemAsync("auth_token"),
          AsyncStorage.getItem(CACHED_USER_KEY),
        ]);

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

        let restored = null;
        if (cachedProfile) {
          try {
            restored = JSON.parse(cachedProfile);
          } catch {}
        }

        if (existingToken) {
          setToken(existingToken);

          if (restored) {
            // Fast path: open instantly with the cached profile, then
            // validate the token in the background.
            setUser(restored);
            setLoading(false);
            client
              .get("/auth/me", { timeout: BOOT_TIMEOUT_MS })
              .then(async (me) => {
                const fresh = me.data.data.user;
                setUser(fresh);
                await _cacheUser(fresh);
              })
              .catch(async (err) => {
                const status = err?.response?.status;
                if (status === 401 || status === 403) await _endSession();
              });
          } else {
            try {
              const me = await client.get("/auth/me", {
                timeout: BOOT_TIMEOUT_MS,
              });
              const fresh = me.data.data.user;
              setUser(fresh);
              await _cacheUser(fresh);
            } catch (err) {
              // Only an auth failure logs the user out. Network/timeout
              // errors must NOT delete the token — that used to force
              // returning users back into onboarding.
              const status = err?.response?.status;
              if (status === 401 || status === 403) await _endSession();
            }
          }
        } else if (restored) {
          // Cached profile but no token — drop the stale profile.
          await AsyncStorage.removeItem(CACHED_USER_KEY);
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
