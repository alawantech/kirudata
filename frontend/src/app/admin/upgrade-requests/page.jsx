"use client";
import { useEffect, useState, useCallback } from "react";
import { Check, X, Clock } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const STATUS_MAP = {
  0: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
  1: { label: "Approved", color: "#16a34a", bg: "#dcfce7" },
  2: { label: "Rejected", color: "#dc2626", bg: "#fee2e2" },
};

export default function UpgradeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("0");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetchRequests = useCallback(() => {
    setLoading(true);
    adminApi
      .get(`/admin/upgrade-requests?status=${filter}`)
      .then((r) => setRequests(r.data.data?.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approve = async (id) => {
    if (!confirm("Approve this upgrade request?")) return;
    try {
      await adminApi.post(`/admin/upgrade-requests/${id}/approve`);
      toast.success("Upgrade approved");
      fetchRequests();
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Failed");
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    try {
      await adminApi.post(`/admin/upgrade-requests/${rejectModal}/reject`, {
        note: rejectNote,
      });
      toast.success("Upgrade rejected");
      setRejectModal(null);
      setRejectNote("");
      fetchRequests();
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Failed");
    }
  };

  return (
    <RequirePermission permission="upgrade_requests_manage">
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
          Vendor Upgrade Requests
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
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
          <option value="0">Pending</option>
          <option value="1">Approved</option>
          <option value="2">Rejected</option>
          <option value="">All</option>
        </select>
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
                  "Name",
                  "Email",
                  "Phone",
                  "Status",
                  "Requested",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: ".875rem 1.25rem",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#64748b",
                      fontSize: ".75rem",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      whiteSpace: "nowrap",
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
                    colSpan={6}
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const st = STATUS_MAP[r.status] || STATUS_MAP[0];
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid #f8fafc" }}
                    >
                      <td
                        style={{
                          padding: ".875rem 1.25rem",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {r.user?.firstname} {r.user?.lastname}
                      </td>
                      <td
                        style={{ padding: ".875rem 1.25rem", color: "#64748b" }}
                      >
                        {r.user?.email}
                      </td>
                      <td
                        style={{ padding: ".875rem 1.25rem", color: "#64748b" }}
                      >
                        {r.user?.phone}
                      </td>
                      <td style={{ padding: ".875rem 1.25rem" }}>
                        <span
                          style={{
                            fontSize: ".75rem",
                            fontWeight: 600,
                            padding: ".2rem .6rem",
                            borderRadius: 99,
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: ".875rem 1.25rem",
                          color: "#64748b",
                          fontSize: ".8rem",
                        }}
                      >
                        {new Date(r.createdAt).toLocaleDateString("en-NG")}
                      </td>
                      <td style={{ padding: ".875rem 1.25rem" }}>
                        {r.status === 0 ? (
                          <div style={{ display: "flex", gap: ".5rem" }}>
                            <button
                              onClick={() => approve(r.id)}
                              title="Approve"
                              style={{
                                width: 30,
                                height: 30,
                                border: "1px solid #bbf7d0",
                                background: "#f0fdf4",
                                borderRadius: ".5rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={14} color="#16a34a" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectModal(r.id);
                                setRejectNote("");
                              }}
                              title="Reject"
                              style={{
                                width: 30,
                                height: 30,
                                border: "1px solid #fecaca",
                                background: "#fff5f5",
                                borderRadius: ".5rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={14} color="#dc2626" />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: ".8rem" }}>
                            {r.note || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              width: "100%",
              maxWidth: 400,
              padding: "2rem",
            }}
          >
            <h3
              style={{
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Reject Upgrade Request
            </h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Optional rejection note..."
              rows={3}
              style={{
                width: "100%",
                padding: ".75rem",
                border: "1px solid #e2e8f0",
                borderRadius: ".875rem",
                fontFamily: "inherit",
                fontSize: ".9rem",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem" }}
            >
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: ".875rem",
                  background: "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={reject}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  border: "none",
                  borderRadius: ".875rem",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
