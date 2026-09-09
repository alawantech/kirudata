"use client";
import { useEffect, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    adminApi
      .get("/admin/issues")
      .then((r) => setIssues(r.data.data?.issues || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sendReply = async () => {
    if (!reply.trim()) {
      toast.error("Enter a reply");
      return;
    }
    setSending(true);
    try {
      await adminApi.post(`/admin/issues/${active.id}/reply`, { reply });
      toast.success("Reply sent");
      setReply("");
      // Refresh issues
      const r = await adminApi.get("/admin/issues");
      const updated = r.data.data?.issues || [];
      setIssues(updated);
      setActive(updated.find((i) => i.id === active.id) || null);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <RequirePermission permission="issues_manage">
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-.03em",
          }}
        >
          Support Issues ({issues.length})
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: active ? "1fr 1fr" : "1fr",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* Issues list */}
        <div
          style={{
            background: "white",
            borderRadius: "1.25rem",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            border: "1px solid #f1f5f9",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div
              style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
            >
              Loading...
            </div>
          ) : issues.length === 0 ? (
            <div
              style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
            >
              No issues
            </div>
          ) : (
            issues.map((issue, i) => (
              <div
                key={issue.id}
                onClick={() => setActive(issue)}
                style={{
                  padding: "1.25rem",
                  borderBottom:
                    i < issues.length - 1 ? "1px solid #f8fafc" : "none",
                  cursor: "pointer",
                  background: active?.id === issue.id ? "#eff6ff" : "white",
                  transition: "background .15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: ".75rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: ".9rem",
                      }}
                    >
                      {issue.user?.firstname} {issue.user?.lastname}
                    </div>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: ".75rem",
                        marginTop: ".1rem",
                      }}
                    >
                      {issue.ref || "No ref"}
                    </div>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: ".8rem",
                        marginTop: ".375rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {issue.query?.substring(0, 80)}
                      {issue.query?.length > 80 ? "..." : ""}
                    </p>
                  </div>
                  {issue.replies?.length === 0 && (
                    <span
                      style={{
                        fontSize: ".65rem",
                        fontWeight: 700,
                        padding: ".2rem .5rem",
                        borderRadius: 99,
                        background: "#fee2e2",
                        color: "#dc2626",
                        flexShrink: 0,
                      }}
                    >
                      OPEN
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply panel */}
        {active && (
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              border: "1px solid #f1f5f9",
              padding: "1.5rem",
            }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: ".25rem",
                }}
              >
                {active.user?.firstname} {active.user?.lastname}
              </div>
              <div style={{ color: "#94a3b8", fontSize: ".75rem" }}>
                {active.user?.email} · {active.ref || "No transaction ref"}
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: ".875rem",
                padding: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: ".75rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  marginBottom: ".375rem",
                }}
              >
                USER QUERY
              </div>
              <p
                style={{
                  color: "#0f172a",
                  fontSize: ".875rem",
                  lineHeight: 1.6,
                }}
              >
                {active.query}
              </p>
            </div>

            {active.replies?.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "#eff6ff",
                  borderRadius: ".875rem",
                  padding: ".875rem",
                  marginBottom: ".875rem",
                  borderLeft: "3px solid #2563eb",
                }}
              >
                <div
                  style={{
                    fontSize: ".7rem",
                    fontWeight: 600,
                    color: "#2563eb",
                    marginBottom: ".25rem",
                  }}
                >
                  ADMIN REPLY
                </div>
                <p
                  style={{
                    color: "#1e40af",
                    fontSize: ".85rem",
                    lineHeight: 1.5,
                  }}
                >
                  {r.reply}
                </p>
              </div>
            ))}

            <div style={{ marginTop: "1rem" }}>
              <textarea
                rows={3}
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                style={{
                  width: "100%",
                  padding: ".75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: ".875rem",
                  fontFamily: "inherit",
                  fontSize: ".9rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  marginBottom: ".875rem",
                }}
              />
              <button
                onClick={sendReply}
                disabled={sending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: ".875rem",
                  padding: ".75rem 1.5rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                }}
              >
                <Send size={15} /> {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </RequirePermission>
  );
}
