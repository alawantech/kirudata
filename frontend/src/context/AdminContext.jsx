"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import adminApi from "@/lib/adminApi";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Schedule the next proactive refresh 1 minute before the 30-minute token expires
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await adminApi.post("/admin/auth/refresh");
        if (res.data.ok) {
          scheduleRefresh(); // keep scheduling
        } else {
          setAdmin(null);
        }
      } catch {
        setAdmin(null);
      }
    }, 29 * 60 * 1000); // 29 minutes
  }, []);

  // On mount: try /me first. The adminApi interceptor will automatically
  // call /refresh if the access token has expired, then retry /me.
  // If both fail (no refresh cookie or session expired), admin stays null
  // and the layout redirects to login.
  useEffect(() => {
    adminApi
      .get("/admin/auth/me")
      .then((r) => {
        if (r.data.ok && r.data.data?.admin) {
          setAdmin(r.data.data.admin);
          scheduleRefresh();
        } else {
          setAdmin(null);
        }
      })
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const adminLogin = async (email, password) => {
    const res = await adminApi.post("/admin/auth/login", { email, password });
    if (res.data.ok && !res.data.requiresOtp && res.data.data?.admin) {
      setAdmin(res.data.data.admin);
      scheduleRefresh();
    }
    return res.data;
  };

  const adminVerifyOtp = async (adminId, otp) => {
    const res = await adminApi.post("/admin/auth/verify-otp", { adminId, otp });
    if (res.data.ok && res.data.data?.admin) {
      setAdmin(res.data.data.admin);
      scheduleRefresh();
    }
    return res.data;
  };

  const adminLogout = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await adminApi.post("/admin/auth/logout").catch(() => {});
    setAdmin(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await adminApi.post("/admin/auth/change-password", { currentPassword, newPassword });
    return res.data;
  };

  const hasPermission = (perm) => {
    if (!admin) return false;
    if (admin.role === "super_admin") return true;
    let perms = admin.permissions;
    if (typeof perms === "string") perms = JSON.parse(perms);
    return Array.isArray(perms) && perms.includes(perm);
  };

  return (
    <AdminContext.Provider value={{ admin, loading, adminLogin, adminVerifyOtp, adminLogout, changePassword, hasPermission }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
