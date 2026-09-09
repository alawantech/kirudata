"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Link,
  Shield,
} from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import { useAdmin } from "@/context/AdminContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORKS = [
  { id: "mtn", label: "MTN", color: "#f59e0b" },
  { id: "glo", label: "GLO", color: "#16a34a" },
  { id: "airtel", label: "Airtel", color: "#dc2626" },
  { id: "9mobile", label: "9Mobile", color: "#0d9488" },
];

const DATA_TYPES = [
  { key: "sme", label: "SME Data" },
  { key: "gifting", label: "Gifting Data" },
  { key: "Cooperate Gifting", label: "Cooperate Gifting Data" },
];

const AIRTIME_TYPES = [
  { key: "vtu", label: "Airtime (VTU)" },
  { key: "sharesell", label: "Airtime (Share & Sell)" },
];

const BILLS_SERVICES = [
  { key: "cable_verification", label: "Cable TV – IUC Verification" },
  { key: "cable", label: "Cable TV – Subscription" },
  {
    key: "electricity_verification",
    label: "Electricity – Meter Verification",
  },
  { key: "electricity", label: "Electricity – Purchase" },
  { key: "exam", label: "Exam / Result Checker" },
];

const AUTH_TYPES = [
  { value: "token", label: "Token (mobile_number / plan format)" },
  {
    value: "direct_token",
    label: "Direct Token (phone / data_plan format — Dorosub, Legitdataway)",
  },
  { value: "basic", label: "Basic Auth (Base64)" },
  { value: "vtpass", label: "VTPass" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: "24px",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    marginBottom: 4,
  },
  pageDesc: { color: "#64748b", fontSize: 13, marginBottom: 28 },

  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    marginBottom: 28,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid #334155",
    background: "#1a2744",
  },
  cardTitle: { fontWeight: 700, fontSize: 15, color: "#f1f5f9" },
  cardSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },

  tabRow: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  tab: (active, color) => ({
    padding: "9px 20px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    background: active ? color : "#1e293b",
    color: active ? "#fff" : "#94a3b8",
  }),

  section: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderBottom: "1px solid #334155",
    background: "#1a2744",
  },
  sectionTitle: { fontWeight: 700, fontSize: 13, color: "#e2e8f0" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "9px 14px",
    background: "#0f172a",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "11px 14px",
    borderBottom: "1px solid #1e293b",
    fontSize: 13,
    color: "#e2e8f0",
    verticalAlign: "middle",
  },
  trActive: { background: "#0d1f0f" },

  btnAdd: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  btnAssign: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 14px",
    background: "#0891b2",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  btnEdit: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 6,
    padding: "4px 9px",
    cursor: "pointer",
    fontSize: 12,
  },
  btnDel: {
    background: "transparent",
    border: "1px solid #7f1d1d",
    color: "#f87171",
    borderRadius: 6,
    padding: "4px 9px",
    cursor: "pointer",
    fontSize: 12,
  },

  toggleOn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#22c55e",
    padding: 0,
    display: "flex",
  },
  toggleOff: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#475569",
    padding: 0,
    display: "flex",
  },
  activeBadge: {
    padding: "2px 8px",
    borderRadius: 99,
    background: "#14532d",
    color: "#4ade80",
    fontSize: 11,
    fontWeight: 700,
  },
  inactiveBadge: {
    padding: "2px 8px",
    borderRadius: 99,
    background: "#1e293b",
    color: "#64748b",
    fontSize: 11,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.75)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 14,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  mHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px",
    borderBottom: "1px solid #334155",
  },
  mBody: {
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },
  mFoot: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    padding: "14px 22px",
    borderTop: "1px solid #334155",
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    boxSizing: "border-box",
  },
  inputWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
  },
  hint: { fontSize: 11, color: "#475569", marginTop: 4 },

  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnGhost: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  empty: { padding: "14px 18px", color: "#475569", fontSize: 13 },
  noProvider: {
    padding: "10px 18px",
    color: "#475569",
    fontSize: 13,
    fontStyle: "italic",
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProviderManagerPage() {
  const { admin, hasPermission } = useAdmin();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNet, setActiveNet] = useState("mtn");
  const [provModal, setProvModal] = useState(null);
  const [provForm, setProvForm] = useState({
    name: "",
    apiKey: "",
    apiSecret: "",
    authType: "basic",
    notes: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [provSaving, setProvSaving] = useState(false);

  // Service assignment modal
  const [svcModal, setSvcModal] = useState(null);
  const [svcForm, setSvcForm] = useState({
    providerId: "",
    serviceUrl: "",
    networkCode: "",
  });
  const [svcSaving, setSvcSaving] = useState(false);

  const [toggling, setToggling] = useState(null);

  if (!hasPermission("data_plans_manage")) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 1rem", opacity: .3 }} />
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Access Denied</h2>
        <p style={{ fontSize: ".85rem" }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/providers")
      .then((r) => setProviders(r.data.data?.providers || []))
      .catch(() => toast.error("Failed to load providers"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const serviceAssignments = (serviceKey) => {
    const out = [];
    for (const p of providers) {
      for (const svc of p.services || []) {
        if (svc.serviceKey === serviceKey)
          out.push({ ...svc, providerName: p.name, providerId: p.id });
      }
    }
    return out;
  };

  const maskKey = (key) => {
    if (!key) return "—";
    if (key.length <= 8) return "●".repeat(key.length);
    return key.slice(0, 4) + "●●●●" + key.slice(-4);
  };

  // ── Provider Library actions ──────────────────────────────────────────────
  const openAddProvider = () => {
    setProvForm({
      name: "",
      apiKey: "",
      apiSecret: "",
      authType: "basic",
      notes: "",
    });
    setShowKey(false);
    setProvModal({ mode: "add" });
  };
  const openEditProvider = (p) => {
    setProvForm({
      name: p.name,
      apiKey: p.apiKey,
      apiSecret: p.apiSecret || "",
      authType: p.authType,
      notes: p.notes || "",
    });
    setShowKey(false);
    setProvModal({ mode: "edit", provider: p });
  };
  const saveProvider = async () => {
    if (!provForm.name.trim()) return toast.error("Provider name is required.");
    setProvSaving(true);
    try {
      if (provModal.mode === "add") {
        await adminApi.post("/admin/providers", provForm);
        toast.success("Provider added to library.");
      } else {
        await adminApi.put(`/admin/providers/${provModal.provider.id}`, provForm);
        toast.success("Provider updated.");
      }
      setProvModal(null);
      load();
    } catch {
      toast.error("Failed to save provider.");
    } finally {
      setProvSaving(false);
    }
  };
  const deleteProvider = async (p) => {
    if (
      !confirm(
        `Delete provider "${p.name}"? This will also remove all service assignments.`,
      )
    )
      return;
    try {
      await adminApi.delete(`/admin/providers/${p.id}`);
      toast.success("Provider deleted.");
      load();
    } catch {
      toast.error("Failed to delete provider.");
    }
  };

  // ── Service assignment actions ─────────────────────────────────────────────
  const openAssign = (serviceKey, serviceLabel, existingService = null) => {
    setSvcForm({
      providerId: existingService ? String(existingService.providerId) : "",
      serviceUrl: existingService?.serviceUrl || "",
      networkCode: existingService?.networkCode || "",
    });
    setSvcModal({ serviceKey, serviceLabel, existingService });
  };
  const saveAssignment = async () => {
    if (!svcForm.providerId) return toast.error("Please select a provider.");
    if (!svcForm.serviceUrl.trim())
      return toast.error("Service URL is required.");
    setSvcSaving(true);
    try {
      await adminApi.post(`/admin/providers/${svcForm.providerId}/services`, {
        serviceKey: svcModal.serviceKey,
        serviceUrl: svcForm.serviceUrl.trim(),
        networkCode: svcForm.networkCode.trim(),
      });
      toast.success("Provider assigned to service.");
      setSvcModal(null);
      load();
    } catch {
      toast.error("Failed to assign provider.");
    } finally {
      setSvcSaving(false);
    }
  };
  const removeAssignment = async (svc) => {
    if (!confirm("Remove this provider from the service?")) return;
    try {
      await adminApi.delete(`/admin/providers/${svc.providerId}/services/${svc.id}`);
      toast.success("Removed.");
      load();
    } catch {
      toast.error("Failed to remove.");
    }
  };
  const handleToggle = async (svc) => {
    setToggling(svc.id);
    try {
      await adminApi.patch(
        `/admin/providers/${svc.providerId}/services/${svc.id}/toggle`,
      );
      load();
    } catch {
      toast.error("Toggle failed.");
    } finally {
      setToggling(null);
    }
  };

  // ── Service Section ───────────────────────────────────────────────────────
  const ServiceSection = ({ serviceKey, label }) => {
    const assignments = serviceAssignments(serviceKey);
    return (
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>{label}</span>
          <button
            style={S.btnAssign}
            onClick={() => openAssign(serviceKey, label)}
          >
            <Link size={12} /> Assign Provider
          </button>
        </div>
        {assignments.length === 0 ? (
          <div style={S.noProvider}>
            No provider assigned — click "Assign Provider"
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Provider</th>
                <th style={S.th}>Service URL</th>
                <th style={S.th}>Network ID</th>
                <th style={S.th}>Active</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((svc) => (
                <tr key={svc.id} style={svc.isActive ? S.trActive : {}}>
                  <td style={S.td}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: svc.isActive ? "#86efac" : "#e2e8f0",
                      }}
                    >
                      {svc.providerName}
                    </span>
                  </td>
                  <td style={{ ...S.td, maxWidth: 220 }}>
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: 12,
                        wordBreak: "break-all",
                      }}
                    >
                      {svc.serviceUrl || "—"}
                    </span>
                  </td>
                  <td style={S.td}>
                    <code style={{ color: "#a78bfa" }}>
                      {svc.networkCode || "—"}
                    </code>
                  </td>
                  <td style={S.td}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <button
                        style={svc.isActive ? S.toggleOn : S.toggleOff}
                        onClick={() => handleToggle(svc)}
                        disabled={toggling === svc.id}
                        title={
                          svc.isActive
                            ? "Active — click to deactivate"
                            : "Inactive — click to activate"
                        }
                      >
                        {svc.isActive ? (
                          <ToggleRight size={24} />
                        ) : (
                          <ToggleLeft size={24} />
                        )}
                      </button>
                      <span
                        style={svc.isActive ? S.activeBadge : S.inactiveBadge}
                      >
                        {svc.isActive ? "Active" : "Off"}
                      </span>
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={S.btnEdit}
                        onClick={() => openAssign(serviceKey, label, svc)}
                        title="Edit assignment"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        style={S.btnDel}
                        onClick={() => removeAssignment(svc)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const currentNet = NETWORKS.find((n) => n.id === activeNet);

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>API Providers</h1>
      <p style={S.pageDesc}>
        Define your providers once (name + API key), then assign them to each
        service below. The URL is set per-service since different services use
        different endpoints.
      </p>

      {/* ── Provider Library ── */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardTitle}>Provider Library</div>
            <div style={S.cardSubtitle}>
              Add your providers once — API key is stored here and reused
              automatically
            </div>
          </div>
          <button style={S.btnAdd} onClick={openAddProvider}>
            <Plus size={13} /> Add Provider
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "20px 18px", color: "#64748b", fontSize: 13 }}>
            Loading…
          </div>
        ) : providers.length === 0 ? (
          <div style={S.empty}>
            No providers yet. Click "Add Provider" to get started.
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Provider Name</th>
                <th style={S.th}>API Key</th>
                <th style={S.th}>Auth Type</th>
                <th style={S.th}>Used by</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{p.name}</td>
                  <td style={S.td}>
                    <code style={{ color: "#22d3ee", fontSize: 12 }}>
                      {maskKey(p.apiKey)}
                    </code>
                  </td>
                  <td style={S.td}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        textTransform: "capitalize",
                      }}
                    >
                      {p.authType}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      {(p.services || []).length} service
                      {(p.services || []).length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={S.btnEdit}
                        onClick={() => openEditProvider(p)}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        style={S.btnDel}
                        onClick={() => deleteProvider(p)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Service Assignment ── */}
      <div
        style={{
          marginBottom: 16,
          fontWeight: 700,
          fontSize: 13,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Service Assignments
      </div>

      <div style={S.tabRow}>
        {NETWORKS.map((n) => (
          <button
            key={n.id}
            style={S.tab(activeNet === n.id, n.color)}
            onClick={() => setActiveNet(n.id)}
          >
            {n.label}
          </button>
        ))}
        <button
          style={S.tab(activeNet === "bills", "#7c3aed")}
          onClick={() => setActiveNet("bills")}
        >
          Bills
        </button>
      </div>

      {!loading &&
        (activeNet === "bills" ? (
          <div>
            {BILLS_SERVICES.map((svc) => (
              <ServiceSection
                key={svc.key}
                serviceKey={svc.key}
                label={svc.label}
              />
            ))}
          </div>
        ) : (
          <div>
            <div
              style={{
                marginBottom: 8,
                fontSize: 11,
                fontWeight: 700,
                color: "#f59e0b",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Airtime
            </div>
            {AIRTIME_TYPES.map((t) => (
              <ServiceSection
                key={t.key}
                serviceKey={`${activeNet}_${t.key}`}
                label={`${currentNet.label} – ${t.label}`}
              />
            ))}
            <div
              style={{
                marginTop: 20,
                marginBottom: 8,
                fontSize: 11,
                fontWeight: 700,
                color: "#16a34a",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Data
            </div>
            {DATA_TYPES.map((t) => (
              <ServiceSection
                key={t.key}
                serviceKey={`${activeNet}_${t.key}`}
                label={`${currentNet.label} – ${t.label}`}
              />
            ))}
          </div>
        ))}

      {/* ── Provider Library Modal ── */}
      {provModal && (
        <div style={S.overlay} onClick={() => setProvModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.mHead}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>
                {provModal.mode === "add"
                  ? "Add Provider"
                  : `Edit — ${provModal.provider.name}`}
              </span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
                onClick={() => setProvModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={S.mBody}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "#0f172a",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                Enter your provider credentials{" "}
                <strong style={{ color: "#94a3b8" }}>once</strong>. The API key
                will be reused automatically for every service you assign this
                provider to.
              </div>

              <div>
                <label style={S.label}>Provider Name *</label>
                <input
                  style={S.input}
                  value={provForm.name}
                  onChange={(e) =>
                    setProvForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Dorosub, N3TData, VTPass"
                />
              </div>

              <div>
                <label style={S.label}>Auth Type</label>
                <select
                  style={S.input}
                  value={provForm.authType}
                  onChange={(e) =>
                    setProvForm((f) => ({ ...f, authType: e.target.value }))
                  }
                >
                  {AUTH_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={S.label}>API Key *</label>
                <div style={S.inputWrap}>
                  <input
                    style={S.input}
                    type={showKey ? "text" : "password"}
                    value={provForm.apiKey}
                    onChange={(e) =>
                      setProvForm((f) => ({ ...f, apiKey: e.target.value }))
                    }
                    placeholder={
                      provForm.authType === "basic"
                        ? "Your base64-encoded credentials"
                        : "Your API key / token"
                    }
                  />
                  <button
                    style={S.eyeBtn}
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {provForm.authType === "basic" && (
                  <p style={S.hint}>
                    For Basic Auth, paste the base64-encoded value (e.g.
                    Z3dhcnpv…).
                  </p>
                )}
              </div>

              <div>
                <label style={S.label}>API Secret (optional)</label>
                <input
                  style={S.input}
                  type="password"
                  value={provForm.apiSecret}
                  onChange={(e) =>
                    setProvForm((f) => ({ ...f, apiSecret: e.target.value }))
                  }
                  placeholder="Secondary secret if required"
                />
              </div>

              <div>
                <label style={S.label}>Notes (optional)</label>
                <input
                  style={S.input}
                  value={provForm.notes}
                  onChange={(e) =>
                    setProvForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="e.g. Test account, SME only, etc."
                />
              </div>
            </div>
            <div style={S.mFoot}>
              <button style={S.btnGhost} onClick={() => setProvModal(null)}>
                Cancel
              </button>
              <button
                style={S.btnPrimary}
                onClick={saveProvider}
                disabled={provSaving}
              >
                <Save size={14} />{" "}
                {provSaving
                  ? "Saving…"
                  : provModal.mode === "add"
                    ? "Save Provider"
                    : "Update Provider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Service Assignment Modal ── */}
      {svcModal && (
        <div style={S.overlay} onClick={() => setSvcModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.mHead}>
              <div>
                <span
                  style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}
                >
                  Assign Provider
                </span>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                  {svcModal.serviceLabel}
                </div>
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
                onClick={() => setSvcModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={S.mBody}>
              {providers.length === 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#1e3a4f",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#7dd3fc",
                  }}
                >
                  No providers in library yet. Add a provider first, then come
                  back here to assign it.
                </div>
              )}

              <div>
                <label style={S.label}>Provider *</label>
                <select
                  style={S.input}
                  value={svcForm.providerId}
                  onChange={(e) =>
                    setSvcForm((f) => ({ ...f, providerId: e.target.value }))
                  }
                >
                  <option value="">— Select a provider —</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.authType})
                    </option>
                  ))}
                </select>
                <p style={S.hint}>
                  The API key is taken automatically from the selected provider
                  — no need to type it again.
                </p>
              </div>

              <div>
                <label style={S.label}>Service URL *</label>
                <input
                  style={S.input}
                  value={svcForm.serviceUrl}
                  onChange={(e) =>
                    setSvcForm((f) => ({ ...f, serviceUrl: e.target.value }))
                  }
                  placeholder="https://provider.com/api/buy-data/"
                />
                <p style={S.hint}>
                  The specific endpoint for this service. Different services
                  (airtime, SME data, gifting) often have different URLs even on
                  the same provider.
                </p>
              </div>

              <div>
                <label style={S.label}>Network Code / Network ID</label>
                <input
                  style={S.input}
                  value={svcForm.networkCode}
                  onChange={(e) =>
                    setSvcForm((f) => ({ ...f, networkCode: e.target.value }))
                  }
                  placeholder="e.g. 1 (this provider's ID for the network)"
                />
                <p style={S.hint}>
                  The ID this provider uses internally for the network. Check
                  the provider's API docs.
                </p>
              </div>
            </div>
            <div style={S.mFoot}>
              <button style={S.btnGhost} onClick={() => setSvcModal(null)}>
                Cancel
              </button>
              <button
                style={S.btnPrimary}
                onClick={saveAssignment}
                disabled={svcSaving || providers.length === 0}
              >
                <Save size={14} /> {svcSaving ? "Saving…" : "Assign Provider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
