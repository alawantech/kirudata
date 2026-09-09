"use client";
import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import { Monitor, Smartphone, Trash2, Shield, RefreshCw } from "lucide-react";

function parseUA(ua) {
  if (!ua) return { device: "Unknown", icon: Monitor };
  if (/mobile|android|iphone/i.test(ua)) return { device: "Mobile", icon: Smartphone };
  if (/windows/i.test(ua)) return { device: "Windows PC", icon: Monitor };
  if (/macintosh|mac os/i.test(ua)) return { device: "Mac", icon: Monitor };
  if (/linux/i.test(ua)) return { device: "Linux", icon: Monitor };
  return { device: "Browser", icon: Monitor };
}

export default function SessionsPage() {
  const { admin } = useAdmin();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await adminApi.get("/admin/auth/sessions");
      if (res.data.ok) setSessions(res.data.data.sessions);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const revokeSession = async (id) => {
    if (!confirm("Revoke this session?")) return;
    try {
      await adminApi.delete(`/admin/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const revokeAll = async () => {
    if (!confirm("Revoke ALL other sessions? You will stay logged in on this device.")) return;
    try {
      const otherSessions = sessions.filter((s) => !s.isCurrent);
      for (const s of otherSessions) {
        await adminApi.delete(`/admin/auth/sessions/${s.id}`);
      }
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("All other sessions revoked");
    } catch {
      toast.error("Failed to revoke sessions");
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Active Sessions</h1>
          <p style={{ color: "#64748b", fontSize: ".875rem", margin: "4px 0 0" }}>Manage devices logged into your admin account</p>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button onClick={fetchSessions} style={{ padding: ".5rem 1rem", borderRadius: ".5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".8rem" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button onClick={revokeAll} style={{ padding: ".5rem 1rem", borderRadius: ".5rem", border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontSize: ".8rem" }}>
              Revoke All Others
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No active sessions</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {sessions.map((s) => {
            const { device, icon: Icon } = parseUA(s.userAgent);
            return (
              <div key={s.id} style={{
                background: "white",
                borderRadius: ".75rem",
                border: s.isCurrent ? "2px solid #2563eb" : "1px solid #e2e8f0",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: ".5rem",
                  background: s.isCurrent ? "#eff6ff" : "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={s.isCurrent ? "#2563eb" : "#64748b"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: ".9rem", color: "#0f172a" }}>{device}</span>
                    {s.isCurrent && (
                      <span style={{ fontSize: ".65rem", background: "#2563eb", color: "white", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        This Device
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#64748b", marginTop: 2 }}>
                    IP: {s.ip} &middot; Last active: {timeAgo(s.lastActivityAt)}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "#94a3b8", marginTop: 2 }}>
                    {s.userAgent?.substring(0, 80)}{s.userAgent?.length > 80 ? "..." : ""}
                  </div>
                </div>
                {!s.isCurrent && (
                  <button onClick={() => revokeSession(s.id)} style={{
                    padding: ".4rem .75rem", borderRadius: ".5rem",
                    border: "1px solid #fecaca", background: "#fef2f2",
                    color: "#dc2626", cursor: "pointer", fontSize: ".75rem",
                    display: "flex", alignItems: "center", gap: ".35rem",
                  }}>
                    <Trash2 size={12} /> Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
