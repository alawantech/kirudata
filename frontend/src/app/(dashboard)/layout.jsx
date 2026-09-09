"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Clock,
  LayoutGrid,
  User2,
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  Wallet,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CreditCard,
  Ticket,
  MessageSquare,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import AppLogo from "@/components/AppLogo";
import { Toaster } from "react-hot-toast";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/transactions", icon: Clock, label: "History" },
  { href: "/dashboard/services", icon: LayoutGrid, label: "Services" },
  { href: "/dashboard/profile", icon: User2, label: "Profile" },
];

const SIDEBAR_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "Fund Wallet", href: "/dashboard/fund-wallet", icon: Wallet },
  { label: "Airtime", href: "/dashboard/airtime", icon: Phone },
  { label: "Data", href: "/dashboard/data", icon: Wifi },
  { label: "Cable TV", href: "/dashboard/cable", icon: Tv },
  { label: "Electricity", href: "/dashboard/electricity", icon: Zap },
  { label: "Exam Pins", href: "/dashboard/exam", icon: GraduationCap },
  { label: "Data Card Pins", href: "/dashboard/data-card", icon: CreditCard },
  { label: "Recharge Card Pins", href: "/dashboard/recharge-card", icon: Ticket },
  { label: "Bulk SMS", href: "/dashboard/sms", icon: MessageSquare },
  { label: "Services", href: "/dashboard/services", icon: LayoutGrid },
  { label: "Transactions", href: "/dashboard/transactions", icon: Clock },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Referrals", href: "/dashboard/referrals", icon: Users },
  { label: "Profile", href: "/dashboard/profile", icon: User2 },
];

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const settings = useSiteSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#312e81,#4f46e5,#06b6d4)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(255,255,255,.25)",
            borderTopColor: "white",
            borderRadius: "50%",
          }}
          className="spinner"
        />
        <p
          style={{
            color: "rgba(255,255,255,.6)",
            fontSize: ".8rem",
            marginTop: "1rem",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Loading...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem 1.25rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <AppLogo showBrandName={false} logoHeight={64} />
        </Link>
      </div>

      {/* User pill */}
      <div
        style={{
          padding: ".875rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "white",
              fontSize: ".95rem",
              flexShrink: 0,
            }}
          >
            {(user?.firstname || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: ".875rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.firstname} {user?.lastname}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,.45)",
                fontSize: ".75rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: ".75rem .75rem" }}>
        {SIDEBAR_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".75rem",
                padding: ".625rem .875rem",
                borderRadius: ".75rem",
                color: active ? "#a5b4fc" : "rgba(255,255,255,.55)",
                background: active ? "rgba(99,102,241,.18)" : "transparent",
                fontWeight: active ? 700 : 500,
                fontSize: ".875rem",
                textDecoration: "none",
                marginBottom: ".125rem",
                transition: "background .15s, color .15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,.07)";
                  e.currentTarget.style.color = "#e2e8f0";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,.55)";
                }
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        style={{
          padding: ".75rem .75rem 1.5rem",
          borderTop: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div style={{ padding: "0 .875rem .625rem", fontSize: ".72rem", color: "rgba(255,255,255,.25)", lineHeight: 1.5 }}>
          Developed by{" "}
          <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(165,180,252,.5)", textDecoration: "none", fontWeight: 600 }}>
            ZEDROTECH
          </a>
        </div>
        <button
          onClick={() => {
            logout?.();
            router.replace("/login");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".75rem",
            padding: ".625rem .875rem",
            borderRadius: ".75rem",
            color: "rgba(255,255,255,.45)",
            background: "transparent",
            border: "none",
            width: "100%",
            cursor: "pointer",
            fontSize: ".875rem",
            fontWeight: 500,
            fontFamily: "inherit",
            transition: "background .15s, color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,.15)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,.45)";
          }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="dash-root">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: ".875rem",
            borderRadius: ".875rem",
            fontWeight: 500,
          },
          success: { iconTheme: { primary: "#4f46e5", secondary: "white" } },
        }}
      />

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="dash-sidebar">
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`dash-sidebar-mobile ${sidebarOpen ? "open" : ""}`}>
        <SidebarContent />
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="dash-content">
        {/* Mobile top bar */}
        <div className="dash-mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: ".25rem",
              display: "flex",
              color: "white",
            }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppLogo showBrandName={false} logoHeight={38} dark={false} />
          </div>
          <Link
            href="/dashboard/notifications"
            style={{ color: "white", display: "flex" }}
          >
            <Bell size={20} />
          </Link>
        </div>

        <main className="dash-main">{children}</main>

        {/* ── BOTTOM NAV (mobile only) ── */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <div className="nav-icon-wrap">
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {settings?.whatsapp && (
        <a
          href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          style={{
            position: "fixed",
            right: "1.25rem",
            bottom: "4.5rem",
            zIndex: 120,
            width: 52,
            height: 52,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
            border: "1px solid rgba(255,255,255,0.16)",
            transition: "transform .2s, box-shadow .2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(34,197,94,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,0.35)"; }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
