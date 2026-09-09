"use client";
import { useEffect, useState } from "react";
import { ArrowLeftRight, Settings, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

export default function AdminAtcPage() {
  const [tab, setTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");

  // Settings form
  const [form, setForm] = useState({
    atcEnabled: "yes",
    atcRate: "80",
    atcMtnNumber: "",
    atcAirtelNumber: "",
    atcMinAmount: "100",
    atcMaxAmount: "50000",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, settingsRes] = await Promise.all([
        adminApi.get("/admin/atc/transactions").catch(() => ({ data: { data: { requests: [] } } })),
        adminApi.get("/admin/atc/settings").catch(() => ({ data: { data: {} } })),
      ]);
      setTransactions(txRes.data.data?.requests || []);
      const s = settingsRes.data.data || {};
      setSettings(s);
      setForm({
        atcEnabled: s.atcEnabled || "yes",
        atcRate: s.atcRate || "80",
        atcMtnNumber: s.atcMtnNumber || "",
        atcAirtelNumber: s.atcAirtelNumber || "",
        atcMinAmount: s.atcMinAmount || "100",
        atcMaxAmount: s.atcMaxAmount || "50000",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.status === filter);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await adminApi.put("/admin/atc/settings", form);
      toast.success("Settings saved!");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await adminApi.put(`/admin/atc/transactions/${id}/verify`, { status, adminNote: note });
      toast.success(`Transaction ${status}.`);
      setDetail(null);
      setNote("");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed.");
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending: { label: "Pending", bg: "#fef9c3", color: "#a16207", icon: Clock },
      completed: { label: "Completed", bg: "#dcfce7", color: "#15803d", icon: CheckCircle },
      rejected: { label: "Rejected", bg: "#fee2e2", color: "#dc2626", icon: XCircle },
    };
    const m = map[s] || map.pending;
    const Icon = m.icon;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: ".3rem", fontSize: ".7rem", fontWeight: 600, padding: ".2rem .6rem", borderRadius: 99, background: m.bg, color: m.color }}>
        <Icon size={10} /> {m.label}
      </span>
    );
  };

  return (
    <RequirePermission permission="airtime_to_cash_manage">
    <div>
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".875rem" }}>
          <ArrowLeftRight size={22} color="white" />
          <div>
            <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.125rem" }}>Airtime to Cash</h1>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".75rem" }}>Manage transactions and settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ margin: "1.25rem 1.25rem 0", display: "flex", background: "white", borderRadius: "1rem", padding: ".25rem", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        {[{ key: "transactions", label: "Transactions" }, { key: "settings", label: "Settings" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: ".625rem", borderRadius: ".75rem", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: ".85rem", background: tab === t.key ? "#059669" : "transparent", color: tab === t.key ? "white" : "#64748b" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "1.25rem" }}>
        {tab === "transactions" ? (
          <>
            {/* Filter */}
            <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {["all", "pending", "completed", "rejected"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: ".4rem .8rem", borderRadius: "2rem", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: ".75rem", background: filter === f ? "#059669" : "#f1f5f9", color: filter === f ? "white" : "#64748b", textTransform: "capitalize" }}>
                  {f} {f !== "all" && `(${transactions.filter((t) => f === "all" || t.status === f).length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                <Clock size={32} color="#cbd5e1" style={{ margin: "0 auto .75rem" }} />
                <p style={{ color: "#94a3b8", fontSize: ".875rem" }}>No transactions</p>
              </div>
            ) : (
              <div className="card">
                {filtered.map((t, i) => (
                  <div key={t.id} onClick={() => setDetail(t)} style={{ padding: "1rem 1.25rem", borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: ".875rem", fontWeight: 700, marginBottom: ".15rem" }}>
                        ₦{t.amount.toLocaleString()} → ₦{t.receiveAmount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: ".72rem", color: "#94a3b8" }}>
                        {t.network} · {t.senderNumber} · {t.user?.firstname} {t.user?.lastname} · {new Date(t.createdAt).toLocaleDateString("en-NG")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      {statusBadge(t.status)}
                      <Eye size={14} color="#94a3b8" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Settings */
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Airtime to Cash Settings</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>Enable Service</label>
              <select value={form.atcEnabled} onChange={(e) => setForm({ ...form, atcEnabled: e.target.value })} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem", background: "white" }}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>Conversion Rate (%)</label>
              <input type="number" value={form.atcRate} onChange={(e) => setForm({ ...form, atcRate: e.target.value })} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem" }} />
              <p style={{ fontSize: ".72rem", color: "#71717a", marginTop: ".25rem" }}>e.g. 80 means user receives ₦80 for every ₦100 airtime</p>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>MTN Receiving Number</label>
              <input type="tel" value={form.atcMtnNumber} onChange={(e) => setForm({ ...form, atcMtnNumber: e.target.value.replace(/\D/g, "").substring(0, 11) })} placeholder="e.g. 08012345678" maxLength={11} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem" }} />
              <p style={{ fontSize: ".72rem", color: "#71717a", marginTop: ".25rem" }}>Leave empty to disable MTN</p>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>Airtel Receiving Number</label>
              <input type="tel" value={form.atcAirtelNumber} onChange={(e) => setForm({ ...form, atcAirtelNumber: e.target.value.replace(/\D/g, "").substring(0, 11) })} placeholder="e.g. 08012345678" maxLength={11} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem" }} />
              <p style={{ fontSize: ".72rem", color: "#71717a", marginTop: ".25rem" }}>Leave empty to disable Airtel</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>Min Amount (₦)</label>
                <input type="number" value={form.atcMinAmount} onChange={(e) => setForm({ ...form, atcMinAmount: e.target.value })} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>Max Amount (₦)</label>
                <input type="number" value={form.atcMaxAmount} onChange={(e) => setForm({ ...form, atcMaxAmount: e.target.value })} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem" }} />
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={saving} style={{ width: "100%", padding: ".875rem", borderRadius: "1rem", border: "none", background: "#059669", color: "white", fontWeight: 700, fontSize: ".9rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={() => setDetail(null)}>
          <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.5rem", width: "100%", maxWidth: 420, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "1rem" }}>Transaction Details</h3>

            {[
              ["User", `${detail.user?.firstname} ${detail.user?.lastname}`],
              ["Phone", detail.user?.phone],
              ["Network", detail.network],
              ["Sender Number", detail.senderNumber],
              ["Amount Sent", `₦${detail.amount.toLocaleString()}`],
              ["Rate", `${detail.rate}%`],
              ["User Receives", `₦${detail.receiveAmount.toLocaleString()}`],
              ["Payout Method", detail.payoutMethod === "wallet" ? "Wallet" : "Bank"],
              ...(detail.payoutMethod === "bank" ? [
                ["Bank", detail.bankName],
                ["Account", detail.bankAccount],
                ["Account Name", detail.bankAccountName],
              ] : []),
              ["Status", detail.status],
              ["Ref", detail.ref],
              ["Date", new Date(detail.createdAt).toLocaleString("en-NG")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".4rem 0", borderBottom: "1px solid #f1f5f9", fontSize: ".82rem" }}>
                <span style={{ color: "#71717a" }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}

            {detail.status === "pending" && (
              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, marginBottom: ".375rem" }}>Admin Note (optional)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note..." style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".75rem 1rem", fontSize: ".9rem", marginBottom: "1rem" }} />
                <div style={{ display: "flex", gap: ".75rem" }}>
                  <button onClick={() => handleVerify(detail.id, "rejected")} style={{ flex: 1, padding: ".75rem", borderRadius: ".875rem", border: "none", background: "#dc2626", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    Reject
                  </button>
                  <button onClick={() => handleVerify(detail.id, "completed")} style={{ flex: 1, padding: ".75rem", borderRadius: ".875rem", border: "none", background: "#059669", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    Verify & Credit
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => setDetail(null)} style={{ width: "100%", padding: ".75rem", marginTop: ".75rem", borderRadius: ".875rem", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
