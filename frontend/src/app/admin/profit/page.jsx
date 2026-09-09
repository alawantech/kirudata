"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import adminApi from "@/lib/adminApi";
import { useAdmin } from "@/context/AdminContext";

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SERVICE_COLORS = {
  "Data": "#2563eb",
  "Airtime": "#7c3aed",
  "Cable TV": "#0891b2",
  "Electricity": "#d97706",
  "Exam Pins": "#059669",
  "Bulk SMS": "#ec4899",
  "Data Card": "#6366f1",
  "Recharge Card": "#f43f5e",
  "Airtime to Cash": "#8b5cf6",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getThisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getThisYear() {
  return String(new Date().getFullYear());
}

function shiftPeriod(period, current, delta) {
  const d = new Date(period === "daily" ? current + "T00:00:00" : period === "monthly" ? current + "-01" : current + "-01-01");
  if (period === "daily") d.setDate(d.getDate() + delta);
  else if (period === "monthly") d.setMonth(d.getMonth() + delta);
  else d.setFullYear(d.getFullYear() + delta);

  if (period === "daily") return d.toISOString().split("T")[0];
  if (period === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return String(d.getFullYear());
}

function formatPeriodLabel(period, value) {
  if (period === "daily") {
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  if (period === "monthly") {
    const [y, m] = value.split("-");
    const d = new Date(y, parseInt(m) - 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return value;
}

export default function ProfitReportPage() {
  const { hasPermission } = useAdmin();
  const [period, setPeriod] = useState("monthly");
  const [dateValue, setDateValue] = useState(getThisMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { period };
    if (period === "daily") params.date = dateValue;
    else if (period === "monthly") params.month = dateValue;
    else params.year = dateValue;

    adminApi
      .get("/admin/profit/report", { params })
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, dateValue]);

  useEffect(() => {
    if (period === "daily") setDateValue(getToday());
    else if (period === "monthly") setDateValue(getThisMonth());
    else setDateValue(getThisYear());
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!hasPermission("dashboard_view")) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 1rem", opacity: .3 }} />
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Access Denied</h2>
        <p style={{ fontSize: ".85rem" }}>You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const maxChartProfit = data?.chart?.length
    ? Math.max(...data.chart.map((c) => c.profit), 1)
    : 1;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-.03em" }}>
              Profit Report
            </h1>
            <p style={{ color: "#64748b", fontSize: ".875rem", marginTop: ".25rem" }}>
              Track revenue, cost, and profit across all services.
            </p>
          </div>
        </div>
      </div>

      {/* ── Period Tabs + Date Nav ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: ".5rem" }}>
          {["daily", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: ".5rem 1.25rem",
                borderRadius: ".5rem",
                border: "none",
                fontSize: ".8rem",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
                background: period === p ? "#0f172a" : "#f1f5f9",
                color: period === p ? "white" : "#64748b",
                transition: "all .15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <button
            onClick={() => setDateValue(shiftPeriod(period, dateValue, -1))}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
              background: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={16} color="#64748b" />
          </button>
          <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#0f172a", minWidth: 180, textAlign: "center" }}>
            {formatPeriodLabel(period, dateValue)}
          </span>
          <button
            onClick={() => setDateValue(shiftPeriod(period, dateValue, 1))}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
              background: "white", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight size={16} color="#64748b" />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>Loading report...</div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>Failed to load report.</div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Revenue", value: data.summary.totalRevenue, icon: DollarSign, color: "#2563eb", sub: "What users paid" },
              { label: "Total Cost", value: data.summary.totalCost, icon: TrendingDown, color: "#d97706", sub: "What we paid providers" },
              { label: "Total Profit", value: data.summary.totalProfit, icon: TrendingUp, color: "#059669", sub: `${data.summary.margin}% margin` },
              { label: "Transactions", value: data.summary.transactionCount, icon: BarChart3, color: "#7c3aed", sub: `₦${fmt(data.summary.avgProfitPerTx)} avg/tx`, noNaira: true },
            ].map(({ label, value, icon: Icon, color, sub, noNaira }) => (
              <div key={label} style={{
                background: "white", borderRadius: "1rem", padding: "1.25rem 1.5rem",
                border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                  <Icon size={16} color={color} />
                  <span style={{ fontSize: ".7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: "1.5rem", color, letterSpacing: "-.02em" }}>
                  {noNaira ? value.toLocaleString() : `₦${fmt(value)}`}
                </div>
                <div style={{ fontSize: ".7rem", color: "#94a3b8", marginTop: ".2rem" }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* ── Chart ── */}
          {data.chart.length > 0 && (
            <div style={{
              background: "white", borderRadius: "1rem", padding: "1.5rem",
              border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              marginBottom: "1.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
                <BarChart3 size={16} color="#64748b" />
                <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#0f172a" }}>
                  Profit by {period === "daily" ? "Hour" : period === "monthly" ? "Day" : "Month"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: period === "yearly" ? "1rem" : ".25rem", height: 160, overflowX: "auto" }}>
                {data.chart.map((c) => (
                  <div key={c.label} style={{ flex: "1 1 0", minWidth: period === "yearly" ? 60 : 30, display: "flex", flexDirection: "column", alignItems: "center", gap: ".25rem" }}>
                    <span style={{ fontSize: ".55rem", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {c.profit > 0 ? `₦${c.profit.toLocaleString()}` : ""}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: period === "yearly" ? 48 : 24,
                        height: `${Math.max((c.profit / maxChartProfit) * 120, c.profit > 0 ? 4 : 1)}px`,
                        background: c.profit > 0 ? "linear-gradient(to top, #059669, #34d399)" : "#e2e8f0",
                        borderRadius: "4px 4px 1px 1px",
                        transition: "height .3s",
                      }}
                    />
                    <span style={{ fontSize: ".5rem", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Service Breakdown Table ── */}
          {data.byService.length > 0 && (
            <div style={{
              background: "white", borderRadius: "1rem",
              border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: ".95rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Profit by Service</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {["Service", "Transactions", "Cost", "Revenue", "Profit", "Margin"].map((h) => (
                        <th key={h} style={{
                          padding: ".75rem 1.25rem", textAlign: h === "Service" ? "left" : "right",
                          fontSize: ".65rem", fontWeight: 700, color: "#94a3b8",
                          textTransform: "uppercase", letterSpacing: ".05em",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.byService.map((s) => (
                      <tr key={s.service} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: ".75rem 1.25rem", fontWeight: 600, color: "#0f172a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: SERVICE_COLORS[s.service] || "#94a3b8",
                            }} />
                            {s.service}
                          </div>
                        </td>
                        <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#64748b" }}>{s.count}</td>
                        <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#d97706" }}>₦{fmt(s.cost)}</td>
                        <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#2563eb" }}>₦{fmt(s.revenue)}</td>
                        <td style={{ padding: ".75rem 1.25rem", textAlign: "right", fontWeight: 700, color: "#059669" }}>₦{fmt(s.profit)}</td>
                        <td style={{ padding: ".75rem 1.25rem", textAlign: "right" }}>
                          <span style={{
                            padding: ".15rem .5rem", borderRadius: "999px",
                            fontSize: ".7rem", fontWeight: 700,
                            background: s.margin >= 10 ? "#ecfdf5" : s.margin >= 5 ? "#fefce8" : "#fef2f2",
                            color: s.margin >= 10 ? "#059669" : s.margin >= 5 ? "#d97706" : "#dc2626",
                          }}>
                            {s.margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                      <td style={{ padding: ".75rem 1.25rem", color: "#0f172a" }}>TOTAL</td>
                      <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#0f172a" }}>{data.summary.transactionCount}</td>
                      <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#d97706" }}>₦{fmt(data.summary.totalCost)}</td>
                      <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#2563eb" }}>₦{fmt(data.summary.totalRevenue)}</td>
                      <td style={{ padding: ".75rem 1.25rem", textAlign: "right", color: "#059669" }}>₦{fmt(data.summary.totalProfit)}</td>
                      <td style={{ padding: ".75rem 1.25rem", textAlign: "right" }}>
                        <span style={{
                          padding: ".15rem .5rem", borderRadius: "999px",
                          fontSize: ".7rem", fontWeight: 700,
                          background: data.summary.margin >= 10 ? "#ecfdf5" : data.summary.margin >= 5 ? "#fefce8" : "#fef2f2",
                          color: data.summary.margin >= 10 ? "#059669" : data.summary.margin >= 5 ? "#d97706" : "#dc2626",
                        }}>
                          {data.summary.margin}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {data.byService.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", background: "white", borderRadius: "1rem", border: "1px solid #f1f5f9" }}>
              No successful transactions found for this period.
            </div>
          )}
        </>
      )}
    </div>
  );
}
