"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Zap } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const EMPTY = {
  name: "",
  electricityCode: "",
  abbreviation: "",
  status: "On",
};

const DISCO_CODES = [
  "ikeja-electric",
  "eko-electric",
  "kano-electric",
  "ph-electric",
  "jos-electric",
  "ibadan-electric",
  "kaduna-electric",
  "abuja-electric",
  "benin-electric",
  "enugu-electric",
  "yola-electric",
];

export default function AdminElectricityProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const fetchAll = () => {
    setLoading(true);
    adminApi.get("/admin/electricity-providers")
      .then((r) => setProviders(r.data.data?.providers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (p) => {
    setForm({ name: p.name || "", electricityCode: p.electricityCode || "", abbreviation: p.abbreviation || "", status: p.status || "On" });
    setModal(p);
  };

  const handleSave = async () => {
    if (!form.name || !form.electricityCode || !form.abbreviation) {
      toast.error("Name, Code and Abbreviation are required");
      return;
    }
    try {
      if (modal === "add") {
        await adminApi.post("/admin/electricity-providers", form);
        toast.success("Provider added");
      } else {
        await adminApi.put(`/admin/electricity-providers/${modal.id}`, form);
        toast.success("Provider updated");
      }
      fetchAll(); setModal(null);
    } catch { toast.error("Failed to save provider"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this electricity provider?")) return;
    try { await adminApi.delete(`/admin/electricity-providers/${id}`); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Delete failed"); }
  };

  const discoColor = (code) => {
    const colors = {
      "ikeja-electric": "#f59e0b",
      "eko-electric": "#dc2626",
      "kano-electric": "#16a34a",
      "ph-electric": "#2563eb",
      "jos-electric": "#8b5cf6",
      "ibadan-electric": "#0ea5e9",
      "kaduna-electric": "#ec4899",
      "abuja-electric": "#f97316",
      "benin-electric": "#14b8a6",
      "enugu-electric": "#6366f1",
      "yola-electric": "#84cc16",
    };
    return colors[code] || "#6366f1";
  };

  return (
    <RequirePermission permission="electricity_manage">
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#b45309,#f59e0b,#fbbf24)", padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: ".25rem" }}>
          <Zap size={22} color="white" />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.25rem" }}>Electricity Providers</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".8rem" }}>Manage electricity distribution companies (DISCOs)</p>
      </div>

      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: ".35rem", background: "linear-gradient(135deg,#b45309,#f59e0b)", color: "white", border: "none", borderRadius: ".75rem", padding: ".5rem 1rem", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
            <Plus size={14} /> Add Provider
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 68, borderRadius: 16 }} />)}
          </div>
        ) : providers.length === 0 ? (
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", color: "#71717a" }}>
            No electricity providers yet. Click "Add Provider" to create one.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {providers.map((p) => (
              <div key={p.id} style={{ background: "white", borderRadius: "1rem", padding: ".85rem 1.1rem", boxShadow: "0 2px 6px rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: ".8rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: discoColor(p.electricityCode) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Zap size={16} color={discoColor(p.electricityCode)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#09090b" }}>{p.name}</div>
                  <div style={{ fontSize: ".7rem", color: "#71717a" }}>{p.abbreviation} · {p.electricityCode}</div>
                </div>
                <div style={{ padding: ".15rem .5rem", borderRadius: "2rem", background: p.status === "On" ? "#dcfce7" : "#fee2e2", color: p.status === "On" ? "#16a34a" : "#dc2626", fontSize: ".68rem", fontWeight: 700, flexShrink: 0 }}>
                  {p.status}
                </div>
                <div style={{ display: "flex", gap: ".35rem", flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e4e4e7", background: "#fafafa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Edit2 size={13} color="#52525b" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={13} color="#dc2626" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.5rem", width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{modal === "add" ? "Add Electricity Provider" : "Edit Provider"}</h3>
              <button onClick={() => setModal(null)} style={{ border: "none", background: "#f4f4f5", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: ".8rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Provider Name</label>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Ikeja Electric" style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: ".8rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Electricity Code (for API)</label>
              <select value={form.electricityCode} onChange={set("electricityCode")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="">Select code</option>
                {DISCO_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: ".8rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Abbreviation (e.g. IKEDC)</label>
              <input value={form.abbreviation} onChange={set("abbreviation")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Status</label>
              <select value={form.status} onChange={set("status")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: ".6rem" }}>
              <button onClick={handleSave} style={{ flex: 1, background: "linear-gradient(135deg,#b45309,#f59e0b)", color: "white", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>
                {modal === "add" ? "Add Provider" : "Save Changes"}
              </button>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: "#f4f4f5", color: "#52525b", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
