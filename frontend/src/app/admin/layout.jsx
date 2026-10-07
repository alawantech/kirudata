"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import AppLogo from "@/components/AppLogo";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Database,
  Bell,
  Settings,
  ShieldOff,
  MessageSquare,
  Mail,
  Key,
  LogOut,
  Menu,
  X,
  Zap,
  TrendingUp,
  Link2,
  Server,
  Sliders,
  Wifi,
  Percent,
  CreditCard,
  Smartphone,
  Tv,
  Zap as ZapIcon,
  GraduationCap,
  MonitorSmartphone,
  FileText,
  BarChart3,
} from "lucide-react";

  const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard_view" },
  { href: "/admin/users", label: "Users", icon: Users, perm: "users_view" },
  { href: "/admin/upgrade-requests", label: "Upgrade Requests", icon: TrendingUp, perm: "upgrade_requests_manage" },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight, perm: "transactions_view" },
  { href: "/admin/profit", label: "Profit Report", icon: BarChart3, perm: "dashboard_view" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, perm: "notifications_manage" },
  { href: "/admin/issues", label: "Support Issues", icon: MessageSquare, perm: "issues_manage" },
  { href: "/admin/messages", label: "Contact Messages", icon: Mail, perm: "messages_manage" },
  { label: "Configurations", icon: Sliders, section: true },
  { href: "/admin/networks", label: "Network Settings", icon: Wifi, perm: "networks_manage" },
  { href: "/admin/airtime-discounts", label: "Airtime Discounts", icon: Percent, perm: "airtime_discounts_manage" },
  { href: "/admin/provider-data-plans", label: "Data Plans", icon: Database, perm: "data_plans_manage" },
  { href: "/admin/data-card-plans", label: "Data Card Plans", icon: CreditCard, perm: "data_card_plans_manage" },
  { href: "/admin/recharge-card-plans", label: "Recharge Card Plans", icon: Smartphone, perm: "recharge_card_plans_manage" },
  { href: "/admin/cable-plans", label: "Cable TV Plans", icon: Tv, perm: "cable_plans_manage" },
  { href: "/admin/electricity-providers", label: "Electricity Providers", icon: ZapIcon, perm: "electricity_manage" },
  { href: "/admin/exam-providers", label: "Exam Providers", icon: GraduationCap, perm: "exam_providers_manage" },
  { href: "/admin/airtime-to-cash", label: "Airtime to Cash", icon: ArrowLeftRight, perm: "airtime_to_cash_manage" },
  { href: "/admin/api-links", label: "API Providers", icon: Link2, perm: "api_links_manage" },
  { href: "/admin/api-configs", label: "API Config", icon: Key, perm: "api_configs_manage" },
  { href: "/admin/blacklist", label: "Blacklist", icon: ShieldOff, perm: "blacklist_manage" },
  { href: "/admin/admins", label: "Manage Admins", icon: Users, perm: "admin_manage", superOnly: true },
  { href: "/admin/sessions", label: "Active Sessions", icon: MonitorSmartphone, perm: null },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText, perm: null },
  { href: "/admin/change-password", label: "Change Password", icon: Key, perm: null },
  { href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings_manage" },
];

function AdminLayoutInner({ children }) {
  const { admin, loading, adminLogout, hasPermission } = useAdmin();
  const settings = useSiteSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  // Redirect to login if not authenticated (must be in useEffect, not render)
  useEffect(() => {
    if (!loading && !admin && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [admin, loading, pathname, router]);

  // If the drawer was left open and the viewport reaches desktop width,
  // close it so the overlay never lingers over the content and blocks scrolling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(255,255,255,.15)",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!loading && !admin && pathname !== "/admin/login") {
    return null; // redirect is handled by useEffect above
  }

  if (pathname === "/admin/login") return children;

  const handleLogout = async () => {
    await adminLogout();
    router.replace("/admin/login");
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        background: "#f1f5f9",
      }}
    >
      {/* Sidebar overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          onWheel={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        onWheel={(e) => {
          const nav = navRef.current;
          if (!nav) return;
          const target = e.target;
          if (target instanceof Element && nav.contains(target)) return;
          const dy =
            e.deltaMode === 1
              ? e.deltaY * 24
              : e.deltaMode === 2
                ? e.deltaY * nav.clientHeight
                : e.deltaY;
          nav.scrollTop += dy;
        }}
        style={{
          width: 260,
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.5rem 1.25rem 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <AppLogo
              showBrandName={false}
              logoHeight={64}
            />
          </div>
        </div>
        <nav
          ref={navRef}
          style={{
            flex: 1,
            minHeight: 0,
            padding: "1rem .75rem",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {(() => {
            const CONFIG_PERMS = [
              "networks_manage", "airtime_discounts_manage", "data_plans_manage",
              "data_card_plans_manage", "recharge_card_plans_manage", "cable_plans_manage",
              "electricity_manage", "exam_providers_manage", "airtime_to_cash_manage",
              "api_links_manage", "api_configs_manage", "blacklist_manage", "settings_manage",
            ];
            const hasConfigAccess = admin?.role === "super_admin" || CONFIG_PERMS.some((p) => hasPermission(p));
            return LINKS.filter(({ superOnly, perm, section }) => {
              if (superOnly && admin?.role !== "super_admin") return false;
              if (section && !hasConfigAccess) return false;
              if (perm && !hasPermission(perm)) return false;
              return true;
            });
          })().map(({ href, label, icon: Icon, section }) => {
            if (section) {
              return (
                <div key={label} style={{
                  padding: ".5rem 1rem .25rem",
                  fontSize: ".7rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,.3)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginTop: ".5rem",
                }}>
                  {label}
                </div>
              );
            }
            const active =
              pathname === href ||
              (href !== "/admin/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".875rem",
                  padding: ".75rem 1rem",
                  borderRadius: ".875rem",
                  marginBottom: ".25rem",
                  textDecoration: "none",
                  background: active ? "rgba(37,99,235,.25)" : "transparent",
                  color: active ? "#60a5fa" : "rgba(255,255,255,.6)",
                  fontWeight: active ? 600 : 400,
                  fontSize: ".875rem",
                  transition: "all .15s",
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div
          style={{
            padding: "1rem .75rem",
            borderTop: "1px solid rgba(255,255,255,.06)",
          }}
        >
          <div
            style={{
              padding: ".75rem 1rem",
              borderRadius: ".875rem",
              background: "rgba(255,255,255,.04)",
              marginBottom: ".5rem",
            }}
          >
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: ".7rem" }}>
              Logged in as
            </div>
            <div style={{ color: "white", fontWeight: 600, fontSize: ".85rem" }}>
              {admin?.name || "Admin"}
            </div>
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: ".7rem" }}>
              {admin?.role === "super_admin" ? "Super Admin" : "Admin"}
            </div>
          </div>
          <div style={{ padding: "0 1rem .625rem", fontSize: ".7rem", color: "rgba(255,255,255,.22)", lineHeight: 1.5 }}>
            Developed by{" "}
            <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(96,165,250,.45)", textDecoration: "none", fontWeight: 600 }}>
              ZEDROTECH
            </a>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              padding: ".75rem 1rem",
              borderRadius: ".875rem",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,.45)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: ".875rem",
              transition: "all .15s",
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div
        style={{
          flex: 1,
          marginLeft: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile top bar */}
        <header
          style={{
            height: 60,
            background: "white",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            padding: "0 1.25rem",
            gap: "1rem",
            boxShadow: "0 1px 3px rgba(0,0,0,.05)",
          }}
        >
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Menu size={22} color="#0f172a" />
          </button>
          <AppLogo showBrandName={true} logoHeight={36} dark={true} />
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
            }}
          >
            <Zap size={15} color="#2563eb" />
            <span style={{ fontSize: ".75rem", color: "#64748b" }}>v2</span>
          </div>
        </header>
        <main
          style={{
            flex: 1,
            minHeight: 0,
            padding: "1.5rem",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </main>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @media(min-width:1024px){aside{transform:translateX(0)!important} header{display:none!important} main{margin-left:260px}}`}</style>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <Toaster position="top-right" />
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
