"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Bell,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";

const NOTIF_ICONS = {
  info: { Icon: Info, color: "#4f46e5", bg: "rgba(79,70,229,.1)" },
  success: { Icon: CheckCircle2, color: "#059669", bg: "rgba(5,150,105,.1)" },
  warning: { Icon: AlertCircle, color: "#d97706", bg: "rgba(217,119,6,.1)" },
  alert: { Icon: AlertCircle, color: "#dc2626", bg: "rgba(220,38,38,.1)" },
  default: { Icon: Bell, color: "#0891b2", bg: "rgba(8,145,178,.1)" },
};
function getNIcon(type = "") {
  return NOTIF_ICONS[type?.toLowerCase()] || NOTIF_ICONS.default;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/user/notifications")
      .then((r) => setNotifications(r.data.data?.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".875rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <button className="back-btn" onClick={() => router.back()}>
            <ChevronLeft size={20} color="white" />
          </button>
          <div>
            <h1
              style={{ color: "white", fontWeight: 800, fontSize: "1.15rem" }}
            >
              Notifications
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              {notifications.length} message
              {notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {loading ? (
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: ".875rem",
                  padding: "1rem 1.25rem",
                  borderBottom: i < 3 ? "1px solid #f4f4f5" : "none",
                }}
              >
                <div
                  className="shimmer"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    className="shimmer"
                    style={{
                      height: 12,
                      borderRadius: 6,
                      width: "70%",
                      marginBottom: 8,
                    }}
                  />
                  <div
                    className="shimmer"
                    style={{ height: 10, borderRadius: 6, width: "90%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "4rem 1.25rem",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: "#f4f4f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <Bell size={28} color="#a1a1aa" />
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#09090b",
                fontSize: ".9rem",
                marginBottom: ".375rem",
              }}
            >
              No notifications yet
            </p>
            <p style={{ color: "#a1a1aa", fontSize: ".8rem" }}>
              We'll let you know when something happens
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            {notifications.map((n, i) => {
              const { Icon, color, bg } = getNIcon(n.type);
              return (
                <div
                  key={n.id || i}
                  style={{
                    display: "flex",
                    gap: ".875rem",
                    padding: "1rem 1.25rem",
                    borderBottom:
                      i < notifications.length - 1
                        ? "1px solid #f4f4f5"
                        : "none",
                    background: n.read ? "transparent" : "rgba(79,70,229,.02)",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={19} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: ".3rem",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: ".875rem",
                          color: "#09090b",
                        }}
                      >
                        {n.title || "Notification"}
                      </p>
                      {!n.read && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#4f46e5",
                            flexShrink: 0,
                            marginTop: ".25rem",
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: ".8rem",
                        color: "#71717a",
                        lineHeight: 1.5,
                      }}
                    >
                      {n.message || n.body || ""}
                    </p>
                    <p
                      style={{
                        fontSize: ".7rem",
                        color: "#a1a1aa",
                        marginTop: ".375rem",
                      }}
                    >
                      {new Date(n.createdAt || n.date).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
