"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Link2 } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const TYPES = ["VTU", "Share And Sell"];

const EMPTY = {
  networkId: "",
  type: "VTU",
  buyDiscount: "96",
  userDiscount: "",
  vendorDiscount: "",
};

function slugify(s) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const btnBase = {
  border: "none", borderRadius: ".75rem", padding: ".5rem 1rem", cursor: "pointer",
  fontFamily: "inherit", fontWeight: 600, fontSize: ".8rem", display: "flex", alignItems: "center", gap: ".4rem",
};

export default function AirtimeDiscountsPage() {
  const [apiProviders, setApiProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | 'add' | discount object
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    adminApi.get("/admin/api-links").then((r) => {
      const all = r.data.data?.links || r.data.data?.apiLinks || [];
      const airtimeOnes = all.filter((l) => l.type === "Airtime");
      setApiProviders(airtimeOnes);
    }).catch(() => {});
    adminApi.get("/admin/networks").then((r) => setNetworks(r.data.data?.networks || [])).catch(() => {});
  }, []);

  const loadDiscounts = useCallback(() => {
    if (!selectedProvider) return;
    setLoading(true);
    const slug = slugify(selectedProvider.name);
    adminApi.get("/admin/airtime-discounts", { params: { providerSlug: slug } })
      .then((r) => setDiscounts(r.data.data?.discounts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedProvider) loadDiscounts();
    else setDiscounts([]);
  }, [selectedProvider, loadDiscounts]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openEdit = (d) => {
    setForm({
      networkId: String(d.networkId || ""),
      type: d.type || "VTU",
      buyDiscount: String(d.buyDiscount ?? 96),
      userDiscount: String(d.userDiscount ?? ""),
      vendorDiscount: String(d.vendorDiscount ?? ""),
    });
    setModal(d);
  };

  const openAdd = () => {
    setForm(EMPTY);
    setModal("add");
  };

  const handleSave = async () => {
    if (!form.networkId || !form.type || form.userDiscount === "") {
      toast.error("Network, type, and user discount are required");
      return;
    }
    try {
      const slug = slugify(selectedProvider.name);
      if (modal === "add") {
        await adminApi.post("/admin/airtime-discounts", { ...form, providerSlug: slug });
        toast.success("Discount added");
      } else {
        await adminApi.put(`/admin/airtime-discounts/${modal.id}`, form);
        toast.success("Discount updated");
      }
      setModal(null);
      loadDiscounts();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed");
    }
  };

  const deleteDiscount = async (id) => {
    if (!confirm("Delete this discount?")) return;
    try {
      await adminApi.delete(`/admin/airtime-discounts/${id}`);
      toast.success("Deleted");
      loadDiscounts();
    } catch {
      toast.error("Failed");
    }
  };

  const deleteProvider = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its discounts?`)) return;
    try {
      await adminApi.delete(`/admin/api-links/${id}`);
      toast.success("Provider deleted");
      if (selectedProvider?.id === id) setSelectedProvider(null);
      const r = await adminApi.get("/admin/api-links");
      const all = r.data.data?.links || r.data.data?.apiLinks || [];
      setApiProviders(all.filter((l) => l.type === "Airtime"));
    } catch {
      toast.error("Failed to delete provider");
    }
  };

  const inputStyle = {
    width: "100%", padding: ".625rem .875rem", border: "1px solid #e2e8f0",
    borderRadius: ".75rem", fontFamily: "inherit", fontSize: ".875rem", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: ".78rem", fontWeight: 600, color: "#475569", marginBottom: ".3rem" };

  return (
    <RequirePermission permission="airtime_discounts_manage">
    <div style={{ minHeight: "100vh" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-.03em", margin: 0 }}>
          Airtime Discounts
        </h1>
        <p style={{ color: "#64748b", fontSize: ".875rem", marginTop: ".25rem" }}>
          Select an airtime provider to set its discount rates per network. Values are percentages — e.g. 96 = buying ₦100 airtime at ₦96.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Provider Sidebar */}
        <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,.05)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: ".5rem" }}>
            <Link2 size={14} color="#64748b" />
            <p style={{ margin: 0, fontWeight: 700, fontSize: ".8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>
              Airtime API Providers
            </p>
          </div>
          {apiProviders.length === 0 ? (
            <div style={{ padding: "2rem 1.25rem", textAlign: "center", color: "#94a3b8", fontSize: ".82rem", lineHeight: 1.6 }}>
              No Airtime providers found.<br />
              Go to <a href="/admin/api-links" style={{ color: "#2563eb" }}>API Providers</a> and add one with type <strong>Airtime</strong>.
            </div>
          ) : (
            apiProviders.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(p)}
                style={{
                  padding: ".875rem 1.25rem", cursor: "pointer", borderBottom: "1px solid #f8fafc",
                  background: selectedProvider?.id === p.id ? "#eff6ff" : "transparent",
                  borderLeft: selectedProvider?.id === p.id ? "3px solid #2563eb" : "3px solid transparent",
                  transition: "background .15s",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".875rem", color: selectedProvider?.id === p.id ? "#1d4ed8" : "#1e293b" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: ".72rem", color: "#94a3b8", marginTop: ".15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                    {p.value || "No URL set"}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProvider(p.id, p.name); }}
                  style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "4px", flexShrink: 0 }}
                  title={`Delete ${p.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Discounts Area */}
        <div>
          {!selectedProvider ? (
            <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
              Select a provider from the left to manage its airtime discounts.
            </div>
          ) : (
            <>
              {/* Provider header */}
              <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "1.25rem 1.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", color: "#1e293b" }}>{selectedProvider.name}</h2>
                  <p style={{ margin: ".2rem 0 0", fontSize: ".8rem", color: "#64748b" }}>
                    slug: <code style={{ background: "#f8fafc", padding: "1px 6px", borderRadius: "4px" }}>{slugify(selectedProvider.name)}</code>
                    {selectedProvider.value && <> · <span style={{ color: "#94a3b8" }}>{selectedProvider.value}</span></>}
                  </p>
                </div>
                <button onClick={openAdd} style={{ ...btnBase, background: "#2563eb", color: "white" }}>
                  <Plus size={15} /> Add Discount
                </button>
              </div>

              {/* Note */}
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "1rem", padding: "1rem 1.25rem", marginBottom: "1rem", fontSize: ".82rem", color: "#92400e" }}>
                <strong>Note:</strong> These discounts apply when <strong>{selectedProvider.name}</strong> is the active airtime provider. Set discounts per network and type (VTU / Share &amp; Sell).
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ background: "white", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
              ) : discounts.length === 0 ? (
                <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #f1f5f9", padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                  No discounts set for {selectedProvider.name}.<br />
                  <button onClick={openAdd} style={{ ...btnBase, background: "#2563eb", color: "white", marginTop: "1rem", display: "inline-flex" }}>
                    <Plus size={15} /> Add First Discount
                  </button>
                </div>
              ) : (
                <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,.04)", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".83rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                          {["#", "Network", "Type", "You Buy (%)", "User Pays (%)", "Vendor Pays (%)", "Actions"].map((h) => (
                            <th key={h} style={{ padding: ".75rem 1rem", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {discounts.map((d, i) => (
                          <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: ".75rem 1rem", color: "#94a3b8" }}>{i + 1}</td>
                            <td style={{ padding: ".75rem 1rem", fontWeight: 700, color: "#1e293b" }}>{d.network?.name || d.networkId}</td>
                            <td style={{ padding: ".75rem 1rem" }}>
                              <span style={{
                                background: d.type === "VTU" ? "#eff6ff" : "#f5f3ff",
                                color: d.type === "VTU" ? "#2563eb" : "#7c3aed",
                                padding: "2px 10px", borderRadius: "999px", fontSize: ".73rem", fontWeight: 700,
                              }}>
                                {d.type}
                              </span>
                            </td>
                            <td style={{ padding: ".75rem 1rem", color: "#64748b" }}>{Number(d.buyDiscount).toFixed(2)}%</td>
                            <td style={{ padding: ".75rem 1rem", fontWeight: 700, color: "#1e293b" }}>{Number(d.userDiscount).toFixed(2)}%</td>
                            <td style={{ padding: ".75rem 1rem", color: "#64748b" }}>{Number(d.vendorDiscount).toFixed(2)}%</td>
                            <td style={{ padding: ".75rem 1rem" }}>
                              <div style={{ display: "flex", gap: ".4rem" }}>
                                <button onClick={() => openEdit(d)} style={{ border: "none", background: "#eff6ff", color: "#2563eb", borderRadius: ".5rem", padding: ".35rem .6rem", cursor: "pointer" }}>
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => deleteDiscount(d.id)} style={{ border: "none", background: "#fee2e2", color: "#dc2626", borderRadius: ".5rem", padding: ".35rem .6rem", cursor: "pointer" }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.75rem", width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                {modal === "add" ? "Add Discount" : "Edit Discount"}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Network</label>
                <select style={inputStyle} value={form.networkId} onChange={set("networkId")}>
                  <option value="">Select Network</option>
                  {networks.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Airtime Type</label>
                <select style={inputStyle} value={form.type} onChange={set("type")}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>You Buy At (%)</label>
                <input style={inputStyle} type="number" step="0.01" min="0" max="100" placeholder="e.g. 96" value={form.buyDiscount} onChange={set("buyDiscount")} />
                <p style={{ fontSize: ".73rem", color: "#94a3b8", marginTop: ".25rem" }}>96 = you buy ₦100 airtime at ₦96</p>
              </div>

              <div>
                <label style={labelStyle}>User Pays (%)</label>
                <input style={inputStyle} type="number" step="0.01" min="0" max="100" placeholder="e.g. 97" value={form.userDiscount} onChange={set("userDiscount")} />
              </div>

              <div>
                <label style={labelStyle}>Vendor Pays (%)</label>
                <input style={inputStyle} type="number" step="0.01" min="0" max="100" placeholder="e.g. 96.5" value={form.vendorDiscount} onChange={set("vendorDiscount")} />
              </div>
            </div>

            <div style={{ display: "flex", gap: ".75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ ...btnBase, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
              <button onClick={handleSave} style={{ ...btnBase, background: "#2563eb", color: "white" }}>
                {modal === "add" ? "Add Discount" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
