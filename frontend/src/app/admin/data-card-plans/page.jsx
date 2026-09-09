"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const NETWORKS = [
  { id: 1, name: "MTN" },
  { id: 2, name: "Airtel" },
  { id: 3, name: "GLO" },
  { id: 4, name: "9Mobile" },
];

const EMPTY = {
  name: "",
  networkId: "1",
  networkName: "MTN",
  planType: "1",
  cardName: "kirudata",
  userPrice: "",
  vendorPrice: "",
  buyingPrice: "",
  loadPin: "",
  checkBalance: "",
  validity: "1 Month",
  status: "On",
};

export default function AdminDataCardPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | plan obj
  const [form, setForm] = useState(EMPTY);
  const [netFilter, setNetFilter] = useState("");

  const fetch = () => {
    setLoading(true);
    adminApi
      .get("/admin/data-card-plans")
      .then((r) => setPlans(r.data.data?.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, []);

  const filtered = netFilter
    ? plans.filter((p) => String(p.networkId) === netFilter)
    : plans;

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Auto-fill networkName when networkId changes
      if (k === "networkId") {
        const net = NETWORKS.find((n) => String(n.id) === v);
        next.networkName = net ? net.name : "";
      }
      return next;
    });
  };

  const openAdd = () => {
    setForm(EMPTY);
    setModal("add");
  };
  const openEdit = (p) => {
    setForm({
      name: p.name || "",
      networkId: String(p.networkId || "1"),
      networkName: p.networkName || "",
      planType: String(p.planType || "1"),
      cardName: p.cardName || "kirudata",
      userPrice: p.userPrice || "",
      vendorPrice: p.vendorPrice || "",
      buyingPrice: p.buyingPrice || "0",
      loadPin: p.loadPin || "",
      checkBalance: p.checkBalance || "",
      validity: p.validity || "1 Month",
      status: p.status || "On",
    });
    setModal(p);
  };

  const handleSave = async () => {
    if (!form.name || !form.userPrice || !form.planType || !form.cardName) {
      toast.error("Name, Plan Type, Card Name and User Price required");
      return;
    }
    try {
      if (modal === "add") {
        await adminApi.post("/admin/data-card-plans", form);
        toast.success("Plan added");
      } else {
        await adminApi.put(`/admin/data-card-plans/${modal.id}`, form);
        toast.success("Plan updated");
      }
      fetch();
      setModal(null);
    } catch {
      toast.error("Failed to save plan");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this data card plan?")) return;
    try {
      await adminApi.delete(`/admin/data-card-plans/${id}`);
      toast.success("Deleted");
      fetch();
    } catch {
      toast.error("Delete failed");
    }
  };

  const netColor = (id) => {
    const map = { 1: "#f59e0b", 2: "#dc2626", 3: "#16a34a", 4: "#0d9488" };
    return map[id] || "#6366f1";
  };

  return (
    <RequirePermission permission="data_card_plans_manage">
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#4c1d95,#7c3aed,#8b5cf6)",
          padding: "2rem 1.5rem 1.5rem",
        }}
      >
        <h1
          style={{
            color: "white",
            fontWeight: 800,
            fontSize: "1.25rem",
            marginBottom: ".25rem",
          }}
        >
          Data Card Plans
        </h1>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".8rem" }}>
          Manage data card plans sent to the API
        </p>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: ".75rem",
          }}
        >
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {[{ id: "", name: "All" }, ...NETWORKS].map((n) => (
              <button
                key={n.id}
                onClick={() => setNetFilter(String(n.id))}
                style={{
                  padding: ".35rem .9rem",
                  borderRadius: "2rem",
                  border:
                    netFilter === String(n.id)
                      ? "2px solid #7c3aed"
                      : "1.5px solid #e4e4e7",
                  background: netFilter === String(n.id) ? "#ede9fe" : "white",
                  color: netFilter === String(n.id) ? "#7c3aed" : "#52525b",
                  fontWeight: 700,
                  fontSize: ".8rem",
                  cursor: "pointer",
                }}
              >
                {n.name}
              </button>
            ))}
          </div>
          <button
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".4rem",
              background: "linear-gradient(135deg,#4c1d95,#7c3aed)",
              color: "white",
              border: "none",
              borderRadius: ".875rem",
              padding: ".6rem 1.1rem",
              fontWeight: 700,
              fontSize: ".85rem",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Plan
          </button>
        </div>

        {/* Plans list */}
        {loading ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shimmer"
                style={{ height: 72, borderRadius: 16 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "3rem",
              textAlign: "center",
              color: "#71717a",
            }}
          >
            No data card plans yet. Click "Add Plan" to create one.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "white",
                  borderRadius: "1.25rem",
                  padding: "1rem 1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: netColor(p.networkId) + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: ".7rem",
                    color: netColor(p.networkId),
                    flexShrink: 0,
                  }}
                >
                  {p.networkName ||
                    NETWORKS.find((n) => n.id === p.networkId)?.name ||
                    "N/A"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: ".9rem",
                      color: "#09090b",
                      marginBottom: ".2rem",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#71717a" }}>
                    Plan Type: {p.planType} · Card: {p.cardName} · Validity:{" "}
                    {p.validity}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: ".95rem",
                      color: "#09090b",
                    }}
                  >
                    ₦{parseFloat(p.userPrice).toLocaleString()}
                  </div>
                  <div style={{ fontSize: ".72rem", color: "#71717a" }}>
                    Buy: ₦{parseFloat(p.buyingPrice || 0).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    padding: ".2rem .65rem",
                    borderRadius: "2rem",
                    background: p.status === "On" ? "#dcfce7" : "#fee2e2",
                    color: p.status === "On" ? "#16a34a" : "#dc2626",
                    fontSize: ".72rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {p.status}
                </div>
                <div style={{ display: "flex", gap: ".5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(p)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1.5px solid #e4e4e7",
                      background: "#fafafa",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Edit2 size={14} color="#52525b" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: "1.5px solid #fecaca",
                      background: "#fff5f5",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.5rem",
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>
                {modal === "add" ? "Add Data Card Plan" : "Edit Plan"}
              </h3>
              <button
                onClick={() => setModal(null)}
                style={{
                  border: "none",
                  background: "#f4f4f5",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {[
              { label: "Plan Name (e.g. MTN 10GB)", key: "name" },
              { label: "User Price (₦)", key: "userPrice" },
              { label: "Vendor Price (₦)", key: "vendorPrice" },
              { label: "Buying Price (₦)", key: "buyingPrice" },
              { label: "Card Name (e.g. kirudata)", key: "cardName" },
              {
                label: "Plan Type (API numeric ID)",
                key: "planType",
                type: "number",
              },
              { label: "Load USSD (e.g. *1234*PIN#)", key: "loadPin" },
              { label: "Check Balance USSD (e.g. *133#)", key: "checkBalance" },
              { label: "Validity (e.g. 1 Month)", key: "validity" },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: ".875rem" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: ".78rem",
                    color: "#52525b",
                    marginBottom: ".4rem",
                  }}
                >
                  {label}
                </label>
                <input
                  type={type || "text"}
                  value={form[key]}
                  onChange={set(key)}
                  style={{
                    width: "100%",
                    border: "1.5px solid #e4e4e7",
                    borderRadius: ".75rem",
                    padding: ".7rem .9rem",
                    fontSize: ".9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: ".875rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: ".78rem",
                  color: "#52525b",
                  marginBottom: ".4rem",
                }}
              >
                Network
              </label>
              <select
                value={form.networkId}
                onChange={set("networkId")}
                style={{
                  width: "100%",
                  border: "1.5px solid #e4e4e7",
                  borderRadius: ".75rem",
                  padding: ".7rem .9rem",
                  fontSize: ".9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "white",
                }}
              >
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: ".78rem",
                  color: "#52525b",
                  marginBottom: ".4rem",
                }}
              >
                Status
              </label>
              <select
                value={form.status}
                onChange={set("status")}
                style={{
                  width: "100%",
                  border: "1.5px solid #e4e4e7",
                  borderRadius: ".75rem",
                  padding: ".7rem .9rem",
                  fontSize: ".9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "white",
                }}
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: ".75rem" }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg,#4c1d95,#7c3aed)",
                  color: "white",
                  border: "none",
                  borderRadius: ".875rem",
                  padding: ".8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {modal === "add" ? "Add Plan" : "Save Changes"}
              </button>
              <button
                onClick={() => setModal(null)}
                style={{
                  flex: 1,
                  background: "#f4f4f5",
                  color: "#52525b",
                  border: "none",
                  borderRadius: ".875rem",
                  padding: ".8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
