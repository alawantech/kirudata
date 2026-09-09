"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Bell,
  Plus,
  ArrowUpRight,
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  RefreshCcw,
  ChevronRight,
  Wallet,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Clock,
  CreditCard,
  PhoneCall,
  MessageSquare,
  Gift,
  Users,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import NumericPinInput from "@/components/NumericPinInput";

const SERVICES = [
  {
    label: "Airtime",
    icon: Phone,
    href: "/dashboard/airtime",
    color: "#f97316",
    light: "#fff7ed",
    grad: "linear-gradient(135deg,#f97316,#fb923c)",
  },
  {
    label: "Data",
    icon: Wifi,
    href: "/dashboard/data",
    color: "#4f46e5",
    light: "#eff6ff",
    grad: "linear-gradient(135deg,#4f46e5,#6366f1)",
  },
  {
    label: "Cable TV",
    icon: Tv,
    href: "/dashboard/cable",
    color: "#7c3aed",
    light: "#f5f3ff",
    grad: "linear-gradient(135deg,#7c3aed,#a855f7)",
  },
  {
    label: "Electricity",
    icon: Zap,
    href: "/dashboard/electricity",
    color: "#d97706",
    light: "#fffbeb",
    grad: "linear-gradient(135deg,#d97706,#f59e0b)",
  },
  {
    label: "Exam Pins",
    icon: GraduationCap,
    href: "/dashboard/exam",
    color: "#059669",
    light: "#ecfdf5",
    grad: "linear-gradient(135deg,#059669,#10b981)",
  },
  {
    label: "Data Card",
    icon: CreditCard,
    href: "/dashboard/data-card",
    color: "#7c3aed",
    light: "#f5f3ff",
    grad: "linear-gradient(135deg,#7c3aed,#a855f7)",
  },
  {
    label: "Recharge Card",
    icon: PhoneCall,
    href: "/dashboard/recharge-card",
    color: "#16a34a",
    light: "#f0fdf4",
    grad: "linear-gradient(135deg,#16a34a,#22c55e)",
  },
  {
    label: "Bulk SMS",
    icon: MessageSquare,
    href: "/dashboard/sms",
    color: "#0891b2",
    light: "#e0f2fe",
    grad: "linear-gradient(135deg,#0891b2,#06b6d4)",
  },
];

const SVC_STATUS = (s) => {
  if (s === 1 || s === "success")
    return { cls: "badge-success", label: "Success" };
  if (s === 0 || s === "failed")
    return { cls: "badge-failed", label: "Failed" };
  return { cls: "badge-pending", label: "Pending" };
};

const SVC_ICON_MAP = {
  airtime: { color: "#f97316", bg: "#fff7ed", Icon: Phone },
  data: { color: "#4f46e5", bg: "#eff6ff", Icon: Wifi },
  cable: { color: "#7c3aed", bg: "#f5f3ff", Icon: Tv },
  electricity: { color: "#d97706", bg: "#fffbeb", Icon: Zap },
  exam: { color: "#059669", bg: "#ecfdf5", Icon: GraduationCap },
  default: { color: "#0891b2", bg: "#ecfeff", Icon: RefreshCcw },
};

function getIconMeta(service = "") {
  const s = service.toLowerCase();
  for (const [k, v] of Object.entries(SVC_ICON_MAP)) {
    if (s.includes(k)) return v;
  }
  return SVC_ICON_MAP.default;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".875rem",
        padding: ".875rem 1.25rem",
      }}
    >
      <div
        className="shimmer"
        style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="shimmer"
          style={{ height: 12, borderRadius: 6, width: "60%", marginBottom: 6 }}
        />
        <div
          className="shimmer"
          style={{ height: 10, borderRadius: 6, width: "40%" }}
        />
      </div>
      <div
        className="shimmer"
        style={{ height: 12, borderRadius: 6, width: 56 }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [showBal, setShowBal] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinStep, setPinStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const settings = useSiteSettings();
  const bonusPercent = parseFloat(settings?.referralBonusPercent || 0);

  const [banners, setBanners] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerTimer = useRef(null);

  const startBannerTimer = useCallback(() => {
    clearInterval(bannerTimer.current);
    if (banners.length > 1) {
      bannerTimer.current = setInterval(() => {
        setActiveBanner((prev) => (prev + 1) % banners.length);
      }, 4000);
    }
  }, [banners.length]);

  useEffect(() => {
    startBannerTimer();
    return () => clearInterval(bannerTimer.current);
  }, [startBannerTimer]);

  const goToBanner = (idx) => {
    setActiveBanner(idx);
    startBannerTimer();
  };

  const handlePinEntry = (pinValue) => {
    setPin(pinValue);
    setPinStep(2); // Move to confirmation step
  };

  const handlePinConfirm = async (confirmValue) => {
    if (pin !== confirmValue) {
      toast.error("PINs do not match");
      setPinStep(1);
      setPin("");
      return;
    }
    setPinLoading(true);
    try {
      await api.post("/user/pin", { newPin: pin });
      await refreshUser();
      toast.success("Transaction PIN set successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to set PIN");
      setPinStep(1);
      setPin("");
      setPinLoading(false);
    }
  };

  const load = () =>
    Promise.all([
      api
        .get("/user/transactions?limit=5")
        .catch(() => ({ data: { data: { transactions: [] } } })),
      api
        .get("/user/notifications")
        .catch(() => ({ data: { data: { notifications: [] } } })),
      api
        .get("/public/banners")
        .catch(() => ({ data: { data: { banners: [] } } })),
    ]).then(([txRes, notifRes, bannerRes]) => {
      setTransactions((txRes.data.data?.transactions || []).slice(0, 5));
      setNotifications(notifRes.data.data?.notifications || []);
      setBanners(bannerRes.data.data?.banners || []);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), load()]);
    setRefreshing(false);
  };

  const wallet = parseFloat(user?.wallet || 0);
  const unread = notifications.length;

  return (
    <div style={{ background: "#f5f5f7", minHeight: "100vh" }}>
      {/* ── Forced PIN setup modal with custom keyboard ── */}
      {user && !user.pinEnabled && pinStep === 1 && (
        <NumericPinInput
          title="Set Your Transaction PIN"
          description="Create a 4-digit PIN to authorize all transactions. This step is required."
          onSubmit={handlePinEntry}
          isLoading={pinLoading}
        />
      )}

      {/* ── Confirm PIN step with back button ── */}
      {user && !user.pinEnabled && pinStep === 2 && (
        <NumericPinInput
          title="Confirm Your Transaction PIN"
          description="Re-enter your 4-digit PIN to confirm."
          onSubmit={handlePinConfirm}
          isLoading={pinLoading}
          onBack={() => {
            setPinStep(1);
            setPin("");
          }}
        />
      )}
      {/* â”€â”€ HERO HEADER â”€â”€ */}
      <div className="grad-bg" style={{ padding: "2.5rem 0 5rem" }}>
        <div className="dash-page-inner">
          {/* Top row â€” greeting + bell (desktop: bell hidden since sidebar has nav) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,.6)",
                  fontSize: ".75rem",
                  fontWeight: 500,
                  marginBottom: ".25rem",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                }}
              >
                {greeting()}
              </p>
              <h1
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  letterSpacing: "-.03em",
                  lineHeight: 1.2,
                }}
              >
                {user?.firstname} {user?.lastname}
              </h1>
            </div>

            {/* Notification bell (visible on all sizes) */}
            <Link
              href="/dashboard/notifications"
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "rgba(255,255,255,.14)",
                border: "1px solid rgba(255,255,255,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bell size={20} color="white" strokeWidth={1.8} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 9,
                    right: 9,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#f87171",
                    border: "1.5px solid rgba(49,46,129,.8)",
                    display: "block",
                  }}
                />
              )}
            </Link>
          </div>

          {/* Wallet + Quick actions row */}
          <div className="hero-row">
            {/* Wallet Card */}
            <div
              className="wallet-card hero-wallet"
              style={{ position: "relative", zIndex: 1 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: ".25rem",
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,.55)",
                    fontSize: ".75rem",
                    fontWeight: 500,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                  }}
                >
                  Wallet Balance
                </span>
                <button
                  onClick={() => setShowBal((v) => !v)}
                  style={{
                    background: "rgba(255,255,255,.1)",
                    border: "none",
                    borderRadius: 8,
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {showBal ? (
                    <EyeOff size={14} color="rgba(255,255,255,.7)" />
                  ) : (
                    <Eye size={14} color="rgba(255,255,255,.7)" />
                  )}
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: ".5rem",
                  margin: ".25rem 0 1.375rem",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,.55)",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                  }}
                >
                  &#x20A6;
                </span>
                <span
                  style={{
                    color: "white",
                    fontWeight: 900,
                    fontSize: "2.5rem",
                    letterSpacing: "-.04em",
                    lineHeight: 1,
                  }}
                >
                  {showBal
                    ? wallet.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })
                    : "••••••"}
                </span>
              </div>

              {/* Quick action row */}
              <div
                style={{
                  display: "flex",
                  gap: ".625rem",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <button
                  className="quick-chip"
                  onClick={() => router.push("/dashboard/fund-wallet")}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(255,255,255,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={17} color="white" />
                  </div>
                  <span>Fund Wallet</span>
                </button>
                <button
                  className="quick-chip"
                  onClick={() => router.push("/dashboard/transactions")}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(255,255,255,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={16} color="white" />
                  </div>
                  <span>History</span>
                </button>
                <button className="quick-chip" onClick={handleRefresh}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(255,255,255,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RefreshCcw
                      size={15}
                      color="white"
                      style={
                        refreshing
                          ? { animation: "spin .85s linear infinite" }
                          : {}
                      }
                    />
                  </div>
                  <span>Refresh</span>
                </button>
                <button
                  className="quick-chip"
                  onClick={() => router.push("/dashboard/support")}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(255,255,255,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MessageCircle size={15} color="white" />
                  </div>
                  <span>Support</span>
                </button>
              </div>
            </div>

            {/* Desktop: stats strip */}
            <div className="hero-stats">
              {[
                {
                  label: "Total Transactions",
                  value: transactions.length,
                  icon: TrendingUp,
                  color: "#4f46e5",
                  bg: "rgba(99,102,241,.15)",
                },
                {
                  label: "Notifications",
                  value: unread,
                  icon: Bell,
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,.15)",
                },
                {
                  label: "Account Status",
                  value: "Active",
                  icon: Wallet,
                  color: "#10b981",
                  bg: "rgba(16,185,129,.15)",
                },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,.1)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,.15)",
                    borderRadius: "1rem",
                    padding: "1.125rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".875rem",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={color} />
                  </div>
                  <div>
                    <div
                      style={{
                        color: "rgba(255,255,255,.55)",
                        fontSize: ".7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        marginBottom: ".2rem",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: "white",
                        fontWeight: 800,
                        fontSize: "1.2rem",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <div
        className="dash-page-inner"
        style={{
          marginTop: "-3rem",
          position: "relative",
          zIndex: 2,
          paddingBottom: "2rem",
        }}
      >
        {/* Two-column layout on desktop */}
        <div className="dash-cols">
          {/* â”€â”€ LEFT / MAIN COLUMN â”€â”€ */}


          <div className="dash-col-main">
            {/* ── PROMOTIONAL BANNERS CAROUSEL ── */}
            {banners.length > 0 && (
              <div
                style={{
                  marginBottom: "1.25rem",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    transition: "transform .4s cubic-bezier(.4,0,.2,1)",
                    transform: `translateX(-${activeBanner * 100}%)`,
                  }}
                >
                  {banners.map((b) => (
                    <a
                      key={b.id}
                      href={b.link || "#"}
                      target={b.link ? "_blank" : undefined}
                      rel={b.link ? "noopener noreferrer" : undefined}
                      style={{
                        minWidth: "100%",
                        display: "block",
                        textDecoration: "none",
                      }}
                      onClick={(e) => {
                        if (!b.link) e.preventDefault();
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "21/9",
                          maxHeight: 220,
                          background: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.imageUrl}
                          alt={b.title || "Promotion"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    </a>
                  ))}
                </div>
                {banners.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 6,
                      background: "rgba(0,0,0,.35)",
                      backdropFilter: "blur(8px)",
                      borderRadius: 20,
                      padding: "5px 10px",
                    }}
                  >
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToBanner(i)}
                        style={{
                          width: i === activeBanner ? 20 : 7,
                          height: 7,
                          borderRadius: 4,
                          border: "none",
                          cursor: "pointer",
                          transition: "all .3s",
                          background:
                            i === activeBanner
                              ? "white"
                              : "rgba(255,255,255,.45)",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
                {banners.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        goToBanner(
                          (activeBanner - 1 + banners.length) % banners.length,
                        )
                      }
                      className="banner-nav-btn"
                      style={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,.3)",
                        backdropFilter: "blur(4px)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity .2s",
                      }}
                    >
                      <ChevronLeft size={16} color="white" />
                    </button>
                    <button
                      onClick={() =>
                        goToBanner((activeBanner + 1) % banners.length)
                      }
                      className="banner-nav-btn"
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,.3)",
                        backdropFilter: "blur(4px)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity .2s",
                      }}
                    >
                      <ChevronRight size={16} color="white" />
                    </button>
                  </>
                )}
              </div>
            )}
            {/* â”€â”€ SERVICES GRID â”€â”€ */}
            <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                padding: "1.25rem 1.25rem 1rem",
                marginBottom: "1.25rem",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.125rem",
                }}
              >
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "#09090b",
                    letterSpacing: "-.01em",
                  }}
                >
                  Quick Services
                </h2>
                <Link
                  href="/dashboard/services"
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 600,
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    gap: ".2rem",
                  }}
                >
                  See all <ChevronRight size={13} />
                </Link>
              </div>

              <div className="svc-grid">
                {SERVICES.map(({ label, icon: Icon, href, color, light }) => (
                  <Link
                    key={href}
                    href={href}
                    className="svc-btn"
                    style={{ gap: ".5rem" }}
                  >
                    <div
                      className="svc-icon"
                      style={{
                        background: light,
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                      }}
                    >
                      <Icon size={23} color={color} strokeWidth={1.75} />
                    </div>
                    <span
                      style={{
                        fontSize: ".72rem",
                        fontWeight: 700,
                        color: "#3f3f46",
                        textAlign: "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── REFERRAL PROMO CARD ── */}
            <Link
              href="/dashboard/referrals"
              style={{
                display: "block",
                textDecoration: "none",
                marginBottom: "1.25rem",
                borderRadius: "1.25rem",
                overflow: "hidden",
                position: "relative",
                background:
                  "linear-gradient(135deg,#4f46e5,#6366f1,#7c3aed)",
                padding: "1.5rem",
                boxShadow:
                  "0 4px 20px rgba(79,70,229,.25), 0 0 0 1px rgba(255,255,255,.08)",
                transition: "transform .15s, box-shadow .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(79,70,229,.35), 0 0 0 1px rgba(255,255,255,.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(79,70,229,.25), 0 0 0 1px rgba(255,255,255,.08)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.1)",
                  top: -40,
                  right: -30,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.07)",
                  bottom: -30,
                  left: -20,
                  pointerEvents: "none",
                }}
              />

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
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "rgba(255,255,255,.18)",
                    border: "1px solid rgba(255,255,255,.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    animation: "refPulse 2s ease-in-out infinite",
                  }}
                >
                  <Gift size={26} color="white" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: ".4rem",
                      marginBottom: ".15rem",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontWeight: 900,
                        fontSize: "1.75rem",
                        lineHeight: 1,
                        letterSpacing: "-.03em",
                      }}
                    >
                      {bonusPercent > 0 ? bonusPercent : "\u2014"}
                    </span>
                    <span
                      style={{
                        color: "white",
                        fontWeight: 800,
                        fontSize: "1rem",
                        marginTop: 4,
                      }}
                    >
                      %
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,.2)",
                        color: "white",
                        fontSize: ".6rem",
                        fontWeight: 800,
                        letterSpacing: ".08em",
                        padding: "2px 8px",
                        borderRadius: 20,
                        textTransform: "uppercase",
                      }}
                    >
                      Commission
                    </span>
                  </div>
                  <p
                    style={{
                      color: "white",
                      fontWeight: 800,
                      fontSize: "1rem",
                      marginBottom: ".2rem",
                    }}
                  >
                    Refer & Earn
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,.8)",
                      fontSize: ".78rem",
                      lineHeight: 1.4,
                    }}
                  >
                    Share your phone number. When friends fund their wallet for
                    the first time, you earn{" "}
                    {bonusPercent > 0 ? bonusPercent : "0"}% instantly.
                  </p>
                </div>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ChevronRight size={18} color="white" />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".4rem",
                  marginTop: "1rem",
                  paddingTop: ".75rem",
                  borderTop: "1px solid rgba(255,255,255,.15)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Users size={12} color="rgba(255,255,255,.85)" />
                <span
                  style={{
                    color: "rgba(255,255,255,.9)",
                    fontSize: ".72rem",
                    fontWeight: 600,
                  }}
                >
                  Share your code · Earn on every referral
                </span>
              </div>
            </Link>

            <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                overflow: "hidden",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem 1.5rem 1rem",
                }}
              >
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "#09090b",
                    letterSpacing: "-.01em",
                  }}
                >
                  Recent Activity
                </h2>
                <Link
                  href="/dashboard/transactions"
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 600,
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    gap: ".2rem",
                  }}
                >
                  View all <ChevronRight size={13} />
                </Link>
              </div>

              <div className="divider" style={{ margin: "0 1.5rem" }} />

              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : transactions.length === 0 ? (
                <div style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: "#f4f4f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem",
                    }}
                  >
                    <TrendingUp size={26} color="#a1a1aa" />
                  </div>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#09090b",
                      fontSize: ".9rem",
                      marginBottom: ".375rem",
                    }}
                  >
                    No transactions yet
                  </p>
                  <p style={{ color: "#a1a1aa", fontSize: ".8rem" }}>
                    Your activity will appear here
                  </p>
                </div>
              ) : (
                transactions.map((tx, i) => {
                  const { color, bg, Icon } = getIconMeta(
                    tx.servicename || tx.service || "",
                  );
                  const st = SVC_STATUS(tx.status);
                  const isDebit =
                    tx.amount < 0 ||
                    parseFloat(tx.oldbal || 0) > parseFloat(tx.newbal || 0);
                  return (
                    <Link
                      key={tx.id || i}
                      href={`/dashboard/transactions/${tx.transref || tx.ref}`}
                      className="tx-row"
                      style={{
                        display: "flex",
                        textDecoration: "none",
                        alignItems: "center",
                        gap: ".875rem",
                        padding: ".875rem 1.5rem",
                        borderBottom:
                          i < transactions.length - 1
                            ? "1px solid #f4f4f5"
                            : "none",
                      }}
                    >
                      <div className="tx-icon" style={{ background: bg }}>
                        <Icon size={18} color={color} strokeWidth={1.75} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: ".875rem",
                            color: "#09090b",
                            marginBottom: ".125rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {tx.servicedesc || tx.service || "Transaction"}
                        </p>
                        <p style={{ fontSize: ".72rem", color: "#a1a1aa" }}>
                          {new Date(tx.date || tx.createdAt).toLocaleString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: ".875rem",
                            color: isDebit ? "#dc2626" : "#059669",
                            marginBottom: ".25rem",
                          }}
                        >
                          {isDebit ? "-" : "+"}₦
                          {Math.abs(parseFloat(tx.amount || 0)).toLocaleString(
                            "en-NG",
                            { minimumFractionDigits: 2 },
                          )}
                        </p>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* â”€â”€ RIGHT COLUMN (desktop only) â”€â”€ */}
          <div className="dash-col-side">
            {/* Quick links */}
            <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)",
                marginBottom: "1.25rem",
              }}
            >
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: ".9rem",
                  color: "#09090b",
                  marginBottom: "1rem",
                  letterSpacing: "-.01em",
                }}
              >
                Quick Links
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".5rem",
                }}
              >
                {[
                  {
                    href: "/dashboard/support",
                    icon: MessageCircle,
                    label: "Support",
                    desc: "Get help from our team",
                    color: "#7c3aed",
                    bg: "#f5f3ff",
                  },
                  {
                    href: "/dashboard/fund-wallet",
                    icon: Wallet,
                    label: "Fund Wallet",
                    desc: "Top up your balance",
                    color: "#059669",
                    bg: "#ecfdf5",
                  },
                  {
                    href: "/dashboard/profile",
                    icon: ArrowUpRight,
                    label: "My Profile",
                    desc: "Manage account settings",
                    color: "#f59e0b",
                    bg: "#fffbeb",
                  },
                ].map(({ href, icon: Icon, label, desc, color, bg }) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".875rem",
                      padding: ".75rem",
                      borderRadius: "1rem",
                      background: "#fafafa",
                      border: "1px solid #f4f4f5",
                      textDecoration: "none",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f4f4f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fafafa")
                    }
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={color} strokeWidth={1.75} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: ".82rem",
                          color: "#09090b",
                          marginBottom: ".15rem",
                        }}
                      >
                        {label}
                      </p>
                      <p style={{ fontSize: ".72rem", color: "#a1a1aa" }}>
                        {desc}
                      </p>
                    </div>
                    <ChevronRight size={15} color="#d4d4d8" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Account info card */}
            <div
              style={{
                background: "linear-gradient(135deg,#0f172a,#1e293b)",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                boxShadow: "0 4px 16px rgba(0,0,0,.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    color: "white",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {(user?.firstname || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: ".9rem",
                    }}
                  >
                    {user?.firstname} {user?.lastname}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,.45)",
                      fontSize: ".75rem",
                      marginTop: ".1rem",
                    }}
                  >
                    {user?.email}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: ".625rem" }}>
                <Link
                  href="/dashboard/profile"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,.1)",
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: ".75rem",
                    padding: ".625rem",
                    textAlign: "center",
                    color: "rgba(255,255,255,.8)",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,.1)")
                  }
                >
                  Edit Profile
                </Link>
                <Link
                  href="/dashboard/change-password"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,.1)",
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: ".75rem",
                    padding: ".625rem",
                    textAlign: "center",
                    color: "rgba(255,255,255,.8)",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,.1)")
                  }
                >
                  Password
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only quick links (hidden on desktop via CSS) */}
        <div
          className="dash-mobile-quicklinks"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: ".75rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            {
              href: "/dashboard/support",
              icon: MessageCircle,
              label: "Support",
              desc: "Get help from our team",
              color: "#7c3aed",
              bg: "#f5f3ff",
            },
          ].map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link
              key={href}
              href={href}
              style={{
                background: "white",
                borderRadius: "1.25rem",
                padding: "1.125rem",
                display: "flex",
                flexDirection: "column",
                gap: ".75rem",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.04)",
                textDecoration: "none",
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
                }}
              >
                <Icon size={20} color={color} strokeWidth={1.75} />
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: ".82rem",
                    color: "#09090b",
                    marginBottom: ".2rem",
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: ".72rem",
                    color: "#a1a1aa",
                    lineHeight: 1.4,
                  }}
                >
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
