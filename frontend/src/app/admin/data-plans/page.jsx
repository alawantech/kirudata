"use client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const EMPTY = {
  networkId: "",
  name: "",
  planCode: "",
  userPrice: "",
  buyingPrice: "",
  vendorPrice: "",
  validity: "30",
  type: "SME",
};

export default function AdminDataPlansPage() {
  const [plans, setPlans] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | plan object
  const [form, setForm] = useState(EMPTY);
  const [net, setNet] = useState("");

  useEffect(() => {
    adminApi
      .get("/admin/networks")
      .then((r) => setNetworks(r.data.data?.networks || []))
      .catch(() => {});
  }, []);

  const fetch = () => {
    setLoading(true);
    adminApi
      .get("/admin/data-plans")
      .then((r) => setPlans(r.data.data?.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, []);

  // client-side network filter
  const filtered = net
    ? plans.filter((p) => String(p.networkId) === net)
    : plans;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openEdit = (p) => {
    setForm({
      networkId: String(p.networkId || ""),
      name: p.name || "",
      planCode: p.planCode || "",
      userPrice: p.userPrice || "",
      buyingPrice: p.buyingPrice || "",
      vendorPrice: p.vendorPrice || "",
      validity: p.validity || "30",
      type: p.type || "SME",
    });
    setModal(p);
  };
  const openAdd = () => {
    setForm(EMPTY);
    setModal("add");
  };

  const handleSave = async () => {
    if (!form.name || !form.userPrice || !form.planCode || !form.networkId) {
      toast.error("Network, Name, Plan Code and User Price required");
      return;
    }
    try {
      if (modal === "add") {
        await adminApi.post("/admin/data-plans", form);
        toast.success("Plan added");
      } else {
        await adminApi.put(`/admin/data-plans/${modal.id}`, form);
        toast.success("Plan updated");
      }
      setModal(null);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed");
    }
  };

  const deletePlan = async (id) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await adminApi.delete(`/admin/data-plans/${id}`);
      toast.success("Deleted");
      fetch();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <RequirePermission permission="data_plans_manage">
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
          Data Plans
        </h1>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <select
            value={net}
            onChange={(e) => setNet(e.target.value)}
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
            <option value="">All Networks</option>
            {networks.map((n) => (
              <option key={n.id} value={String(n.id)}>
                {n.name}
              </option>
            ))}
          </select>
          <button
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: ".875rem",
              padding: ".625rem 1.25rem",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: ".875rem",
            }}
          >
            <Plus size={16} /> Add Plan
          </button>
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
                  "Network",
                  "Plan Name",
                  "Plan Code",
                  "Validity",
                  "User Price",
                  "Type",
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No plans found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td
                      style={{
                        padding: ".875rem 1.25rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {p.network?.name || p.networkId}
                    </td>
                    <td
                      style={{ padding: ".875rem 1.25rem", color: "#0f172a" }}
                    >
                      {p.name}
                    </td>
                    <td
                      style={{ padding: ".875rem 1.25rem", color: "#64748b" }}
                    >
                      {p.planCode}
                    </td>
                    <td
                      style={{ padding: ".875rem 1.25rem", color: "#64748b" }}
                    >
                      {p.validity}
                    </td>
                    <td
                      style={{
                        padding: ".875rem 1.25rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      ₦{parseFloat(p.userPrice || 0).toLocaleString("en-NG")}
                    </td>
                    <td style={{ padding: ".875rem 1.25rem" }}>
                      <span
                        style={{
                          fontSize: ".7rem",
                          fontWeight: 600,
                          padding: ".2rem .5rem",
                          borderRadius: 99,
                          background: "#eff6ff",
                          color: "#2563eb",
                        }}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td style={{ padding: ".875rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: ".5rem" }}>
                        <button
                          onClick={() => openEdit(p)}
                          style={{
                            width: 30,
                            height: 30,
                            border: "1px solid #e2e8f0",
                            background: "white",
                            borderRadius: ".5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Edit2 size={13} color="#2563eb" />
                        </button>
                        <button
                          onClick={() => deletePlan(p.id)}
                          style={{
                            width: 30,
                            height: 30,
                            border: "1px solid #fee2e2",
                            background: "#fff5f5",
                            borderRadius: ".5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            zIndex: 100,
            padding: "1.25rem 1rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              width: "100%",
              maxWidth: 440,
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 2.5rem)",
            }}
          >
            {/* Sticky header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem 2rem 1.25rem",
                borderBottom: "1px solid #f1f5f9",
                flexShrink: 0,
              }}
            >
              <h3 style={{ fontWeight: 800, color: "#0f172a" }}>
                {modal === "add" ? "Add Plan" : "Edit Plan"}
              </h3>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={20} color="#94a3b8" />
              </button>
            </div>
            {/* Scrollable form body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Network Select */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: ".8rem",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: ".375rem",
                  }}
                >
                  Network *
                </label>
                <select
                  value={form.networkId}
                  onChange={set("networkId")}
                  style={{
                    width: "100%",
                    padding: ".75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: ".875rem",
                    fontFamily: "inherit",
                    fontSize: ".9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select Network</option>
                  {networks.map((n) => (
                    <option key={n.id} value={String(n.id)}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Type Select */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: ".8rem",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: ".375rem",
                  }}
                >
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={set("type")}
                  style={{
                    width: "100%",
                    padding: ".75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: ".875rem",
                    fontFamily: "inherit",
                    fontSize: ".9rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {["SME", "SME2", "GIFTING", "CORPORATE", "DIRECT"].map(
                    (o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ),
                  )}
                </select>
              </div>
              {/* Text/Number Inputs */}
              {[
                {
                  label: "Plan Name *",
                  key: "name",
                  type: "text",
                  placeholder: "e.g. 1GB Daily",
                },
                {
                  label: "Plan Code *",
                  key: "planCode",
                  type: "text",
                  placeholder: "e.g. mtn-1gb",
                },
                {
                  label: "Validity (days)",
                  key: "validity",
                  type: "text",
                  placeholder: "e.g. 30",
                },
                {
                  label: "User Price (₦) *",
                  key: "userPrice",
                  type: "number",
                  placeholder: "200",
                },
                {
                  label: "Buying Price (₦)",
                  key: "buyingPrice",
                  type: "number",
                  placeholder: "180",
                },
                {
                  label: "Vendor Price (₦)",
                  key: "vendorPrice",
                  type: "number",
                  placeholder: "185",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: ".8rem",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: ".375rem",
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      padding: ".75rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: ".875rem",
                      fontFamily: "inherit",
                      fontSize: ".9rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Sticky footer */}
            <div
              style={{
                display: "flex",
                gap: ".75rem",
                padding: "1.25rem 2rem 1.5rem",
                borderTop: "1px solid #f1f5f9",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setModal(null)}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  borderRadius: ".875rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: ".875rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                }}
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
