"use client";
import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_LABELS = {
  login_requested: { label: "Login Requested", color: "#3b82f6", bg: "#eff6ff" },
  login_success: { label: "Login Success", color: "#16a34a", bg: "#f0fdf4" },
  logout: { label: "Logged Out", color: "#64748b", bg: "#f8fafc" },
  password_changed: { label: "Password Changed", color: "#f59e0b", bg: "#fffbeb" },
  session_revoked: { label: "Session Revoked", color: "#dc2626", bg: "#fef2f2" },
  admin_created: { label: "Admin Created", color: "#8b5cf6", bg: "#f5f3ff" },
  admin_updated: { label: "Admin Updated", color: "#3b82f6", bg: "#eff6ff" },
  admin_deleted: { label: "Admin Deleted", color: "#dc2626", bg: "#fef2f2" },
};

export default function AuditLogsPage() {
  const { admin } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/auth/audit-logs?page=${p}&limit=20`);
      if (res.data.ok) {
        setLogs(res.data.data.logs);
        setPages(res.data.data.pages);
        setTotal(res.data.data.total);
        setPage(p);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleString("en-NG", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Audit Logs</h1>
        <p style={{ color: "#64748b", fontSize: ".875rem", margin: "4px 0 0" }}>
          {admin?.role === "super_admin" ? "All admin activity across the platform" : "Your activity history"} &middot; {total} total entries
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No audit entries yet</div>
      ) : (
        <div style={{ background: "white", borderRadius: ".75rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".8rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: ".75rem 1rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Action</th>
                <th style={{ textAlign: "left", padding: ".75rem 1rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Details</th>
                <th style={{ textAlign: "left", padding: ".75rem 1rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>IP</th>
                <th style={{ textAlign: "left", padding: ".75rem 1rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const action = ACTION_LABELS[log.action] || { label: log.action, color: "#64748b", bg: "#f8fafc" };
                let details = "";
                try {
                  const d = JSON.parse(log.details);
                  if (d.isNewDevice !== undefined) details = d.isNewDevice ? "New device" : "Known device";
                  else if (d.changes) details = `Changed: ${d.changes.join(", ")}`;
                  else if (d.sessionId) details = `Session #${d.sessionId}`;
                  else if (d.email) details = d.email;
                } catch {}
                return (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: ".75rem 1rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "9999px",
                        fontSize: ".7rem",
                        fontWeight: 600,
                        color: action.color,
                        background: action.bg,
                      }}>
                        {action.label}
                      </span>
                    </td>
                    <td style={{ padding: ".75rem 1rem", color: "#475569" }}>{details || "—"}</td>
                    <td style={{ padding: ".75rem 1rem", color: "#64748b", fontFamily: "monospace", fontSize: ".75rem" }}>{log.ip || "—"}</td>
                    <td style={{ padding: ".75rem 1rem", color: "#64748b" }}>{formatTime(log.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", padding: "1rem", borderTop: "1px solid #f1f5f9" }}>
              <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} style={{ border: "none", background: page <= 1 ? "#f1f5f9" : "#e2e8f0", cursor: page <= 1 ? "default" : "pointer", padding: ".4rem .75rem", borderRadius: ".5rem", display: "flex", alignItems: "center", opacity: page <= 1 ? 0.5 : 1 }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: ".8rem", color: "#64748b" }}>Page {page} of {pages}</span>
              <button onClick={() => fetchLogs(page + 1)} disabled={page >= pages} style={{ border: "none", background: page >= pages ? "#f1f5f9" : "#e2e8f0", cursor: page >= pages ? "default" : "pointer", padding: ".4rem .75rem", borderRadius: ".5rem", display: "flex", alignItems: "center", opacity: page >= pages ? 0.5 : 1 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
