"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Bell,
  HeadphonesIcon,
  LogOut,
  KeyRound,
  Wallet,
  Copy,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const USER_TYPE_LABELS = { 1: "Regular User", 2: "Vendor" };
const REG_STATUS = {
  1: { label: "Verified", cls: "badge-success" },
  2: { label: "Unverified", cls: "badge-pending" },
  3: { label: "Suspended", cls: "badge-failed" },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    if (user?.type === 1) {
      api
        .get("/user/upgrade-status")
        .then((r) => setUpgradeStatus(r.data.data?.request || null))
        .catch(() => {});
    }
  }, [user?.type]);

  const copyApiKey = () => {
    if (!user?.apiKey) return;
    navigator.clipboard.writeText(user.apiKey).then(() => {
      setCopied(true);
      toast.success("API key copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const regSt = REG_STATUS[user?.regStatus] || REG_STATUS[2];
  const initials =
    `${user?.firstname?.[0] || ""}${user?.lastname?.[0] || ""}`.toUpperCase();
  const balance = parseFloat(user?.wallet || 0);

  const requestUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      await api.post("/user/upgrade-request");
      toast.success("Upgrade request submitted!");
      setUpgradeStatus({ status: 0, createdAt: new Date().toISOString() });
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Failed");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const MENU = [
    {
      label: "Change Password",
      icon: KeyRound,
      href: "/dashboard/change-password",
      color: "#4f46e5",
    },
    {
      label: user?.pinEnabled ? "Change Transaction PIN" : "Set Transaction PIN",
      icon: Shield,
      href: "/dashboard/change-pin",
      color: "#dc2626",
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      color: "#7c3aed",
    },
    {
      label: "Support",
      icon: HeadphonesIcon,
      href: "/dashboard/support",
      color: "#0891b2",
    },
    {
      label: "Fund Wallet",
      icon: Wallet,
      href: "/dashboard/fund-wallet",
      color: "#d97706",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 4rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".875rem",
            marginBottom: "1.75rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <button className="back-btn" onClick={() => router.back()}>
            <ChevronLeft size={20} color="white" />
          </button>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.15rem" }}>
            My Profile
          </h1>
        </div>
        {/* Avatar row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: "rgba(255,255,255,.2)",
              border: "3px solid rgba(255,255,255,.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontWeight: 900,
                fontSize: "1.35rem",
                color: "white",
                letterSpacing: "-.01em",
              }}
            >
              {initials || "U"}
            </span>
          </div>
          <div>
            <h2
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: "-.01em",
                marginBottom: ".2rem",
              }}
            >
              {user?.firstname} {user?.lastname}
            </h2>
            <div
              style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
            >
              <span className={`badge ${regSt.cls}`}>{regSt.label}</span>
              <span
                style={{ color: "rgba(255,255,255,.55)", fontSize: ".75rem" }}
              >
                {USER_TYPE_LABELS[user?.type] || "User"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "0 1rem",
          marginTop: "-2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: ".75rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "1.125rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.07)",
            }}
          >
            <p
              style={{
                fontSize: ".72rem",
                color: "#71717a",
                marginBottom: ".375rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Wallet
            </p>
            <p
              style={{
                fontWeight: 900,
                fontSize: "1.15rem",
                color: "#09090b",
                letterSpacing: "-.02em",
              }}
            >
              ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "1.125rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.07)",
            }}
          >
            <p
              style={{
                fontSize: ".72rem",
                color: "#71717a",
                marginBottom: ".375rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Ref Wallet
            </p>
            <p
              style={{
                fontWeight: 900,
                fontSize: "1.15rem",
                color: "#09090b",
                letterSpacing: "-.02em",
              }}
            >
              ₦
              {parseFloat(user?.refWallet || 0).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Personal Info */}
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "1.25rem",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: ".78rem",
              color: "#52525b",
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Personal Info
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}
          >
            {[
              {
                icon: User,
                label: "Full Name",
                value:
                  `${user?.firstname || ""} ${user?.lastname || ""}`.trim(),
              },
              { icon: Mail, label: "Email", value: user?.email || "—" },
              { icon: Phone, label: "Phone", value: user?.phone || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".875rem",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: "rgba(79,70,229,.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} color="#4f46e5" />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: ".72rem",
                      color: "#71717a",
                      marginBottom: ".1rem",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: ".875rem",
                      color: "#09090b",
                    }}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Upgrade */}
        {user?.type === 1 && (
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              border: "1px solid #f1f5f9",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: ".78rem",
                color: "#52525b",
                marginBottom: ".75rem",
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Account Upgrade
            </p>
            {upgradeStatus?.status === 0 ? (
              <div
                style={{
                  background: "#fef3c7",
                  borderRadius: "1rem",
                  padding: "1rem",
                  color: "#92400e",
                  fontSize: ".85rem",
                  fontWeight: 600,
                }}
              >
                ⏳ Your vendor upgrade request is pending admin review.
              </div>
            ) : upgradeStatus?.status === 2 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".75rem",
                }}
              >
                <div
                  style={{
                    background: "#fee2e2",
                    borderRadius: "1rem",
                    padding: "1rem",
                    color: "#991b1b",
                    fontSize: ".85rem",
                    fontWeight: 600,
                  }}
                >
                  ❌ Your previous request was rejected.
                  {upgradeStatus.note ? ` Reason: ${upgradeStatus.note}` : ""}
                </div>
                <button
                  onClick={requestUpgrade}
                  disabled={upgradeLoading}
                  style={{
                    background: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "1rem",
                    padding: ".875rem",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: ".9rem",
                    cursor: upgradeLoading ? "not-allowed" : "pointer",
                    opacity: upgradeLoading ? 0.7 : 1,
                  }}
                >
                  {upgradeLoading ? "Submitting..." : "Request Again"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".75rem",
                }}
              >
                <p
                  style={{
                    fontSize: ".85rem",
                    color: "#52525b",
                    lineHeight: 1.5,
                  }}
                >
                  Upgrade to <strong>Vendor</strong> to access special
                  discounted pricing on all services.
                </p>
                <button
                  onClick={requestUpgrade}
                  disabled={upgradeLoading}
                  style={{
                    background: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "1rem",
                    padding: ".875rem",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: ".9rem",
                    cursor: upgradeLoading ? "not-allowed" : "pointer",
                    opacity: upgradeLoading ? 0.7 : 1,
                  }}
                >
                  {upgradeLoading ? "Submitting..." : "Request Vendor Upgrade"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* API Key */}
        {user?.apiKey && (
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: ".75rem",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: ".78rem",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                }}
              >
                API Key
              </p>
              <button
                onClick={copyApiKey}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                  background: "rgba(79,70,229,.07)",
                  border: "none",
                  borderRadius: "8px",
                  padding: ".35rem .75rem",
                  cursor: "pointer",
                  color: "#4f46e5",
                  fontWeight: 700,
                  fontSize: ".72rem",
                }}
              >
                {copied ? (
                  <CheckCircle2 size={13} color="#059669" />
                ) : (
                  <Copy size={13} />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <code
              style={{
                display: "block",
                background: "#f4f4f5",
                borderRadius: ".75rem",
                padding: ".75rem 1rem",
                fontSize: ".72rem",
                color: "#52525b",
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}
            >
              {user.apiKey}
            </code>
          </div>
        )}

        {/* Menu */}
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}
        >
          {MENU.map(({ label, icon: Icon, href, color }, i) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".875rem",
                padding: "1rem 1.25rem",
                textDecoration: "none",
                borderBottom:
                  i < MENU.length - 1 ? "1px solid #f4f4f5" : "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: `${color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color={color} />
              </div>
              <span
                style={{
                  flex: 1,
                  fontWeight: 600,
                  fontSize: ".875rem",
                  color: "#09090b",
                }}
              >
                {label}
              </span>
              <ChevronRight size={16} color="#a1a1aa" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "white",
            border: "1.5px solid #fecaca",
            borderRadius: "1.25rem",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: ".875rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
            marginBottom: ".5rem",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LogOut size={18} color="#dc2626" />
          </div>
          <span
            style={{ fontWeight: 700, fontSize: ".875rem", color: "#dc2626" }}
          >
            Logout
          </span>
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#a1a1aa",
            fontSize: ".72rem",
            paddingBottom: ".5rem",
          }}
        >
          KIRU DATA v2.0
        </p>
      </div>
    </div>
  );
}
