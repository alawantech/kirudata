"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  MessageCircle,
  MessageSquare,
  CreditCard,
  PhoneCall,
  ChevronRight,
} from "lucide-react";

const SERVICES = [
  {
    label: "Airtime",
    icon: Phone,
    href: "/dashboard/airtime",
    color: "#f97316",
    bg: "#fff7ed",
    desc: "Buy airtime for any network",
  },
  {
    label: "Data Bundle",
    icon: Wifi,
    href: "/dashboard/data",
    color: "#4f46e5",
    bg: "#eff6ff",
    desc: "Buy data at the best rates",
  },
  {
    label: "Cable TV",
    icon: Tv,
    href: "/dashboard/cable",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "DSTV, GOTV, Startimes",
  },
  {
    label: "Electricity",
    icon: Zap,
    href: "/dashboard/electricity",
    color: "#d97706",
    bg: "#fffbeb",
    desc: "Pay PHCN bills instantly",
  },
  {
    label: "Exam Pins",
    icon: GraduationCap,
    href: "/dashboard/exam",
    color: "#059669",
    bg: "#ecfdf5",
    desc: "WAEC, NECO, JAMB scratch cards",
  },
  {
    label: "Data Card",
    icon: CreditCard,
    href: "/dashboard/data-card",
    color: "#7c3aed",
    bg: "#f5f3ff",
    desc: "Scratch card pins",
  },
  {
    label: "Recharge Card",
    icon: PhoneCall,
    href: "/dashboard/recharge-card",
    color: "#16a34a",
    bg: "#f0fdf4",
    desc: "Airtime scratch cards",
  },
  {
    label: "Bulk SMS",
    icon: MessageSquare,
    href: "/dashboard/sms",
    color: "#0891b2",
    bg: "#e0f2fe",
    desc: "Send SMS to any number",
  },
  {
    label: "Support",
    icon: MessageCircle,
    href: "/dashboard/support",
    color: "#db2777",
    bg: "#fdf2f8",
    desc: "Get help & file complaints",
  },
];

export default function ServicesPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.75rem" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-.02em",
              marginBottom: ".25rem",
            }}
          >
            All Services
          </h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".78rem" }}>
            Everything you need in one place
          </p>
        </div>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* List view */}
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}
        >
          {SERVICES.map(({ label, icon: Icon, href, color, bg, desc }, i) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                textDecoration: "none",
                borderBottom:
                  i < SERVICES.length - 1 ? "1px solid #f4f4f5" : "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} color={color} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: ".9rem",
                    color: "#09090b",
                    marginBottom: ".2rem",
                  }}
                >
                  {label}
                </p>
                <p style={{ fontSize: ".75rem", color: "#71717a" }}>{desc}</p>
              </div>
              <ChevronRight size={16} color="#a1a1aa" />
            </Link>
          ))}
        </div>

        {/* Grid for visual */}
        <div style={{ marginTop: "1.25rem" }}>
          <p
            style={{
              fontWeight: 800,
              fontSize: ".85rem",
              color: "#09090b",
              marginBottom: ".875rem",
              letterSpacing: "-.01em",
            }}
          >
            Quick Access
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: ".75rem",
            }}
          >
            {SERVICES.slice(0, 6).map(
              ({ label, icon: Icon, href, color, bg }) => (
                <Link key={href} href={href} className="svc-btn">
                  <div className="svc-icon" style={{ background: bg }}>
                    <Icon size={22} color={color} strokeWidth={1.75} />
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
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
