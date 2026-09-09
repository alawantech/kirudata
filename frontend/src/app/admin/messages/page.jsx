"use client";
import { useEffect, useState } from "react";
import { Mail, MailOpen, Phone, User, Calendar, RefreshCw } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ total: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = filter === "unread" ? "?unread=1" : "";
      const res = await adminApi.get(`/admin/contact-messages${params}`);
      setMessages(res.data.data?.messages || []);
      setMeta(res.data.data?.meta || { total: 0, unreadCount: 0 });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleRead = async (msg) => {
    try {
      const res = await adminApi.put(`/admin/contact-messages/${msg.id}/read`);
      const updated = res.data.data?.message;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, isRead: updated.isRead } : m,
        ),
      );
      setMeta((prev) => ({
        ...prev,
        unreadCount: updated.isRead
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount + 1,
      }));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const cardStyle = (isRead) => ({
    background: isRead ? "white" : "#eff6ff",
    borderRadius: "1rem",
    border: `1px solid ${isRead ? "#f1f5f9" : "#bfdbfe"}`,
    padding: "1.25rem 1.5rem",
    cursor: "pointer",
    transition: "box-shadow .15s",
    marginBottom: ".75rem",
  });

  return (
    <RequirePermission permission="messages_manage">
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-.03em",
              marginBottom: ".25rem",
            }}
          >
            Contact Messages
          </h1>
          <p style={{ color: "#64748b", fontSize: ".875rem" }}>
            {meta.unreadCount > 0 ? (
              <span style={{ color: "#2563eb", fontWeight: 600 }}>
                {meta.unreadCount} unread
              </span>
            ) : (
              "All messages read"
            )}{" "}
            · {meta.total} total
          </p>
        </div>

        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          {/* Filter tabs */}
          {["all", "unread"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: ".5rem 1rem",
                borderRadius: ".75rem",
                border: "1px solid",
                borderColor: filter === f ? "#2563eb" : "#e2e8f0",
                background: filter === f ? "#2563eb" : "white",
                color: filter === f ? "white" : "#64748b",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: ".8rem",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "unread" ? `Unread (${meta.unreadCount})` : "All"}
            </button>
          ))}
          <button
            onClick={fetchMessages}
            style={{
              padding: ".5rem .75rem",
              borderRadius: ".75rem",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Messages list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
          Loading...
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 2rem",
            background: "white",
            borderRadius: "1.25rem",
            border: "1px solid #f1f5f9",
            color: "#94a3b8",
          }}
        >
          <Mail size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
          <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>No messages yet</p>
          <p style={{ fontSize: ".875rem", marginTop: ".5rem" }}>
            {filter === "unread"
              ? "No unread messages — you're all caught up!"
              : "Contact form submissions will appear here."}
          </p>
        </div>
      ) : (
        <div>
          {messages.map((msg) => (
            <div key={msg.id}>
              {/* Summary row */}
              <div
                style={cardStyle(msg.isRead)}
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,.08)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                  }}
                >
                  {/* Left — avatar + name */}
                  <div
                    style={{
                      display: "flex",
                      gap: ".875rem",
                      alignItems: "center",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: msg.isRead
                          ? "linear-gradient(135deg,#e2e8f0,#cbd5e1)"
                          : "linear-gradient(135deg,#2563eb,#06b6d4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: msg.isRead ? "#64748b" : "white",
                        fontWeight: 800,
                        fontSize: "1rem",
                      }}
                    >
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: msg.isRead ? 600 : 800,
                          color: "#0f172a",
                          fontSize: ".95rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {msg.name}
                        {!msg.isRead && (
                          <span
                            style={{
                              display: "inline-block",
                              marginLeft: ".5rem",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#2563eb",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: ".8rem",
                          color: "#64748b",
                          marginTop: ".1rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {msg.message.length > 60
                          ? msg.message.slice(0, 60) + "..."
                          : msg.message}
                      </div>
                    </div>
                  </div>

                  {/* Right — time + read button */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: ".5rem",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                      {timeAgo(msg.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRead(msg);
                      }}
                      title={msg.isRead ? "Mark as unread" : "Mark as read"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".3rem",
                        padding: ".35rem .75rem",
                        borderRadius: ".625rem",
                        border: "1px solid",
                        borderColor: msg.isRead ? "#e2e8f0" : "#bfdbfe",
                        background: msg.isRead ? "#f8fafc" : "#dbeafe",
                        color: msg.isRead ? "#64748b" : "#1d4ed8",
                        fontSize: ".75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {msg.isRead ? (
                        <>
                          <Mail size={12} /> Mark Unread
                        </>
                      ) : (
                        <>
                          <MailOpen size={12} /> Mark Read
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === msg.id && (
                  <div
                    style={{
                      marginTop: "1.25rem",
                      paddingTop: "1.25rem",
                      borderTop: "1px solid #f1f5f9",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: ".75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".5rem",
                          background: "#f8fafc",
                          borderRadius: ".75rem",
                          padding: ".625rem .875rem",
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        <User size={14} color="#2563eb" />
                        <div>
                          <div
                            style={{
                              fontSize: ".7rem",
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            NAME
                          </div>
                          <div
                            style={{
                              fontSize: ".875rem",
                              color: "#0f172a",
                              fontWeight: 600,
                            }}
                          >
                            {msg.name}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`tel:${msg.phone}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".5rem",
                          background: "#f0fdf4",
                          borderRadius: ".75rem",
                          padding: ".625rem .875rem",
                          border: "1px solid #bbf7d0",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Phone size={14} color="#16a34a" />
                        <div>
                          <div
                            style={{
                              fontSize: ".7rem",
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            PHONE
                          </div>
                          <div
                            style={{
                              fontSize: ".875rem",
                              color: "#15803d",
                              fontWeight: 600,
                            }}
                          >
                            {msg.phone}
                          </div>
                        </div>
                      </a>
                      <a
                        href={`mailto:${msg.email}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".5rem",
                          background: "#eff6ff",
                          borderRadius: ".75rem",
                          padding: ".625rem .875rem",
                          border: "1px solid #bfdbfe",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Mail size={14} color="#2563eb" />
                        <div>
                          <div
                            style={{
                              fontSize: ".7rem",
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            EMAIL
                          </div>
                          <div
                            style={{
                              fontSize: ".875rem",
                              color: "#1d4ed8",
                              fontWeight: 600,
                            }}
                          >
                            {msg.email}
                          </div>
                        </div>
                      </a>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".5rem",
                          background: "#f8fafc",
                          borderRadius: ".75rem",
                          padding: ".625rem .875rem",
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        <Calendar size={14} color="#94a3b8" />
                        <div>
                          <div
                            style={{
                              fontSize: ".7rem",
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            RECEIVED
                          </div>
                          <div
                            style={{
                              fontSize: ".875rem",
                              color: "#0f172a",
                              fontWeight: 600,
                            }}
                          >
                            {new Date(msg.createdAt).toLocaleString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: ".875rem",
                        padding: "1rem 1.25rem",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          fontSize: ".7rem",
                          color: "#94a3b8",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".08em",
                          marginBottom: ".625rem",
                        }}
                      >
                        Message
                      </div>
                      <p
                        style={{
                          color: "#374151",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          fontSize: ".9rem",
                          margin: 0,
                        }}
                      >
                        {msg.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
