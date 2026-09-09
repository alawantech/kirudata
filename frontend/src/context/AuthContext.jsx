"use client";
import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password, deviceFingerprint) => {
    const payload = { identifier, password };
    if (deviceFingerprint) payload.deviceFingerprint = deviceFingerprint;
    const r = await api.post("/auth/login", payload);
    const data = r.data.data;

    // If OTP is required, return the full response (don't set user yet)
    if (data.requiresOtp) {
      return { requiresOtp: true, otpToken: data.otpToken, email: data.email };
    }

    // No OTP needed — user is logged in
    setUser(data.user);
    return data.user;
  };

  // Called after OTP verification — sets user from the verify response
  const completeOtpLogin = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  const refreshUser = async () => {
    const r = await api.get("/auth/me");
    setUser(r.data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, completeOtpLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
