"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Tv } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const EMPTY_PLAN = {
  name: "",
  providerId: "",
  planCode: "",
  buyingPrice: "",
  userPrice: "",
  validity: "30 days",
  type: "",
  status: "On",
};

const EMPTY_PROVIDER = {
  name: "",
  cableCode: "",
  status: "On",
};

export default function AdminCablePlansPage() {
  const [plans, setPlans] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planModal, setPlanModal] = useState(null);
  const [provModal, setProvModal] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [provForm, setProvForm] = useState(EMPTY_PROVIDER);
  const [provFilter, setProvFilter] = useState("");

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      adminApi.get("/admin/cable-plans").then((r) => setPlans(r.data.data?.plans || [])),
      adminApi.get("/admin/cable-providers").then((r) => setProviders(r.data.data?.providers || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = provFilter
    ? plans.filter((p) => String(p.providerId) === provFilter)
    : plans;

  const provName = (id) => providers.find((p) => p.id === id)?.name || "—";

  const setP = (k) => (e) => setPlanForm((f) => ({ ...f, [k]: e.target.value }));
  const setPr = (k) => (e) => setProvForm((f) => ({ ...f, [k]: e.target.value }));

  const openAddPlan = () => { setPlanForm(EMPTY_PLAN); setPlanModal("add"); };
  const openEditPlan = (p) => {
    setPlanForm({
      name: p.name || "",
      providerId: String(p.providerId || ""),
      planCode: p.planCode || "",
      buyingPrice: p.buyingPrice || "",
      userPrice: p.userPrice || "",
      validity: p.validity || "30 days",
      type: p.type || "",
      status: p.status || "On",
    });
    setPlanModal(p);
  };

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.providerId || !planForm.planCode || !planForm.buyingPrice) {
      toast.error("Name, Provider, Plan Code and Price are required");
      return;
    }
    try {
      if (planModal === "add") {
        await adminApi.post("/admin/cable-plans", planForm);
        toast.success("Plan added");
      } else {
        await adminApi.put(`/admin/cable-plans/${planModal.id}`, planForm);
        toast.success("Plan updated");
      }
      fetchAll(); setPlanModal(null);
    } catch { toast.error("Failed to save plan"); }
  };

  const handleDeletePlan = async (id) => {
    if (!confirm("Delete this cable plan?")) return;
    try { await adminApi.delete(`/admin/cable-plans/${id}`); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Delete failed"); }
  };

  const openAddProv = () => { setProvForm(EMPTY_PROVIDER); setProvModal("add"); };
  const openEditProv = (p) => {
    setProvForm({ name: p.name || "", cableCode: p.cableCode || "", status: p.status || "On" });
    setProvModal(p);
  };

  const handleSaveProv = async () => {
    if (!provForm.name || !provForm.cableCode) { toast.error("Name and Code required"); return; }
    try {
      if (provModal === "add") {
        await adminApi.post("/admin/cable-providers", provForm);
        toast.success("Provider added");
      } else {
        await adminApi.put(`/admin/cable-providers/${provModal.id}`, provForm);
        toast.success("Provider updated");
      }
      fetchAll(); setProvModal(null);
    } catch { toast.error("Failed to save provider"); }
  };

  const handleDeleteProv = async (id) => {
    if (!confirm("Delete this provider? Plans must be deleted first.")) return;
    try { await adminApi.delete(`/admin/cable-providers/${id}`); toast.success("Deleted"); fetchAll(); }
    catch (e) { toast.error(e.response?.data?.msg || "Delete failed"); }
  };

  const provColor = (id) => {
    const map = { 1: "#8b5cf6", 2: "#2563eb", 3: "#f59e0b" };
    return map[id] || "#6366f1";
  };

  return (
    <RequirePermission permission="cable_plans_manage">
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f,#0ea5e9,#38bdf8)", padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".7rem", marginBottom: ".25rem" }}>
          <Tv size={22} color="white" />
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.25rem" }}>Cable TV Plans</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".8rem" }}>Manage cable providers and subscription plans</p>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Providers section */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
            <h2 style={{ fontWeight: 800, fontSize: ".95rem", color: "#1e293b" }}>Providers</h2>
            <button onClick={openAddProv} style={{ display: "flex", alignItems: "center", gap: ".35rem", background: "linear-gradient(135deg,#1e3a5f,#0ea5e9)", color: "white", border: "none", borderRadius: ".75rem", padding: ".5rem 1rem", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
              <Plus size={14} /> Add Provider
            </button>
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            {providers.map((p) => (
              <div key={p.id} style={{ background: "white", borderRadius: "1rem", padding: ".75rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", alignItems: "center", gap: ".7rem", flex: 1, minWidth: 200 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: provColor(p.id) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: ".65rem", color: provColor(p.id), flexShrink: 0 }}>
                  {p.cableCode}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{p.name}</div>
                  <div style={{ fontSize: ".72rem", color: "#71717a" }}>{p.plans?.length || 0} plans</div>
                </div>
                <div style={{ padding: ".15rem .5rem", borderRadius: "2rem", background: p.status === "On" ? "#dcfce7" : "#fee2e2", color: p.status === "On" ? "#16a34a" : "#dc2626", fontSize: ".68rem", fontWeight: 700 }}>
                  {p.status}
                </div>
                <div style={{ display: "flex", gap: ".35rem" }}>
                  <button onClick={() => openEditProv(p)} style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #e4e4e7", background: "#fafafa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Edit2 size={12} color="#52525b" />
                  </button>
                  <button onClick={() => handleDeleteProv(p.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={12} color="#dc2626" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem", flexWrap: "wrap", gap: ".5rem" }}>
            <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
              {[{ id: "", name: "All" }, ...providers].map((p) => (
                <button key={p.id || "all"} onClick={() => setProvFilter(String(p.id))} style={{ padding: ".3rem .75rem", borderRadius: "2rem", border: provFilter === String(p.id) ? "2px solid #0ea5e9" : "1.5px solid #e4e4e7", background: provFilter === String(p.id) ? "#e0f2fe" : "white", color: provFilter === String(p.id) ? "#0284c7" : "#52525b", fontWeight: 700, fontSize: ".75rem", cursor: "pointer" }}>
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={openAddPlan} style={{ display: "flex", alignItems: "center", gap: ".35rem", background: "linear-gradient(135deg,#1e3a5f,#0ea5e9)", color: "white", border: "none", borderRadius: ".75rem", padding: ".5rem 1rem", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
              <Plus size={14} /> Add Plan
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 68, borderRadius: 16 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "white", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", color: "#71717a" }}>
              No cable plans yet. Add a provider first, then add plans.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              {filtered.map((p) => (
                <div key={p.id} style={{ background: "white", borderRadius: "1rem", padding: ".85rem 1.1rem", boxShadow: "0 2px 6px rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: ".8rem" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: provColor(p.providerId) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: ".6rem", color: provColor(p.providerId), flexShrink: 0 }}>
                    {provName(p.providerId)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#09090b" }}>{p.name}</div>
                    <div style={{ fontSize: ".7rem", color: "#71717a" }}>Code: {p.planCode} · {p.validity}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: ".9rem", color: "#09090b" }}>₦{parseFloat(p.userPrice).toLocaleString()}</div>
                    <div style={{ fontSize: ".68rem", color: "#71717a" }}>Cost: ₦{parseFloat(p.buyingPrice).toLocaleString()}</div>
                  </div>
                  <div style={{ padding: ".15rem .5rem", borderRadius: "2rem", background: p.status === "On" ? "#dcfce7" : "#fee2e2", color: p.status === "On" ? "#16a34a" : "#dc2626", fontSize: ".68rem", fontWeight: 700, flexShrink: 0 }}>
                    {p.status || "On"}
                  </div>
                  <div style={{ display: "flex", gap: ".35rem", flexShrink: 0 }}>
                    <button onClick={() => openEditPlan(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e4e4e7", background: "#fafafa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={13} color="#52525b" />
                    </button>
                    <button onClick={() => handleDeletePlan(p.id)} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} color="#dc2626" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plan Modal */}
      {planModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.5rem", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{planModal === "add" ? "Add Cable Plan" : "Edit Plan"}</h3>
              <button onClick={() => setPlanModal(null)} style={{ border: "none", background: "#f4f4f5", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: ".8rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Provider</label>
              <select value={planForm.providerId} onChange={setP("providerId")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="">Select provider</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {[
              { label: "Plan Name (e.g. GOTV Jinja)", key: "name" },
              { label: "Plan Code (e.g. gotv-jinja)", key: "planCode" },
              { label: "Price (₦) — what user pays", key: "buyingPrice" },
              { label: "Validity (e.g. 30 days)", key: "validity" },
              { label: "Type (optional, e.g. GOTV)", key: "type" },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: ".75rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>{label}</label>
                <input value={planForm[key]} onChange={setP(key)} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Status</label>
              <select value={planForm.status} onChange={setP("status")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: ".6rem" }}>
              <button onClick={handleSavePlan} style={{ flex: 1, background: "linear-gradient(135deg,#1e3a5f,#0ea5e9)", color: "white", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>
                {planModal === "add" ? "Add Plan" : "Save Changes"}
              </button>
              <button onClick={() => setPlanModal(null)} style={{ flex: 1, background: "#f4f4f5", color: "#52525b", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Modal */}
      {provModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.5rem", width: "100%", maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{provModal === "add" ? "Add Provider" : "Edit Provider"}</h3>
              <button onClick={() => setProvModal(null)} style={{ border: "none", background: "#f4f4f5", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>

            {[
              { label: "Provider Name (e.g. GOTV)", key: "name" },
              { label: "Code (e.g. gotv)", key: "cableCode" },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: ".8rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>{label}</label>
                <input value={provForm[key]} onChange={setPr(key)} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: ".75rem", color: "#52525b", marginBottom: ".35rem" }}>Status</label>
              <select value={provForm.status} onChange={setPr("status")} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".75rem", padding: ".65rem .8rem", fontSize: ".85rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: ".6rem" }}>
              <button onClick={handleSaveProv} style={{ flex: 1, background: "linear-gradient(135deg,#1e3a5f,#0ea5e9)", color: "white", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>
                {provModal === "add" ? "Add Provider" : "Save Changes"}
              </button>
              <button onClick={() => setProvModal(null)} style={{ flex: 1, background: "#f4f4f5", color: "#52525b", border: "none", borderRadius: ".875rem", padding: ".75rem", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
