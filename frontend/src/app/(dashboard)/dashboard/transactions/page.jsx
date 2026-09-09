"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  RefreshCcw,
  TrendingUp,
  Filter,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

const FILTERS = ["All", "Success", "Failed", "Pending"];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "data", label: "Data" },
  { key: "airtime", label: "Airtime" },
  { key: "cable", label: "Cable" },
  { key: "electricity", label: "Electricity" },
  { key: "exam", label: "Exam" },
  { key: "wallet", label: "Wallet" },
];

function getCategory(s = "") {
  const l = s.toLowerCase();
  if (l.includes("data")) return "data";
  if (l.includes("airtime to cash") || l.includes("atc")) return "atc";
  if (l.includes("airtime")) return "airtime";
  if (l.includes("cable")) return "cable";
  if (l.includes("electric") || l.includes("power") || l.includes("aedc") || l.includes("ekedc") || l.includes("ikedc") || l.includes("phed") || l.includes("ibedc") || l.includes("jed") || l.includes("kaedco") || l.includes("bedc") || l.includes("eedc") || l.includes("abuja")) return "electricity";
  if (l.includes("exam") || l.includes("waec") || l.includes("neco") || l.includes("n abteb") || l.includes("jamb")) return "exam";
  if (l.includes("wallet") || l.includes("fund")) return "wallet";
  return "other";
}

const SVC_ICON_MAP = {
  airtime: { color: "#f97316", bg: "#fff7ed", Icon: Phone },
  data: { color: "#4f46e5", bg: "#eff6ff", Icon: Wifi },
  cable: { color: "#7c3aed", bg: "#f5f3ff", Icon: Tv },
  electricity: { color: "#d97706", bg: "#fffbeb", Icon: Zap },
  exam: { color: "#059669", bg: "#ecfdf5", Icon: GraduationCap },
  default: { color: "#0891b2", bg: "#ecfeff", Icon: RefreshCcw },
};
function getIconMeta(s = "") {
  const l = s.toLowerCase();
  for (const [k, v] of Object.entries(SVC_ICON_MAP))
    if (l.includes(k)) return v;
  return SVC_ICON_MAP.default;
}
function SvcStatus(s) {
  if (s === 1 || s === "success")
    return { cls: "badge-success", label: "Success" };
  if (s === 0 || s === "failed")
    return { cls: "badge-failed", label: "Failed" };
  return { cls: "badge-pending", label: "Pending" };
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PER_PAGE = 20;

  const load = async (pg = 1, f = filter) => {
    setLoading(true);
    try {
      const r = await api.get(
        `/user/transactions?limit=${PER_PAGE}&page=${pg}`,
      );
      const txs = r.data.data?.transactions || [];
      if (pg === 1) setTransactions(txs);
      else setTransactions((prev) => [...prev, ...txs]);
      setHasMore(txs.length === PER_PAGE);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const filterStatus = { All: null, Success: 1, Failed: 0, Pending: 2 };
  const filtered = transactions.filter((tx) => {
    const statusOk =
      filter === "All" || tx.status === filterStatus[filter];
    const catOk = category === "all" || getCategory(tx.servicename) === category;
    return statusOk && catOk;
  });

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
              Transactions
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              All your activity
            </p>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div
        style={{
          padding: "1rem 1.25rem .25rem",
          display: "flex",
          gap: ".5rem",
          overflowX: "auto",
        }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            style={{
              flexShrink: 0,
              padding: ".5rem 1.05rem",
              borderRadius: 99,
              fontSize: ".78rem",
              fontWeight: 700,
              border: category === c.key ? "none" : "1.5px solid #e4e4e7",
              background: category === c.key ? "#0891b2" : "white",
              color: category === c.key ? "white" : "#71717a",
              cursor: "pointer",
              boxShadow:
                category === c.key ? "0 2px 8px rgba(8,145,178,.3)" : "none",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Status chips */}
      <div
        style={{
          padding: ".625rem 1.25rem .5rem",
          display: "flex",
          gap: ".5rem",
          overflowX: "auto",
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0,
              padding: ".45rem 1rem",
              borderRadius: 99,
              fontSize: ".78rem",
              fontWeight: 700,
              border: filter === f ? "none" : "1.5px solid #e4e4e7",
              background: filter === f ? "#4f46e5" : "white",
              color: filter === f ? "white" : "#71717a",
              cursor: "pointer",
              transition: "all .15s",
              boxShadow:
                filter === f ? "0 2px 8px rgba(79,70,229,.35)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 1rem 1.25rem" }}>
        {loading && transactions.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".875rem",
                  padding: ".875rem 1.25rem",
                  borderBottom: i < 5 ? "1px solid #f4f4f5" : "none",
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
                      width: "60%",
                      marginBottom: 6,
                    }}
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
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
              <TrendingUp size={28} color="#a1a1aa" />
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#09090b",
                fontSize: ".9rem",
                marginBottom: ".375rem",
              }}
            >
              No transactions found
            </p>
            <p style={{ color: "#a1a1aa", fontSize: ".8rem" }}>
              Try a different filter
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
            {filtered.map((tx, i) => {
              const { color, bg, Icon } = getIconMeta(
                tx.servicename || tx.service || "",
              );
              const st = SvcStatus(tx.status);
              const isDebit =
                parseFloat(tx.oldbal || 0) > parseFloat(tx.newbal || 0);
              return (
                <Link
                  key={tx.id || i}
                  href={`/dashboard/transactions/${tx.transref || tx.ref}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".875rem",
                    padding: ".875rem 1.25rem",
                    textDecoration: "none",
                    borderBottom:
                      i < filtered.length - 1 ? "1px solid #f4f4f5" : "none",
                    transition: "background .12s",
                    WebkitTapHighlightColor: "transparent",
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
                    <Icon size={18} color={color} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: ".85rem",
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
                          year: "numeric",
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
            })}
            {hasMore && !loading && (
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <button
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    load(next);
                  }}
                  style={{
                    color: "#4f46e5",
                    fontWeight: 700,
                    fontSize: ".82rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
