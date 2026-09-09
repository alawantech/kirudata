"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Link2,
  Eye,
  EyeOff,
  KeyRound,
  ChevronDown,
  Check,
} from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const SERVICE_TYPES = [
  "Wallet",
  "Airtime",
  "Data",
  "Cable",
  "CableVer",
  "Electricity",
  "ElectricityVer",
  "Exam",
  "Sms",
  "DataCard",
  "RechargeCard",
];

const AUTH_TYPES = [
  { value: "basic", label: "Basic Auth (2-step)" },
  { value: "token", label: "Token" },
  { value: "subwallet", label: "SubWallet" },
  { value: "vtpass", label: "VTPass" },
  { value: "direct_token", label: "Direct Token" },
];

const TYPE_COLORS = {
  Wallet: "#0284c7",
  Airtime: "#f59e0b",
  Data: "#16a34a",
  Cable: "#ea580c",
  CableVer: "#c2410c",
  Electricity: "#d97706",
  ElectricityVer: "#b45309",
  Exam: "#7c3aed",
  Sms: "#0891b2",
  DataCard: "#7c3aed",
  RechargeCard: "#16a34a",
};

const EMPTY_LINK_FORM = {
  selectedProviderId: "",
  name: "",
  value: "",
  type: "",
  apiKey: "",
};
const EMPTY_PROV_FORM = { name: "", apiKey: "", baseUrl: "", authType: "basic" };

export default function ApiLinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");

  const [providers, setProviders] = useState([]);
  const [provLibOpen, setProvLibOpen] = useState(false);
  const [provDeleting, setProvDeleting] = useState(null);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_LINK_FORM);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [provModal, setProvModal] = useState(false);
  const [provForm, setProvForm] = useState(EMPTY_PROV_FORM);
  const [showProvKey, setShowProvKey] = useState(false);
  const [provSaving, setProvSaving] = useState(false);

  const [editingProvId, setEditingProvId] = useState(null);
  const [editProvForm, setEditProvForm] = useState({});
  const [showEditKey, setShowEditKey] = useState(false);

  const loadLinks = () => {
    setLoading(true);
    adminApi
      .get("/admin/api-links")
      .then((r) => setLinks(r.data.data?.links || []))
      .catch(() => toast.error("Failed to load API links"))
      .finally(() => setLoading(false));
  };

  const loadProviders = () => {
    adminApi
      .get("/admin/providers")
      .then((r) => setProviders(r.data.data?.providers || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadLinks();
    loadProviders();
  }, []);

  const openAddToLibrary = () => {
    setProvForm(EMPTY_PROV_FORM);
    setShowProvKey(false);
    setProvModal(true);
  };

  const saveProviderToLibrary = async () => {
    if (!provForm.name.trim()) return toast.error("Provider name is required.");
    setProvSaving(true);
    try {
      const r = await adminApi.post("/admin/providers", {
        name: provForm.name.trim(),
        apiKey: provForm.apiKey.trim(),
        baseUrl: provForm.baseUrl.trim(),
        authType: provForm.authType,
      });
      const newProv = r.data.data?.provider;
      if (newProv) setProviders((prev) => [...prev, newProv]);
      if (modal && newProv) {
        setForm((f) => ({
          ...f,
          selectedProviderId: String(newProv.id),
          name: newProv.name,
          apiKey: newProv.apiKey || "",
        }));
      }
      setProvModal(false);
      setProvForm(EMPTY_PROV_FORM);
      toast.success(`"${provForm.name}" added to library.`);
    } catch {
      toast.error("Failed to save provider.");
    } finally {
      setProvSaving(false);
    }
  };

  const startEditProv = (p) => {
    setEditingProvId(p.id);
    setEditProvForm({
      name: p.name || "",
      apiKey: p.apiKey || "",
      baseUrl: p.baseUrl || "",
      authType: p.authType || "basic",
    });
    setShowEditKey(false);
  };

  const cancelEditProv = () => {
    setEditingProvId(null);
    setEditProvForm({});
  };

  const saveEditProv = async (p) => {
    if (!editProvForm.name.trim()) return toast.error("Name is required.");
    try {
      const r = await adminApi.put(`/admin/providers/${p.id}`, {
        name: editProvForm.name.trim(),
        apiKey: editProvForm.apiKey.trim(),
        baseUrl: editProvForm.baseUrl.trim(),
        authType: editProvForm.authType,
      });
      const updated = r.data.data?.provider;
      if (updated) {
        setProviders((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      }
      setEditingProvId(null);
      toast.success("Provider updated.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  const deleteProvider = async (p) => {
    if (!confirm(`Remove "${p.name}" from the library?`)) return;
    setProvDeleting(p.id);
    try {
      await adminApi.delete(`/admin/providers/${p.id}`);
      setProviders((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Removed from library.");
    } catch {
      toast.error("Failed to remove.");
    } finally {
      setProvDeleting(null);
    }
  };

  const openAdd = () => {
    setForm(EMPTY_LINK_FORM);
    setShowKey(false);
    setModal({ mode: "add" });
  };

  const openEdit = (link) => {
    const matched = providers.find((p) => p.name === link.name);
    setForm({
      selectedProviderId: matched ? String(matched.id) : "",
      name: link.name,
      value: link.value || "",
      type: link.type || "",
      apiKey: link.apiKey || "",
    });
    setShowKey(false);
    setModal({ mode: "edit", link });
  };

  const handleProviderSelect = (e) => {
    const val = e.target.value;
    if (val === "__add_new__") {
      openAddToLibrary();
      return;
    }
    const p = providers.find((x) => String(x.id) === val);
    if (p) {
      setForm((f) => ({
        ...f,
        selectedProviderId: val,
        name: p.name,
        apiKey: p.apiKey || "",
      }));
    } else {
      setForm((f) => ({ ...f, selectedProviderId: "", name: "", apiKey: "" }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Please select or enter a provider.");
    if (!form.value.trim()) return toast.error("API URL is required.");
    if (!form.type) return toast.error("Service type is required.");
    setSaving(true);
    try {
      const payload = { name: form.name, value: form.value, type: form.type, apiKey: form.apiKey };
      if (modal.mode === "add") {
        await adminApi.post("/admin/api-links", payload);
        toast.success("API link added.");
      } else {
        await adminApi.put(`/admin/api-links/${modal.link.id}`, payload);
        toast.success("API link updated.");
      }
      setModal(null);
      loadLinks();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this API link?")) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/api-links/${id}`);
      toast.success("Deleted.");
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = filterType === "All" ? links : links.filter((l) => l.type === filterType);

  const maskKey = (key) => {
    if (!key) return "—";
    if (key.length <= 8) return "●".repeat(key.length);
    return key.slice(0, 4) + "●●●●" + key.slice(-3);
  };

  const AUTH_LABEL = Object.fromEntries(AUTH_TYPES.map((a) => [a.value, a.label]));

  const s = {
    page: { padding: "1.5rem", maxWidth: 1100, margin: "0 auto" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: ".75rem" },
    title: { fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: ".5rem" },
    btn: (color = "#2563eb") => ({ display: "flex", alignItems: "center", gap: ".4rem", background: color, color: "white", border: "none", borderRadius: ".625rem", padding: ".55rem 1.1rem", cursor: "pointer", fontWeight: 700, fontSize: ".82rem", fontFamily: "inherit" }),
    libCard: { background: "white", borderRadius: "1rem", border: "1.5px solid #e2e8f0", marginBottom: "1.25rem", overflow: "hidden" },
    libHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".875rem 1.25rem", borderBottom: "1.5px solid #e2e8f0", background: "#f8fafc", cursor: "pointer" },
    libTitle: { fontWeight: 800, fontSize: ".95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: ".5rem" },
    libSubtitle: { fontSize: ".78rem", color: "#64748b", marginTop: ".15rem" },
    libRow: { display: "grid", gridTemplateColumns: "1.5fr 2.5fr 2fr 1.5fr 1fr", padding: ".7rem 1.25rem", alignItems: "center", borderBottom: "1px solid #f1f5f9", gap: ".75rem" },
    libEmpty: { padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: ".875rem" },
    filterRow: { display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: "1.25rem" },
    filterBtn: (active, color) => ({ padding: ".35rem .9rem", borderRadius: "2rem", border: `2px solid ${active ? color : "#e2e8f0"}`, background: active ? color : "white", color: active ? "white" : "#64748b", fontWeight: 700, fontSize: ".75rem", cursor: "pointer", fontFamily: "inherit" }),
    card: { background: "white", borderRadius: "1rem", border: "1.5px solid #e2e8f0", overflow: "hidden" },
    tableHead: { background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", display: "grid", gridTemplateColumns: "2fr 3fr 2fr 1.2fr 1fr", padding: ".65rem 1.25rem", gap: "1rem" },
    thCell: { fontSize: ".73rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" },
    row: (i) => ({ display: "grid", gridTemplateColumns: "2fr 3fr 2fr 1.2fr 1fr", padding: ".85rem 1.25rem", gap: "1rem", alignItems: "center", borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }),
    maskedKey: { fontSize: ".75rem", fontFamily: "monospace", color: "#64748b", background: "#f1f5f9", padding: ".15rem .5rem", borderRadius: ".35rem", wordBreak: "break-all" },
    badge: (type) => ({ display: "inline-block", padding: ".2rem .7rem", borderRadius: "2rem", background: `${TYPE_COLORS[type] || "#64748b"}18`, color: TYPE_COLORS[type] || "#64748b", fontWeight: 700, fontSize: ".72rem" }),
    url: { fontSize: ".78rem", color: "#64748b", wordBreak: "break-all", fontFamily: "monospace" },
    actionRow: { display: "flex", gap: ".4rem" },
    iconBtn: (color) => ({ background: `${color}15`, border: "none", borderRadius: ".5rem", padding: ".35rem .5rem", cursor: "pointer", color, display: "flex", alignItems: "center" }),
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem" },
    modalBox: { background: "white", borderRadius: "1rem", width: "100%", maxWidth: 480, padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,.18)" },
    label: { display: "block", fontSize: ".76rem", fontWeight: 700, color: "#475569", marginBottom: ".3rem", textTransform: "uppercase", letterSpacing: ".04em" },
    input: { width: "100%", padding: ".6rem .875rem", border: "1.5px solid #e2e8f0", borderRadius: ".625rem", fontSize: ".875rem", color: "#0f172a", fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" },
    inputSmall: { width: "100%", padding: ".45rem .65rem", border: "1.5px solid #e2e8f0", borderRadius: ".5rem", fontSize: ".8rem", color: "#0f172a", fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" },
    select: { width: "100%", padding: ".6rem .875rem", border: "1.5px solid #e2e8f0", borderRadius: ".625rem", fontSize: ".875rem", color: "#0f172a", fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box", cursor: "pointer" },
    selectSmall: { width: "100%", padding: ".45rem .65rem", border: "1.5px solid #e2e8f0", borderRadius: ".5rem", fontSize: ".8rem", color: "#0f172a", fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box", cursor: "pointer" },
    formGroup: { marginBottom: "1rem" },
    modalFooter: { display: "flex", gap: ".6rem", justifyContent: "flex-end", marginTop: "1.5rem" },
    cancelBtn: { padding: ".55rem 1.1rem", borderRadius: ".625rem", border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 700, fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit" },
    keyBadge: { display: "inline-flex", alignItems: "center", gap: ".35rem", padding: ".35rem .75rem", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: ".5rem", fontSize: ".78rem", color: "#15803d", fontFamily: "monospace" },
    authBadge: { display: "inline-block", padding: ".15rem .55rem", borderRadius: "2rem", background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: ".7rem" },
    editRow: { display: "grid", gridTemplateColumns: "1.5fr 2.5fr 2fr 1.5fr 1fr", padding: ".5rem 1.25rem", alignItems: "center", borderBottom: "1px solid #e2e8f0", gap: ".75rem", background: "#fefce8" },
  };

  return (
    <RequirePermission permission="api_links_manage">
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>
          <Link2 size={20} color="#2563eb" />
          API Providers
        </div>
        <button style={s.btn()} onClick={openAdd}>
          <Plus size={15} /> Add Provider Link
        </button>
      </div>

      {/* ── Provider Library ── */}
      <div style={s.libCard}>
        <div style={s.libHeader} onClick={() => setProvLibOpen((v) => !v)}>
          <div>
            <div style={s.libTitle}>
              <KeyRound size={16} color="#7c3aed" />
              Provider Library
              {providers.length > 0 && (
                <span style={{ background: "#ede9fe", color: "#7c3aed", borderRadius: "2rem", padding: ".1rem .55rem", fontSize: ".72rem", fontWeight: 800 }}>
                  {providers.length}
                </span>
              )}
            </div>
            <div style={s.libSubtitle}>
              Add your provider names, API keys &amp; endpoints once — select them from a dropdown when adding links below
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <button style={s.btn("#7c3aed")} onClick={(e) => { e.stopPropagation(); openAddToLibrary(); }}>
              <Plus size={13} /> Add to Library
            </button>
            <ChevronDown size={16} color="#94a3b8" style={{ transform: provLibOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </div>
        </div>

        {provLibOpen && (
          <div>
            {providers.length === 0 ? (
              <div style={s.libEmpty}>
                No providers in library yet.{" "}
                <span style={{ color: "#7c3aed", cursor: "pointer", fontWeight: 700 }} onClick={openAddToLibrary}>Add one now →</span>
              </div>
            ) : (
              <>
                <div style={{ ...s.libRow, background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  <span style={s.thCell}>Provider Name</span>
                  <span style={s.thCell}>API Key</span>
                  <span style={s.thCell}>API URL</span>
                  <span style={s.thCell}>Auth Type</span>
                  <span style={s.thCell}></span>
                </div>
                {providers.map((p) =>
                  editingProvId === p.id ? (
                    <div key={p.id} style={s.editRow}>
                      <input style={s.inputSmall} value={editProvForm.name} onChange={(e) => setEditProvForm((f) => ({ ...f, name: e.target.value }))} placeholder="Provider name" />
                      <div style={{ position: "relative" }}>
                        <input style={{ ...s.inputSmall, paddingRight: "2rem", fontFamily: "monospace", fontSize: ".75rem" }} type={showEditKey ? "text" : "password"} value={editProvForm.apiKey} onChange={(e) => setEditProvForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="API key" />
                        <button type="button" onClick={() => setShowEditKey((v) => !v)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                          {showEditKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                      <input style={{ ...s.inputSmall, fontFamily: "monospace", fontSize: ".75rem" }} value={editProvForm.baseUrl} onChange={(e) => setEditProvForm((f) => ({ ...f, baseUrl: e.target.value }))} placeholder="https://..." />
                      <select style={s.selectSmall} value={editProvForm.authType} onChange={(e) => setEditProvForm((f) => ({ ...f, authType: e.target.value }))}>
                        {AUTH_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                      <div style={s.actionRow}>
                        <button style={s.iconBtn("#16a34a")} onClick={() => saveEditProv(p)} title="Save"><Check size={13} /></button>
                        <button style={s.iconBtn("#64748b")} onClick={cancelEditProv} title="Cancel"><X size={13} /></button>
                      </div>
                    </div>
                  ) : (
                    <div key={p.id} style={s.libRow}>
                      <span style={{ fontWeight: 700, fontSize: ".875rem", color: "#0f172a" }}>{p.name}</span>
                      <span style={s.maskedKey}>{maskKey(p.apiKey)}</span>
                      <span style={{ fontSize: ".75rem", fontFamily: "monospace", color: p.baseUrl ? "#0f172a" : "#cbd5e1", wordBreak: "break-all" }}>
                        {p.baseUrl || "—"}
                      </span>
                      <span style={s.authBadge}>{AUTH_LABEL[p.authType] || p.authType || "—"}</span>
                      <div style={s.actionRow}>
                        <button style={s.iconBtn("#2563eb")} onClick={() => startEditProv(p)} title="Edit"><Pencil size={13} /></button>
                        <button style={s.iconBtn("#dc2626")} onClick={() => deleteProvider(p)} disabled={provDeleting === p.id} title="Remove"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={s.filterRow}>
        {["All", ...SERVICE_TYPES].map((t) => (
          <button key={t} style={s.filterBtn(filterType === t, TYPE_COLORS[t] || "#2563eb")} onClick={() => setFilterType(t)}>{t}</button>
        ))}
      </div>

      {/* Links table */}
      <div style={s.card}>
        <div style={s.tableHead}>
          <span style={s.thCell}>Provider</span>
          <span style={s.thCell}>API URL</span>
          <span style={s.thCell}>API Key</span>
          <span style={s.thCell}>Service Type</span>
          <span style={s.thCell}>Actions</span>
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: ".875rem" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8", fontSize: ".875rem" }}>
            No API links found.{" "}
            <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 700 }} onClick={openAdd}>Add one now →</span>
          </div>
        ) : (
          filtered.map((link, i) => (
            <div key={link.id} style={s.row(i)}>
              <span style={{ fontWeight: 700, fontSize: ".875rem", color: "#0f172a" }}>{link.name}</span>
              <span style={s.url}>{link.value || "—"}</span>
              <span style={s.maskedKey}>{maskKey(link.apiKey)}</span>
              <span style={s.badge(link.type)}>{link.type}</span>
              <div style={s.actionRow}>
                <button style={s.iconBtn("#2563eb")} onClick={() => openEdit(link)} title="Edit"><Pencil size={13} /></button>
                <button style={s.iconBtn("#dc2626")} onClick={() => handleDelete(link.id)} disabled={deletingId === link.id} title="Delete"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Add/Edit Link Modal ── */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modalBox}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{modal.mode === "add" ? "Add API Link" : "Edit API Link"}</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Provider</label>
              <select style={s.select} value={form.selectedProviderId} onChange={handleProviderSelect}>
                <option value="">— Select a provider —</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="__add_new__">＋ Add new provider to library…</option>
              </select>
              {form.selectedProviderId && form.apiKey && (
                <div style={{ marginTop: ".4rem" }}>
                  <span style={s.keyBadge}>API key auto-loaded: {maskKey(form.apiKey)}</span>
                </div>
              )}
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>API URL (Endpoint)</label>
              <input style={s.input} placeholder="e.g. https://dorosub.com/api/data/" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Service Type</label>
              <select style={s.select} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="">Select service type</option>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button style={s.btn()} onClick={handleSave} disabled={saving}><Save size={14} />{saving ? "Saving…" : "Save Link"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Provider to Library Modal ── */}
      {provModal && (
        <div style={{ ...s.overlay, zIndex: 1000 }}>
          <div style={{ ...s.modalBox, maxWidth: 480, border: "2px solid #ede9fe" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <KeyRound size={16} color="#7c3aed" />
                  Add Provider to Library
                </div>
                <p style={{ margin: ".25rem 0 0", fontSize: ".78rem", color: "#64748b" }}>
                  Save once — select from dropdown anytime
                </p>
              </div>
              <button onClick={() => setProvModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Provider Name</label>
              <input style={s.input} placeholder="e.g. Dorosub, First-sub, MBC Data" value={provForm.name} autoFocus onChange={(e) => setProvForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>API URL</label>
              <input style={{ ...s.input, fontFamily: "monospace", fontSize: ".85rem" }} placeholder="e.g. https://dorosub.com/api/data" value={provForm.baseUrl} onChange={(e) => setProvForm((f) => ({ ...f, baseUrl: e.target.value }))} />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>API Key</label>
              <div style={{ position: "relative" }}>
                <input style={{ ...s.input, paddingRight: "2.5rem", fontFamily: "monospace" }} type={showProvKey ? "text" : "password"} placeholder="Paste your API key / token" value={provForm.apiKey} onChange={(e) => setProvForm((f) => ({ ...f, apiKey: e.target.value }))} />
                <button type="button" onClick={() => setShowProvKey((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                  {showProvKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Auth Type</label>
              <select style={s.select} value={provForm.authType} onChange={(e) => setProvForm((f) => ({ ...f, authType: e.target.value }))}>
                {AUTH_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setProvModal(false)}>Cancel</button>
              <button style={s.btn("#7c3aed")} onClick={saveProviderToLibrary} disabled={provSaving}><Save size={14} />{provSaving ? "Saving…" : "Save to Library"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
