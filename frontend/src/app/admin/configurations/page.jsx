"use client";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import {
  Globe,
  Phone,
  Wifi,
  Plug,
  Link2,
  Database,
  Settings,
  CreditCard,
  ShieldOff,
  Mail,
  Shield,
} from "lucide-react";

const CARDS = [
  {
    icon: Globe,
    color: "#2563eb",
    title: "Site Settings",
    desc: "Site name, logo, contact details, referral bonuses, appearance",
    href: "/admin/settings",
  },
  {
    icon: Wifi,
    color: "#f59e0b",
    title: "Network Settings",
    desc: "Enable / disable services per network. Set Network IDs (SME ID, VTU ID, etc.)",
    href: "/admin/networks",
    badge: "Required first!",
    badgeColor: "#dc2626",
  },
  {
    icon: Link2,
    color: "#7c3aed",
    title: "API Providers (URLs)",
    desc: "Register your provider URLs here first (N3TData, VTPass, etc.) before assigning them below",
    href: "/admin/api-links",
    badge: "Step 1",
    badgeColor: "#7c3aed",
  },
  {
    icon: Phone,
    color: "#f97316",
    title: "Airtime API",
    desc: "Set API key + select provider for MTN/GLO/Airtel/9Mobile – VTU and Share & Sell",
    href: "/admin/api-configs?tab=Airtime",
    badge: "Step 2",
    badgeColor: "#f97316",
  },
  {
    icon: Wifi,
    color: "#16a34a",
    title: "Data API",
    desc: "Set API key + select provider for MTN/GLO/Airtel/9Mobile – SME, Gifting, Cooperate Gifting",
    href: "/admin/api-configs?tab=Data",
    badge: "Step 2",
    badgeColor: "#16a34a",
  },
  {
    icon: Plug,
    color: "#ea580c",
    title: "Other APIs (Cable / Electricity / Exam)",
    desc: "Set API keys and provider URLs for Cable TV, Electricity meters, and Exam result checkers",
    href: "/admin/api-configs?tab=Services",
    badge: "Step 2",
    badgeColor: "#ea580c",
  },
  {
    icon: Database,
    color: "#2563eb",
    title: "Provider Data Plans",
    desc: "Create and manage data plans per provider with separate groups",
    href: "/admin/provider-data-plans",
  },
  {
    icon: Database,
    color: "#0891b2",
    title: "Classic Data Plans",
    desc: "Manage the original data plans table (used as fallback when no provider is configured)",
    href: "/admin/data-plans",
  },
  {
    icon: CreditCard,
    color: "#059669",
    title: "Payment Gateways",
    desc: "Monnify, Paystack, Payvessel API keys and configuration",
    href: "/admin/api-configs?tab=Payment",
  },
  {
    icon: Mail,
    color: "#0284c7",
    title: "Messaging (SMS / Email)",
    desc: "SMS provider credentials and SMTP email settings",
    href: "/admin/api-configs?tab=Messaging",
  },
  {
    icon: ShieldOff,
    color: "#dc2626",
    title: "Blacklist / Security",
    desc: "Block phone numbers from using the platform",
    href: "/admin/blacklist",
  },
];

export default function ConfigurationsPage() {
  const { admin, hasPermission } = useAdmin();

  const CONFIG_PERMS = [
    "networks_manage", "airtime_discounts_manage", "data_plans_manage",
    "data_card_plans_manage", "recharge_card_plans_manage", "cable_plans_manage",
    "electricity_manage", "exam_providers_manage", "airtime_to_cash_manage",
    "api_links_manage", "api_configs_manage", "blacklist_manage", "settings_manage",
  ];
  const canView = admin?.role === "super_admin" || CONFIG_PERMS.some((p) => hasPermission(p));

  if (!canView) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 1rem", opacity: .3 }} />
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Access Denied</h2>
        <p style={{ fontSize: ".85rem" }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-.03em",
            marginBottom: 4,
          }}
        >
          Configurations
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Manage all settings, API keys, network IDs, data plans, and provider
          configurations from here.
        </p>
      </div>

      {/* Setup guide */}
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 10,
          padding: "14px 18px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: "#1e40af",
            marginBottom: 6,
            fontSize: 14,
          }}
        >
          Quick Setup Guide
        </div>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            color: "#1e40af",
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>Network Settings</strong> — Enable services and set Network
            IDs for each network
          </li>
          <li>
            <strong>API Providers (URLs)</strong> — Register provider URLs (e.g.
            N3TData base URL)
          </li>
          <li>
            <strong>Airtime API / Data API / Other APIs</strong> — Set your API
            key and select the provider URL per service
          </li>
          <li>
            <strong>Data Plans</strong> — Add your data plans with their Plan ID
            and prices
          </li>
        </ol>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  transition: "box-shadow .15s, transform .15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  height: "100%",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${card.color}40, 0 4px 16px rgba(0,0,0,.08)`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: `${card.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} color={card.color} />
                  </div>
                  {card.badge && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${card.badgeColor}18`,
                        color: card.badgeColor,
                      }}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}
                  >
                    {card.desc}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    fontSize: 13,
                    color: card.color,
                    fontWeight: 700,
                  }}
                >
                  Open →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
