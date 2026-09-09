"use client";
import { useAdmin } from "@/context/AdminContext";
import { Shield } from "lucide-react";

export default function RequirePermission({ permission, children }) {
  const { admin, hasPermission } = useAdmin();

  if (permission && !hasPermission(permission)) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 1rem", opacity: .3 }} />
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Access Denied</h2>
        <p style={{ fontSize: ".85rem" }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
