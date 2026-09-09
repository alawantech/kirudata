"use client";
import { useEffect, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

//  -  -  -  Status toggle options  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - 

const STATUS_OPTS = [
  { value: "On", label: "Enable" },
  { value: "Off", label: "Disable" },
];

const STATUS_FIELDS = [
  { key: "networkStatus", label: "General (All Services)" },
  { key: "vtuStatus", label: "Airtime (VTU)" },
  { key: "sharesellStatus", label: "Airtime (Share & Sell)" },
  { key: "smeStatus", label: "SME Data" },
  { key: "giftingStatus", label: "Gifting Data" },
  { key: "corporateStatus", label: "Cooperate Gifting Data" },
  { key: "airtimepinStatus", label: "Recharge Card (Airtime PIN)" },
  { key: "datapinStatus", label: "Data PIN" },
];



//  -  -  -  Styles  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - 

const S = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: "24px",
    fontFamily: "Inter, sans-serif",
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-.03em",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "none",
  },

  // Network tabs
  tabRow: { display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" },
  tab: (active, color) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 22px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    background: active ? color : "#fff",
    color: active ? "#fff" : "#475569",
    boxShadow: active ? `0 0 0 2px ${color}` : "0 1px 3px rgba(0,0,0,.08)",
    transition: "all .15s",
  }),
  netCircle: (color) => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
  }),

  // Cards
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHead: {
    padding: "14px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  cardDot: (color) => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
  }),
  cardTitle: { fontWeight: 800, fontSize: 15, color: "#0f172a" },
  cardDesc: { fontSize: 12, color: "#94a3b8", marginLeft: "auto" },
  cardBody: {
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },

  // Fields
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  select: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
    background: "#fff",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },

  // Save
  saveRow: {
    padding: "0 20px 20px",
    display: "flex",
    justifyContent: "flex-end",
  },
  saveBtn: (saving) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 28px",
    background: saving ? "#94a3b8" : "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: saving ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  }),

  alert: {
    padding: "10px 16px",
    background: "#fef3c7",
    border: "1px solid #fbbf24",
    borderRadius: 8,
    fontSize: 12,
    color: "#92400e",
    marginBottom: 14,
  },
  alertRed: {
    padding: "10px 16px",
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: 8,
    fontSize: 12,
    color: "#991b1b",
    marginBottom: 14,
  },
  alertBlue: {
    padding: "10px 16px",
    background: "#eff6ff",
    border: "1px solid #93c5fd",
    borderRadius: 8,
    fontSize: 12,
    color: "#1e40af",
    marginBottom: 14,
  },

  // Provider sub-section
  providerSection: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: 16,
    marginBottom: 4,
  },
  providerHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  providerBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  providerName: { fontWeight: 800, fontSize: 14, color: "#0f172a" },
  providerSaveBtn: (saving) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 20px",
    background: saving ? "#94a3b8" : "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: saving ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    marginLeft: "auto",
  }),
};

const NETWORKS = [
  { code: "MTN", label: "MTN", color: "#f59e0b" },
  { code: "GLO", label: "GLO", color: "#16a34a" },
  { code: "AIRTEL", label: "Airtel", color: "#dc2626" },
  { code: "9MOBILE", label: "9Mobile", color: "#0d9488" },
];

//  -  -  -  Main Component  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - 

export default function NetworkSettingsPage() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCode, setActiveCode] = useState("MTN");
  const [formData, setFormData] = useState({}); // { networkId: { field: value } }
  const [saving, setSaving] = useState(false);

  // Provider-specific IDs
  const [providers, setProviders] = useState([]);
  const [providerFormData, setProviderFormData] = useState({}); // { providerSlug: { fieldKey: value } }
  const [savingProvider, setSavingProvider] = useState(null); // providerSlug being saved

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.get("/admin/networks"),
      adminApi.get("/admin/data-providers"),
    ])
      .then(([netRes, provRes]) => {
        const nets = netRes.data.data?.networks || [];
        const provs = provRes.data.data?.providers || [];
        setNetworks(nets);
        setProviders(provs);
        const fd = {};
        nets.forEach((n) => {
          fd[n.id] = { ...n };
        });
        setFormData(fd);
      })
      .catch(() => toast.error("Failed to load networks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const current = networks.find(
    (n) => n.name === activeCode || n.networkCode === activeCode,
  );
  const currentMeta = NETWORKS.find((n) => n.code === activeCode);

  // Load provider settings when active network changes
  useEffect(() => {
    if (!current || providers.length === 0) return;
    adminApi
      .get(`/admin/network-provider-settings?networkId=${current.id}`)
      .then((r) => {
        const settings = r.data.data?.settings || [];
        const pfd = {};
        // Seed defaults for all providers
        providers.forEach((p) => {
          pfd[p.slug] = { extNetworkId: "" };
        });
        // Overlay saved settings
        settings.forEach((s) => {
          if (pfd[s.providerSlug]) {
            pfd[s.providerSlug] = { extNetworkId: s.extNetworkId || "" };
          }
        });
        setProviderFormData(pfd);
      })
      .catch(() => {});
  }, [current?.id, providers.length]);

  const setField = (field, value) => {
    if (!current) return;
    setFormData((fd) => ({
      ...fd,
      [current.id]: { ...fd[current.id], [field]: value },
    }));
  };

  const getField = (field) => {
    if (!current) return "";
    return formData[current.id]?.[field] ?? current[field] ?? "";
  };

  const setProviderField = (slug, field, value) => {
    setProviderFormData((pfd) => ({
      ...pfd,
      [slug]: { ...pfd[slug], [field]: value },
    }));
  };

  const getProviderField = (slug, field) => {
    return providerFormData[slug]?.[field] ?? "";
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
      const data = { ...formData[current.id] };
      // Remove read-only relations
      delete data.airtimeDiscounts;
      delete data.dataPins;
      delete data.dataPlans;
      await adminApi.put(`/admin/networks/${current.id}`, data);
      toast.success(`${currentMeta?.label || activeCode} settings saved!`);
      load();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProvider = async (providerSlug, providerName) => {
    if (!current) return;
    setSavingProvider(providerSlug);
    try {
      const pfd = providerFormData[providerSlug] || {};
      await adminApi.post("/admin/network-provider-settings", {
        networkId: current.id,
        providerSlug,
        ...pfd,
      });
      toast.success(
        `${providerName} IDs saved for ${currentMeta?.label || activeCode}!`,
      );
    } catch {
      toast.error("Failed to save provider IDs.");
    } finally {
      setSavingProvider(null);
    }
  };

  return (
    <RequirePermission permission="networks_manage">
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <Link href="/admin/configurations" style={S.backBtn}>
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 style={S.title}>Network Settings</h1>
      </div>

      {/* Network Tabs */}
      <div style={S.tabRow}>
        {NETWORKS.map((n) => (
          <button
            key={n.code}
            style={S.tab(activeCode === n.code, n.color)}
            onClick={() => setActiveCode(n.code)}
          >
            <span style={S.netCircle(n.color)} />
            {n.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
          Loading...
        </div>
      ) : !current ? (
        <div style={S.alertRed}>
          Network "{activeCode}" not found in database. Please check your
          network seed data.
        </div>
      ) : (
        <>
          {/*  -  -  Service Status  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  */}
          <div style={S.card}>
            <div style={S.cardHead}>
              <div style={S.cardDot(currentMeta?.color || "#64748b")} />
              <span style={S.cardTitle}>
                {currentMeta?.label}  -  Service Status
              </span>
              <span style={S.cardDesc}>
                Enable or disable individual services for this network
              </span>
            </div>
            <div style={{ padding: "6px 20px 4px" }}>
              <div style={S.alert}>
                Use this section to enable or disable each service for{" "}
                {currentMeta?.label}. Disabling "General (All Services)"
                overrides everything else.
              </div>
            </div>
            <div style={S.cardBody}>
              {STATUS_FIELDS.map((f) => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  <select
                    style={S.select}
                    value={getField(f.key)}
                    onChange={(e) => setField(f.key, e.target.value)}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        currentMeta?.color || "#2563eb")
                    }
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  >
                    {STATUS_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/*  -  -  General Network IDs  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  */}
            <div style={{ padding: "4px 20px" }}>
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 16,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  {currentMeta?.label}  -  General Network IDs
                </div>
              </div>
              <div style={S.alertRed}>
                This is the fallback network ID used when no provider-specific ID
                is set for this network.
              </div>
            </div>
            <div style={{ padding: "0 20px 20px", maxWidth: 280 }}>
              <label style={S.label}>Network ID</label>
              <input
                type="text"
                style={S.input}
                value={getField("networkCode")}
                onChange={(e) => setField("networkCode", e.target.value)}
                placeholder="e.g. MTN"
                onFocus={(e) =>
                  (e.target.style.borderColor = currentMeta?.color || "#2563eb")
                }
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div style={S.saveRow}>
              <button
                style={S.saveBtn(saving)}
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={14} />{" "}
                {saving ? "Saving..." : `Save ${currentMeta?.label} Settings`}
              </button>
            </div>
          </div>

          {/*  -  -  Provider-Specific Network IDs  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  */}
          <div style={S.card}>
            <div style={S.cardHead}>
              <div style={S.cardDot(currentMeta?.color || "#64748b")} />
              <span style={S.cardTitle}>
                {currentMeta?.label}  -  Provider Network IDs
              </span>
              <span style={S.cardDesc}>
                Set network IDs per provider  -  overrides general IDs above
              </span>
            </div>
            <div style={{ padding: "6px 20px 4px" }}>
              <div style={S.alertBlue}>
                Each API provider may require different network IDs. Set them
                here per provider. When a provider is active, its IDs take
                priority over the general IDs above. Providers are added via{" "}
                <strong>Data Plans &gt; Provider Data Plans</strong>.
              </div>
            </div>

            {providers.length === 0 ? (
              <div style={{ padding: "16px 20px 20px", color: "#94a3b8", fontSize: 13 }}>
                No providers configured yet. Add providers in the Data Plans
                section first.
              </div>
            ) : (
              providers.map((provider, idx) => (
                <div
                  key={provider.slug}
                  style={{
                    padding: "0 20px 4px",
                    ...(idx > 0 && { borderTop: "1px solid #f1f5f9" }),
                  }}
                >
                  <div style={{ ...S.providerSection, ...(idx === 0 && { borderTop: "none", paddingTop: 8 }) }}>
                    <div style={S.providerHeader}>
                      <span style={S.providerName}>{provider.name}</span>
                      <span style={S.providerBadge}>{provider.slug}</span>
                    </div>
                    <div style={{ maxWidth: 280, marginBottom: 14 }}>
                      <label style={S.label}>Network ID</label>
                      <input
                        type="text"
                        style={S.input}
                        value={getProviderField(provider.slug, "extNetworkId")}
                        onChange={(e) =>
                          setProviderField(
                            provider.slug,
                            "extNetworkId",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 1"
                        onFocus={(e) =>
                          (e.target.style.borderColor =
                            currentMeta?.color || "#2563eb")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "#e2e8f0")
                        }
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                      <button
                        style={S.providerSaveBtn(
                          savingProvider === provider.slug,
                        )}
                        disabled={savingProvider === provider.slug}
                        onClick={() =>
                          handleSaveProvider(provider.slug, provider.name)
                        }
                      >
                        <Save size={13} />{" "}
                        {savingProvider === provider.slug
                          ? "Saving..."
                          : `Save ${provider.name} IDs`}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
    </RequirePermission>
  );
}
