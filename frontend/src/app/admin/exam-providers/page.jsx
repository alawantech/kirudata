"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, GraduationCap } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const EMPTY = {
  name: "",
  examCode: "",
  price: "",
  buyingPrice: "",
  status: "On",
};

const EXAM_CODES = ["waec", "neco", "nabteb"];

const examColor = (code) => {
  const colors = { waec: "#7c3aed", neco: "#2563eb", nabteb: "#16a34a" };
  return colors[code] || "#6366f1";
};

export default function AdminExamProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const fetchAll = () => {
    setLoading(true);
    adminApi.get("/admin/exam-providers")
      .then((r) => setProviders(r.data.data?.providers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (p) => {
    setForm({
      name: p.name || "",
      examCode: p.examCode || "",
      price: String(p.price || ""),
      buyingPrice: String(p.buyingPrice || ""),
      status: p.status || "On",
    });
    setModal(p);
  };

  const handleSave = async () => {
    if (!form.name || !form.examCode) {
      toast.error("Name and Exam Code are required");
      return;
    }
    if (!form.price || !form.buyingPrice) {
      toast.error("Selling price and Buying price are required");
      return;
    }
    try {
      if (modal === "add") {
        await adminApi.post("/admin/exam-providers", form);
        toast.success("Provider added");
      } else {
        await adminApi.put(`/admin/exam-providers/${modal.id}`, form);
        toast.success("Provider updated");
      }
      fetchAll(); setModal(null);
    } catch { toast.error("Failed to save provider"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this exam provider?")) return;
    try { await adminApi.delete(`/admin/exam-providers/${id}`); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Delete failed"); }
  };

  const profit = (sell, buy) => {
    const s = parseInt(sell) || 0;
    const b = parseInt(buy) || 0;
    return s - b;
  };

  return (
    <RequirePermission permission="exam_providers_manage">
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#a78bfa)", padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: ".25rem" }}>
          <GraduationCap size={22} color="white" />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.25rem" }}>Exam Providers</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".8rem" }}>Manage exam result checker PINs (WAEC, NECO, NABTEB)</p>
      </div>

      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: ".35rem", background: "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white", border: "none", borderRadius: ".75rem", padding: ".5rem 1rem", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
            <Plus size={14} /> Add Provider
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 68, borderRadius: 16 }} />)}
          </div>
        ) : providers.length === 0 ? (
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", color: "#71717a" }}>
            No exam providers yet. Click &quot;Add Provider&quot; to create one.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {providers.map((p) => (
              <div key={p.id} style={{ background: "white", borderRadius: "1rem", padding: ".85rem 1.1rem", boxShadow: "0 2px 6px rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: ".8rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: examColor(p.examCode) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GraduationCap size={16} color={examColor(p.examCode)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#09090b" }}>{p.name}</div>
                  <div style={{ fontSize: ".7rem", color: "#71717a" }}>
                    Code: {p.examCode} · Sell: ₦{parseInt(p.price || 0).toLocaleString()} · Buy: ₦{parseInt(p.buyingPrice || 0).toLocaleString()} · Profit: ₦{profit(p.price, p.buyingPrice).toLocaleString()}
                  </div>
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
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{modal === "add" ? "Add Exam Provider" : "Edit Provider"}</h3>
              <button onClick={() => setModal(null)} style={{ border: "none", background: "#f4f4f5", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: ".8rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Provider Name</label>
              <input value={form.name} onChange={set("name")} placeholder="e.g. WAEC" style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: ".8rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Exam Code (for API)</label>
              <select value={form.examCode} onChange={set("examCode")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="">Select code</option>
                {EXAM_CODES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginBottom: ".8rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Selling Price (₦)</label>
                <input type="number" value={form.price} onChange={set("price")} placeholder="e.g. 5350" style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Buying Price (₦)</label>
                <input type="number" value={form.buyingPrice} onChange={set("buyingPrice")} placeholder="e.g. 5000" style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Status</label>
              <select value={form.status} onChange={set("status")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: ".6rem" }}>
              <button onClick={handleSave} style={{ flex: 1, background: "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>
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
