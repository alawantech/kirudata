"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Save, Eye, EyeOff } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

// ─── Static Config Definitions ─────────────────────────────────────────────────

const NETWORKS = [
  { id: "mtn", label: "MTN", color: "#f59e0b" },
  { id: "glo", label: "GLO", color: "#16a34a" },
  { id: "airtel", label: "Airtel", color: "#dc2626" },
  { id: "9mobile", label: "9Mobile", color: "#0d9488" },
];

const DATA_TYPES = [
  { id: "Sme", label: "SME Data" },
  { id: "Gifting", label: "Gifting Data" },
  { id: "CooperateGifting", label: "Cooperate Gifting Data" },
];

const PAYMENT_SECTIONS = [
  {
    id: "monnify",
    label: "Monnify",
    color: "#7c3aed",
    fields: [
      { key: "monnifyApiKey", label: "API Key" },
      { key: "monnifySecretKey", label: "Secret Key", secret: true },
      { key: "monnifyContractCode", label: "Contract Code" },
      { key: "monnifyBaseUrl", label: "Base URL" },
    ],
  },
  {
    id: "paystack",
    label: "Paystack",
    color: "#059669",
    fields: [
      { key: "paystackSecretKey", label: "Secret Key", secret: true },
      { key: "paystackPublicKey", label: "Public Key" },
    ],
  },
  {
    id: "payvessel",
    label: "Payvessel",
    color: "#2563eb",
    fields: [
      { key: "payvesselApiKey", label: "API Key" },
      { key: "payvesselSecretKey", label: "Secret Key", secret: true },
    ],
  },
];

const SERVICE_SECTIONS = [
  {
    id: "cable",
    label: "Cable TV",
    color: "#ea580c",
    fields: [
      {
        key: "cableVerificationProvider",
        label: "Verification Provider",
        providerType: "CableVer",
        apiKeyField: "cableVerificationApi",
      },
      {
        key: "cableVerificationApi",
        label: "Verification API Key",
        secret: true,
      },
      {
        key: "cableProvider",
        label: "Subscription Provider",
        providerType: "Cable",
        apiKeyField: "cableApi",
      },
      { key: "cableApi", label: "Subscription API Key", secret: true },
    ],
  },
  {
    id: "electricity",
    label: "Electricity",
    color: "#d97706",
    fields: [
      {
        key: "meterVerificationProvider",
        label: "Verification Provider",
        providerType: "ElectricityVer",
        apiKeyField: "meterVerificationApi",
      },
      {
        key: "meterVerificationApi",
        label: "Verification API Key",
        secret: true,
      },
      {
        key: "meterProvider",
        label: "Subscription Provider",
        providerType: "Electricity",
        apiKeyField: "meterApi",
      },
      { key: "meterApi", label: "Subscription API Key", secret: true },
    ],
  },
  {
    id: "exam",
    label: "Exam / Result Checker",
    color: "#7c3aed",
    fields: [
      {
        key: "examProvider",
        label: "Provider",
        providerType: "Exam",
        apiKeyField: "examApi",
      },
      { key: "examApi", label: "API Key", secret: true },
    ],
  },
  {
    id: "bulkSms",
    label: "Bulk SMS",
    color: "#0891b2",
    fields: [
      {
        key: "bulkSmsProvider",
        label: "API Provider URL",
        providerType: "Sms",
        apiKeyField: "bulkSmsApi",
      },
      { key: "bulkSmsApi", label: "API Key", secret: true },
      { key: "bulkSmsUserPrice", label: "User Price (₦ per SMS)" },
      { key: "bulkSmsVendorPrice", label: "Vendor Price (₦ per SMS)" },
      { key: "bulkSmsBuyingPrice", label: "Buying Price (₦ per SMS)" },
      { key: "bulkSmsStatus", label: "Status (On / Off)" },
    ],
  },
  {
    id: "dataCard",
    label: "Data Card",
    color: "#7c3aed",
    fields: [
      {
        key: "dataCardProvider",
        label: "API Provider URL",
        providerType: "DataCard",
        apiKeyField: "dataCardApi",
      },
      { key: "dataCardApi", label: "API Key", secret: true },
      { key: "dataCardStatus", label: "Status (On / Off)" },
    ],
  },
  {
    id: "rechargeCard",
    label: "Recharge Card",
    color: "#16a34a",
    fields: [
      {
        key: "rechargeCardProvider",
        label: "API Provider URL",
        providerType: "RechargeCard",
        apiKeyField: "rechargeCardApi",
      },
      { key: "rechargeCardApi", label: "API Key", secret: true },
      { key: "rechargeCardStatus", label: "Status (On / Off)" },
    ],
  },
];

const MESSAGING_SECTIONS = [
  {
    id: "sms",
    label: "SMS",
    color: "#0891b2",
    fields: [
      { key: "smsProvider", label: "Provider" },
      { key: "smsApiKey", label: "API Key", secret: true },
      { key: "smsFrom", label: "Sender ID" },
    ],
  },
  {
    id: "smtp",
    label: "SMTP Email",
    color: "#64748b",
    fields: [
      { key: "smtpHost", label: "Host" },
      { key: "smtpPort", label: "Port" },
      { key: "smtpUser", label: "Username" },
      { key: "smtpPass", label: "Password", secret: true },
      { key: "smtpFrom", label: "From Address" },
    ],
  },
];

const MAIN_TABS = [
  { id: "Wallets", label: "Provider Wallets" },
  { id: "Data", label: "Data API" },
  { id: "Airtime", label: "Airtime API" },
  { id: "Payment", label: "Payment Gateways" },
  { id: "Services", label: "Other Services" },
  { id: "Messaging", label: "Messaging" },
];

const WALLET_SLOTS = ["One", "Two", "Three", "Four", "Five"];

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function AdminApiConfigsPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [mainTab, setMainTab] = useState("Wallets");
  const [netTab, setNetTab] = useState("mtn");
  const [visible, setVisible] = useState({});
  const [apiLinks, setApiLinks] = useState([]);
  const [dataProviders, setDataProviders] = useState([]);

  // Apply tab from query param (?tab=Data, ?tab=Airtime, ?tab=Services, ?tab=Payment, ?tab=Messaging)
  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t) setMainTab(t);
  }, [searchParams]);

  const loadApiLinks = () => {
    adminApi
      .get("/admin/api-links")
      .then((r) => setApiLinks(r.data.data?.links || []))
      .catch(() => {});
    adminApi
      .get("/admin/data-providers")
      .then((r) => setDataProviders(r.data.data?.providers || []))
      .catch(() => {});
  };

  const loadConfigs = () => {
    adminApi
      .get("/admin/api-configs")
      .then((r) => {
        const map = {};
        (r.data.data?.configs || []).forEach((c) => {
          map[c.name] = c.value || "";
        });
        setFormData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConfigs();
    loadApiLinks();
  }, []);

  const setField = (key, val) => setFormData((f) => ({ ...f, [key]: val }));
  const toggleVisible = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  const saveSection = async (sectionId, keys) => {
    setSavingId(sectionId);
    try {
      await Promise.all(
        keys.map((k) =>
          adminApi.post("/admin/api-configs", { name: k, value: formData[k] || "" }),
        ),
      );
      toast.success("Saved successfully");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  // ── Field renderer component
  const renderField = (fieldDef) => {
    const { key, label, secret, providerType, apiKeyField } = fieldDef;
    const show = visible[key];

    // Provider dropdown — populated from saved API Links
    if (providerType) {
      const options = apiLinks.filter((l) => l.type === providerType);
      const currentVal = formData[key] || "";
      // Check if current value matches a known link; if not it's custom
      const isCustom =
        currentVal && !options.find((o) => o.value === currentVal);

      const handleProviderChange = (e) => {
        const url = e.target.value;
        setField(key, url);
        // Auto-fill the API key field if we know which field to fill
        if (apiKeyField && url) {
          const matched = options.find((o) => o.value === url);
          if (matched && matched.apiKey) {
            setField(apiKeyField, matched.apiKey);
          }
        }
      };

      return (
        <div>
          <label
            style={{
              display: "block",
              fontSize: ".78rem",
              fontWeight: 700,
              color: "#475569",
              marginBottom: ".35rem",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            {label}
          </label>
          <select
            value={currentVal}
            onChange={handleProviderChange}
            style={{
              width: "100%",
              padding: ".625rem .875rem",
              border: "1.5px solid #e2e8f0",
              borderRadius: ".625rem",
              fontSize: ".875rem",
              color: currentVal ? "#0f172a" : "#94a3b8",
              fontFamily: "inherit",
              outline: "none",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">— Select provider —</option>
            {options.map((o) => (
              <option key={o.id} value={o.value}>
                {o.name}
              </option>
            ))}
            {isCustom && (
              <option value={currentVal}>{currentVal} (custom)</option>
            )}
          </select>
          {options.length === 0 && (
            <p
              style={{
                margin: ".3rem 0 0",
                fontSize: ".72rem",
                color: "#f59e0b",
              }}
            >
              No {providerType} providers saved yet.{" "}
              <a
                href="/admin/api-links"
                style={{ color: "#2563eb", fontWeight: 700 }}
              >
                Add one →
              </a>
            </p>
          )}
          {apiKeyField &&
            currentVal &&
            options.find((o) => o.value === currentVal)?.apiKey && (
              <p
                style={{
                  margin: ".3rem 0 0",
                  fontSize: ".72rem",
                  color: "#16a34a",
                }}
              >
                ✓ API key auto-filled from provider
              </p>
            )}
        </div>
      );
    }

    return (
      <div>
        <label
          style={{
            display: "block",
            fontSize: ".78rem",
            fontWeight: 700,
            color: "#475569",
            marginBottom: ".35rem",
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          {label}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <input
            type={secret && !show ? "password" : "text"}
            value={formData[key] || ""}
            onChange={(e) => setField(key, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}…`}
            style={{
              flex: 1,
              padding: ".625rem .875rem",
              border: "1.5px solid #e2e8f0",
              borderRadius: ".625rem",
              fontSize: ".875rem",
              color: "#0f172a",
              fontFamily: secret ? "monospace" : "inherit",
              outline: "none",
              background: "#fff",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
          {secret && (
            <button
              onClick={() => toggleVisible(key)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: ".25rem",
                display: "flex",
                alignItems: "center",
              }}
              title={show ? "Hide" : "Show"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Section card with header + save button
  const renderSectionCard = ({ id, label, color, fields, columns = 2 }) => {
    const isSaving = savingId === id;
    return (
      <div
        key={id}
        style={{
          background: "white",
          borderRadius: "1rem",
          border: "1.5px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: ".875rem 1.25rem",
            background: color ? `${color}12` : "#f8fafc",
            borderBottom: "1.5px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: ".625rem" }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color || "#94a3b8",
              }}
            />
            <span
              style={{ fontWeight: 800, fontSize: ".9rem", color: "#0f172a" }}
            >
              {label}
            </span>
          </div>
          <button
            onClick={() =>
              saveSection(
                id,
                fields.map((f) => f.key),
              )
            }
            disabled={!!savingId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".4rem",
              background: isSaving ? "#94a3b8" : color || "#2563eb",
              color: "white",
              border: "none",
              borderRadius: ".625rem",
              padding: ".4rem 1rem",
              cursor: savingId ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: ".78rem",
              fontFamily: "inherit",
              opacity: savingId && !isSaving ? 0.5 : 1,
            }}
          >
            <Save size={13} />
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
        <div
          style={{
            padding: "1.25rem",
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "1rem",
          }}
        >
          {fields.map((f) => (
            <div key={f.key}>{renderField(f)}</div>
          ))}
        </div>
      </div>
    );
  };

  // ── Network tab bar (shared for Data + Airtime tabs)
  const renderNetTabs = () => (
    <div
      style={{
        display: "flex",
        gap: ".5rem",
        marginBottom: "1.25rem",
        flexWrap: "wrap",
      }}
    >
      {NETWORKS.map((n) => {
        const active = netTab === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setNetTab(n.id)}
            style={{
              padding: ".45rem 1.1rem",
              borderRadius: "2rem",
              border: `2px solid ${active ? n.color : "#e2e8f0"}`,
              background: active ? n.color : "white",
              color: active ? "white" : "#64748b",
              fontWeight: 700,
              fontSize: ".8rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {n.label}
          </button>
        );
      })}
    </div>
  );

  // ── Provider Wallets tab content
  const renderWalletsTab = () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {WALLET_SLOTS.map((slot, i) =>
        renderSectionCard({
          id: `wallet_${slot}`,
          label: `Provider Wallet ${i + 1}`,
          color: "#0284c7",
          columns: 3,
          fields: [
            { key: `wallet${slot}Name`, label: "Display Name" },
            {
              key: `wallet${slot}Provider`,
              label: "Balance API URL",
              providerType: "Wallet",
              apiKeyField: `wallet${slot}Api`,
            },
            { key: `wallet${slot}Api`, label: "API Key", secret: true },
          ],
        })
      )}
    </div>
  );

  // ── Data tab content
  const renderDataTab = () => {
    const net = netTab;
    const netMeta = NETWORKS.find((n) => n.id === net);
    const activeProviders = dataProviders.filter((p) => p.status === "On");

    const toggleProvider = (netName, typeId, providerSlug) => {
      const configKey = `${netName}${typeId}EnabledProviders`;
      const current = (formData[configKey] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const idx = current.indexOf(providerSlug);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(providerSlug);
      }
      setField(configKey, current.join(","));
    };

    const saveProviders = async (typeId) => {
      const configKey = `${net}${typeId}EnabledProviders`;
      setSavingId(`providers_${typeId}`);
      try {
        await adminApi.post("/admin/api-configs", {
          name: configKey,
          value: formData[configKey] || "",
        });
        toast.success("Saved successfully");
      } catch {
        toast.error("Failed to save");
      } finally {
        setSavingId(null);
      }
    };

    return (
      <div>
        {renderNetTabs()}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            fontSize: ".83rem",
            color: "#1d4ed8",
          }}
        >
          <strong>Data Providers</strong> — Check the providers active for each
          network and data type. Each provider must have its API URL and key
          configured at{" "}
          <a
            href="/admin/provider-data-plans"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            Provider Data Plans
          </a>
          .
        </div>
        {activeProviders.length === 0 && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
              fontSize: ".83rem",
              color: "#92400e",
            }}
          >
            No active data providers found.{" "}
            <a
              href="/admin/provider-data-plans"
              style={{ color: "#92400e", fontWeight: 700, textDecoration: "underline" }}
            >
              Create providers first →
            </a>
          </div>
        )}
        <div style={{ display: "grid", gap: "1rem" }}>
          {DATA_TYPES.map((type) => {
            const configKey = `${net}${type.id}EnabledProviders`;
            const selected = (formData[configKey] || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            const isSaving = savingId === `providers_${type.id}`;
            return (
              <div
                key={`${net}_${type.id}`}
                style={{
                  background: "white",
                  borderRadius: "1rem",
                  border: "1.5px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: ".875rem 1.25rem",
                    background: `${netMeta.color}12`,
                    borderBottom: "1.5px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".625rem",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: netMeta.color,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: ".9rem",
                        color: "#0f172a",
                      }}
                    >
                      {netMeta.label} — {type.label}
                    </span>
                    {selected.length > 0 && (
                      <span
                        style={{
                          fontSize: ".72rem",
                          fontWeight: 600,
                          color: "#16a34a",
                          background: "#dcfce7",
                          padding: ".15rem .5rem",
                          borderRadius: "1rem",
                        }}
                      >
                        {selected.length} active
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => saveProviders(type.id)}
                    disabled={!!savingId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".4rem",
                      background: isSaving ? "#94a3b8" : netMeta.color,
                      color: "white",
                      border: "none",
                      borderRadius: ".625rem",
                      padding: ".4rem 1rem",
                      cursor: savingId ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontSize: ".78rem",
                      fontFamily: "inherit",
                      opacity: savingId && !isSaving ? 0.5 : 1,
                    }}
                  >
                    <Save size={13} />
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: ".75rem",
                  }}
                >
                  {activeProviders.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: ".83rem", margin: 0 }}>
                      No providers available
                    </p>
                  ) : (
                    activeProviders.map((prov) => {
                      const checked = selected.includes(prov.slug);
                      return (
                        <label
                          key={prov.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".625rem",
                            padding: ".625rem .875rem",
                            borderRadius: ".75rem",
                            border: checked
                              ? `2px solid ${netMeta.color}`
                              : "2px solid #e2e8f0",
                            background: checked ? `${netMeta.color}08` : "#f8fafc",
                            cursor: "pointer",
                            transition: "all .15s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleProvider(net, type.id, prov.slug)
                            }
                            style={{ display: "none" }}
                          />
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: checked
                                ? `2px solid ${netMeta.color}`
                                : "2px solid #cbd5e1",
                              background: checked ? netMeta.color : "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {checked && (
                              <span style={{ color: "white", fontSize: "11px", fontWeight: 900 }}>
                                ✓
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: ".83rem",
                                color: "#0f172a",
                                lineHeight: 1.2,
                              }}
                            >
                              {prov.name}
                            </div>
                            {prov.apiUrl && (
                              <div
                                style={{
                                  fontSize: ".68rem",
                                  color: "#64748b",
                                  marginTop: "2px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {prov.apiUrl}
                              </div>
                            )}
                            {!prov.apiUrl && (
                              <div
                                style={{
                                  fontSize: ".68rem",
                                  color: "#f59e0b",
                                  marginTop: "2px",
                                }}
                              >
                                ⚠ No API URL configured
                              </div>
                            )}
                          </div>
                          {prov.apiKey && (
                            <span
                              style={{
                                fontSize: ".65rem",
                                color: "#16a34a",
                                fontWeight: 600,
                              }}
                            >
                              Has key
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Airtime tab content
  const renderAirtimeTab = () => {
    const net = netTab;
    const netMeta = NETWORKS.find((n) => n.id === net);
    return (
      <div>
        {renderNetTabs()}
        <div style={{ display: "grid", gap: "1rem" }}>
          {renderSectionCard({
            id: `${net}_vtu`,
            label: `${netMeta.label} — VTU (Buy Airtime)`,
            color: netMeta.color,
            columns: 3,
            fields: [
              {
                key: `${net}VtuProvider`,
                label: "Provider",
                providerType: "Airtime",
                apiKeyField: `${net}VtuKey`,
              },
              { key: `${net}VtuKey`, label: "API Key", secret: true },
              { key: `${net}VtuToken`, label: "Token", secret: true },
            ],
          })}
          {renderSectionCard({
            id: `${net}_share`,
            label: `${netMeta.label} — Share / Gift Airtime`,
            color: netMeta.color,
            columns: 2,
            fields: [
              {
                key: `${net}ShareProvider`,
                label: "Provider",
                providerType: "Airtime",
                apiKeyField: `${net}ShareKey`,
              },
              { key: `${net}ShareKey`, label: "API Key", secret: true },
            ],
          })}
        </div>
      </div>
    );
  };

  // ── Generic sections renderer (Payment, Services, Messaging)
  const renderSectionList = (sections) => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {sections.map((s) =>
        renderSectionCard({
          id: s.id,
          label: s.label,
          color: s.color,
          columns: Math.min(s.fields.length, 2),
          fields: s.fields,
        })
      )}
    </div>
  );

  return (
    <RequirePermission permission="api_configs_manage">
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-.03em",
            margin: 0,
          }}
        >
          API Configuration
        </h1>
        <p
          style={{ margin: ".3rem 0 0", color: "#64748b", fontSize: ".875rem" }}
        >
          Configure API providers and keys for all services.
        </p>
      </div>

      {/* Main tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: "1.5rem",
          borderBottom: "2px solid #f1f5f9",
          flexWrap: "wrap",
        }}
      >
        {MAIN_TABS.map((t) => {
          const active = mainTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              style={{
                padding: ".625rem 1.25rem",
                border: "none",
                background: "none",
                fontWeight: active ? 800 : 500,
                color: active ? "#2563eb" : "#64748b",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: ".875rem",
                borderBottom: active
                  ? "2px solid #2563eb"
                  : "2px solid transparent",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          border: "1px solid #f1f5f9",
          minHeight: "400px",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "4rem",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: ".9rem",
            }}
          >
            Loading configurations…
          </div>
        ) : (
          <>
            {mainTab === "Wallets" && renderWalletsTab()}
            {mainTab === "Data" && renderDataTab()}
            {mainTab === "Airtime" && renderAirtimeTab()}
            {mainTab === "Payment" && renderSectionList(PAYMENT_SECTIONS)}
            {mainTab === "Services" && renderSectionList(SERVICE_SECTIONS)}
            {mainTab === "Messaging" && renderSectionList(MESSAGING_SECTIONS)}
          </>
        )}
      </div>
    </div>
    </RequirePermission>
  );
}
