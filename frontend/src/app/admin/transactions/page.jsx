"use client";
import { Fragment, useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const STATUS_OPTS = [
  { label: "All Status", value: "" },
  { label: "Success", value: "1" },
  { label: "Failed", value: "0" },
  { label: "Pending", value: "2" },
];
const SERVICE_OPTS = [
  { label: "All Services", value: "" },
  { label: "Wallet Funding", value: "Wallet" },
  { label: "Data", value: "Data" },
  { label: "Airtime", value: "Airtime" },
  { label: "Cable TV", value: "Cable" },
  { label: "Electricity", value: "Electricity" },
  { label: "Exam Pin", value: "Exam" },
  { label: "Bulk SMS", value: "SMS" },
  { label: "Data Card", value: "Data Card" },
  { label: "Recharge Card", value: "Recharge" },
];
const STATUS_LABEL = { 1: "Success", 0: "Failed", 2: "Pending" };
const STATUS_STYLE = {
  1: { bg: "#dcfce7", color: "#15803d" },
  0: { bg: "#fee2e2", color: "#dc2626" },
  2: { bg: "#fef9c3", color: "#a16207" },
};

export default function AdminTransactionsPage() {
  const [txns, setTxns] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    adminApi
      .get(`/admin/transactions?page=${page}&search=${search}&status=${status}&service=${service}`)
      .then((r) => {
        setTxns(r.data.data?.transactions || []);
        setMeta(r.data.data?.meta || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, status, service]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const changeStatus = async (id, newStatus) => {
    try {
      await adminApi.put(`/admin/transactions/${id}`, { status: newStatus });
      toast.success("Status updated");
      fetch();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <RequirePermission permission="transactions_view">
    <div>
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-.03em",
          }}
        >
          Transactions ({meta.total || 0})
        </h1>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              placeholder="Search ref, user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                paddingLeft: "2.125rem",
                padding: ".625rem .875rem .625rem 2.125rem",
                border: "1px solid #e2e8f0",
                borderRadius: ".75rem",
                background: "white",
                fontFamily: "inherit",
                fontSize: ".85rem",
                width: 200,
                outline: "none",
              }}
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{
              padding: ".625rem .875rem",
              border: "1px solid #e2e8f0",
              borderRadius: ".75rem",
              background: "white",
              fontFamily: "inherit",
              fontSize: ".85rem",
              outline: "none",
            }}
          >
            <option value="">All Status</option>
            <option value="1">Success</option>
            <option value="0">Failed</option>
            <option value="2">Pending</option>
          </select>
          <select
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setPage(1);
            }}
            style={{
              padding: ".625rem .875rem",
              border: "1px solid #e2e8f0",
              borderRadius: ".75rem",
              background: "white",
              fontFamily: "inherit",
              fontSize: ".85rem",
              outline: "none",
            }}
          >
            {SERVICE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "1.25rem",
          boxShadow: "0 2px 8px rgba(0,0,0,.05)",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: ".85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {[
                  "Reference",
                  "User",
                  "Service",
                  "Amount",
                  "Date",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: ".875rem 1.25rem",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      fontSize: ".75rem",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : txns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                txns.map((t) => {
                  const st = STATUS_STYLE[t.status] || {
                    bg: "#f1f5f9",
                    color: "#64748b",
                  };
                  const isExpanded = expandedId === t.id;
                  const hasDetails =
                    t.servicedesc || t.apiResponseLog || t.apiResponse;
                  return (
                    <Fragment key={t.id}>
                      <tr
                        onClick={() =>
                          hasDetails && setExpandedId(isExpanded ? null : t.id)
                        }
                        style={{
                          borderBottom: isExpanded
                            ? "none"
                            : "1px solid #f8fafc",
                          cursor: hasDetails ? "pointer" : "default",
                          background: isExpanded ? "#f8fafc" : "white",
                        }}
                      >
                        <td
                          style={{
                            padding: ".875rem 1.25rem",
                            fontFamily: "monospace",
                            fontSize: ".8rem",
                            color: "#64748b",
                          }}
                        >
                          {t.transref
                            ? t.transref.length > 20
                              ? t.transref.substring(0, 20) + "..."
                              : t.transref
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: ".875rem 1.25rem",
                            color: "#0f172a",
                            fontWeight: 600,
                          }}
                        >
                          {t.user?.firstname} {t.user?.lastname}
                        </td>
                        <td
                          style={{
                            padding: ".875rem 1.25rem",
                            color: "#64748b",
                            textTransform: "capitalize",
                          }}
                        >
                          {t.servicename}
                        </td>
                        <td
                          style={{
                            padding: ".875rem 1.25rem",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          ₦
                          {parseFloat(t.amount).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: ".875rem 1.25rem",
                            color: "#94a3b8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.date
                            ? new Date(t.date).toLocaleDateString("en-NG")
                            : "—"}
                        </td>
                        <td style={{ padding: ".875rem 1.25rem" }}>
                          <span
                            style={{
                              fontSize: ".7rem",
                              fontWeight: 600,
                              padding: ".2rem .625rem",
                              borderRadius: 99,
                              background: st.bg,
                              color: st.color,
                              textTransform: "capitalize",
                            }}
                          >
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </td>
                        <td style={{ padding: ".875rem 1.25rem" }}>
                          <select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              changeStatus(t.id, parseInt(e.target.value))
                            }
                            style={{
                              padding: ".3rem .5rem",
                              border: "1px solid #e2e8f0",
                              borderRadius: ".5rem",
                              fontSize: ".8rem",
                              fontFamily: "inherit",
                              outline: "none",
                              cursor: "pointer",
                            }}
                          >
                            <option value="2">Pending</option>
                            <option value="1">Success</option>
                            <option value="0">Failed</option>
                          </select>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${t.id}-detail`}
                          style={{
                            borderBottom: "1px solid #f8fafc",
                            background: "#f8fafc",
                          }}
                        >
                          <td
                            colSpan={7}
                            style={{
                              padding: ".5rem 1.25rem 1rem",
                              fontSize: ".8rem",
                            }}
                          >
                            {t.servicedesc && (
                              <div style={{ marginBottom: ".4rem" }}>
                                <span
                                  style={{ fontWeight: 700, color: "#475569" }}
                                >
                                  Description:{" "}
                                </span>
                                <span style={{ color: "#0f172a" }}>
                                  {t.servicedesc}
                                </span>
                              </div>
                            )}
                            {t.apiResponseLog && (
                              <div style={{ marginBottom: ".4rem" }}>
                                <span
                                  style={{ fontWeight: 700, color: "#dc2626" }}
                                >
                                  API Error:{" "}
                                </span>
                                <code
                                  style={{
                                    color: "#dc2626",
                                    fontFamily: "monospace",
                                    fontSize: ".78rem",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {t.apiResponseLog}
                                </code>
                              </div>
                            )}
                            {t.apiResponse && (
                              <div>
                                <span
                                  style={{ fontWeight: 700, color: "#475569" }}
                                >
                                  API Response:{" "}
                                </span>
                                <code
                                  style={{
                                    color: "#64748b",
                                    fontFamily: "monospace",
                                    fontSize: ".75rem",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {t.apiResponse}
                                </code>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {meta.pages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".875rem",
              padding: "1.25rem",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                width: 34,
                height: 34,
                border: "1px solid #e2e8f0",
                background: "white",
                borderRadius: ".625rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{ fontSize: ".875rem", color: "#64748b", fontWeight: 600 }}
            >
              Page {page} of {meta.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              style={{
                width: 34,
                height: 34,
                border: "1px solid #e2e8f0",
                background: "white",
                borderRadius: ".625rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
    </RequirePermission>
  );
}
