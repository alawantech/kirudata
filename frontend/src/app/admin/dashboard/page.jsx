"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Shield,
  BarChart3,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import adminApi from "@/lib/adminApi";
import { useAdmin } from "@/context/AdminContext";

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminDashboardPage() {
  const { admin, hasPermission } = useAdmin();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providerBalances, setProviderBalances] = useState([]);
  const [provBalLoading, setProvBalLoading] = useState(true);
  const [profitSummary, setProfitSummary] = useState(null);

  if (!hasPermission("dashboard_view")) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 1rem", opacity: .3 }} />
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Access Denied</h2>
        <p style={{ fontSize: ".85rem" }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  const loadProviderBalances = () => {
    setProvBalLoading(true);
    adminApi
      .get("/admin/data-providers/balances")
      .then((r) => setProviderBalances(r.data.data?.balances || []))
      .catch(() => {})
      .finally(() => setProvBalLoading(false));
  };

  useEffect(() => {
    adminApi
      .get("/admin/stats")
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    loadProviderBalances();

    adminApi
      .get("/admin/profit/summary")
      .then((r) => setProfitSummary(r.data.data))
      .catch(() => {});
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>
        Loading stats...
      </div>
    );
  if (!stats)
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>
        Failed to load stats.
      </div>
    );

  const profitCards = profitSummary
    ? [
        { label: "Today's Profit", value: profitSummary.today?.profit || 0, count: profitSummary.today?.count || 0, color: "#059669" },
        { label: "This Month", value: profitSummary.thisMonth?.profit || 0, count: profitSummary.thisMonth?.count || 0, color: "#2563eb" },
        { label: "This Year", value: profitSummary.thisYear?.profit || 0, count: profitSummary.thisYear?.count || 0, color: "#7c3aed" },
        { label: "All Time Profit", value: profitSummary.allTime?.profit || 0, count: profitSummary.allTime?.count || 0, color: "#0f172a" },
      ]
    : [];

  const maxDayProfit = profitSummary
    ? Math.max(...profitSummary.last7Days.map((d) => d.profit), 1)
    : 1;

  const overviewCards = [
    {
      label: "Total Users",
      value: stats.totalUsers?.toLocaleString() || 0,
      icon: Users,
      color: "#2563eb",
      sub: `${stats.vendorCount || 0} vendors`,
    },
    {
      label: "Total Transactions",
      value: stats.totalTransactions?.toLocaleString() || 0,
      icon: ArrowLeftRight,
      color: "#7c3aed",
      sub: `${stats.successCount || 0} success · ${stats.failedCount || 0} failed`,
    },
    {
      label: "Wallet Balances",
      value: `₦${fmt(stats.totalWalletBalance)}`,
      icon: Wallet,
      color: "#d97706",
      sub: "Total user wallets",
    },
    {
      label: "Open Issues",
      value: stats.openIssues?.toLocaleString() || 0,
      icon: MessageSquare,
      color: "#dc2626",
      sub: "Awaiting reply",
    },
    {
      label: "Pending Transactions",
      value: stats.pendingCount?.toLocaleString() || 0,
      icon: AlertCircle,
      color: "#f59e0b",
      sub: "Needs review",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-.03em" }}>
          Dashboard Overview
        </h1>
        <p style={{ color: "#64748b", fontSize: ".875rem", marginTop: ".25rem" }}>
          Welcome back. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* ── Profit Cards ── */}
      {profitCards.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
              <TrendingUp size={18} color="#059669" />
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Profit Overview</h2>
            </div>
            <Link
              href="/admin/profit"
              style={{
                fontSize: ".8rem",
                fontWeight: 600,
                color: "#2563eb",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: ".25rem",
              }}
            >
              Full Report <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem" }}>
            {profitCards.map(({ label, value, count, color }) => (
              <div
                key={label}
                style={{
                  background: "white",
                  borderRadius: "1rem",
                  padding: "1.25rem 1.5rem",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                }}
              >
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {label}
                </div>
                <div style={{ fontWeight: 900, fontSize: "1.6rem", color, letterSpacing: "-.02em", lineHeight: 1.2, margin: ".35rem 0" }}>
                  ₦{fmt(value)}
                </div>
                <div style={{ fontSize: ".7rem", color: "#94a3b8" }}>
                  {count.toLocaleString()} transactions
                </div>
              </div>
            ))}
          </div>

          {/* ── Last 7 Days Chart ── */}
          {profitSummary?.last7Days?.length > 0 && (
            <div style={{
              marginTop: "1.25rem",
              background: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              border: "1px solid #f1f5f9",
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
                <BarChart3 size={16} color="#64748b" />
                <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#0f172a" }}>Last 7 Days Profit</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: ".5rem", height: 120 }}>
                {profitSummary.last7Days.map((d) => (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".25rem" }}>
                    <span style={{ fontSize: ".6rem", color: "#64748b", fontWeight: 600 }}>
                      {d.profit > 0 ? `₦${d.profit.toLocaleString()}` : "—"}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 48,
                        height: `${Math.max((d.profit / maxDayProfit) * 80, d.profit > 0 ? 4 : 1)}px`,
                        background: d.profit > 0 ? "linear-gradient(to top, #059669, #34d399)" : "#e2e8f0",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "height .3s",
                      }}
                    />
                    <span style={{ fontSize: ".6rem", color: "#94a3b8", fontWeight: 500 }}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Overview Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.25rem" }}>
        {overviewCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              border: "1px solid #f1f5f9",
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: color + "15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: ".75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {label}
              </div>
              <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#0f172a", letterSpacing: "-.02em", lineHeight: 1.2, margin: ".25rem 0" }}>
                {value}
              </div>
              <div style={{ color: "#94a3b8", fontSize: ".75rem" }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Data Provider Wallet Balances ── */}
      {providerBalances.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-.02em" }}>
                Data Provider Wallets
              </h2>
              <p style={{ fontSize: ".75rem", color: "#94a3b8", margin: ".2rem 0 0" }}>
                Live balances from your configured data providers
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem" }}>
            {providerBalances.map((b) => (
              <div
                key={b.id}
                style={{
                  background: "white",
                  borderRadius: "1.25rem",
                  padding: "1.25rem 1.5rem",
                  border: `1.5px solid ${b.error ? "#fecaca" : "#e0f2fe"}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                }}
              >
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".5rem" }}>
                  {b.name}
                  {b.username && (
                    <span style={{ color: "#cbd5e1", marginLeft: ".35rem", textTransform: "none" }}>
                      @{b.username}
                    </span>
                  )}
                </div>
                {b.error ? (
                  <div style={{ color: "#ef4444", fontSize: ".8rem", fontWeight: 600 }}>
                    {b.error}
                  </div>
                ) : (
                  <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#0284c7", letterSpacing: "-.02em" }}>
                    ₦{fmt(b.balance)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
