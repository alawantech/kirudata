"use client";
import { useEffect, useRef, useState } from "react";
import { Save, Upload, Image as ImageIcon, Plus, Trash2, GripVertical } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

// ─── Reusable field renderer ──────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", description }) {
  if (type === "toggle") {
    const isOn = value === "on";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151" }}>
              {label}
            </label>
            {description && (
              <p style={{ fontSize: ".72rem", color: "#9ca3af", margin: ".2rem 0 0" }}>{description}</p>
            )}
          </div>
          <button
            onClick={() => onChange({ target: { value: isOn ? "off" : "on" } })}
            style={{
              width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
              background: isOn ? "#22c55e" : "#d1d5db", position: "relative", transition: "background .2s",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: "white",
              position: "absolute", top: 3, left: isOn ? 25 : 3,
              transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            }} />
          </button>
        </div>
      </div>
    );
  }
  return (
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
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
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
  );
}

// ─── Upload button with preview ───────────────────────────────────────────────
function UploadField({ label, hint, currentUrl, type, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminApi.post(`/admin/settings/upload/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data?.url;
      if (url) {
        onUploaded(url);
        toast.success(`${label} uploaded!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || `Failed to upload ${label}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isFavicon = type === "favicon";
  const previewSize = isFavicon ? 32 : 56;

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: ".8rem",
          fontWeight: 600,
          color: "#374151",
          marginBottom: ".5rem",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: ".875rem",
          border: "1px solid #e2e8f0",
          borderRadius: ".875rem",
          background: "#f8fafc",
        }}
      >
        {/* Preview */}
        <div
          style={{
            width: previewSize,
            height: previewSize,
            borderRadius: isFavicon ? 6 : 10,
            background: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            border: "1px solid #cbd5e1",
          }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={label}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <ImageIcon size={isFavicon ? 14 : 22} color="#94a3b8" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: ".8rem",
              color: "#64748b",
              marginBottom: ".375rem",
            }}
          >
            {currentUrl ? (
              <span style={{ wordBreak: "break-all", fontSize: ".75rem" }}>
                {currentUrl.split("/").pop()}
              </span>
            ) : (
              <span style={{ color: "#94a3b8" }}>No file uploaded yet</span>
            )}
          </div>
          <div style={{ fontSize: ".72rem", color: "#94a3b8" }}>{hint}</div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".375rem",
            background: uploading ? "#94a3b8" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: ".75rem",
            padding: ".5rem .875rem",
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: ".8rem",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Upload size={13} />
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [newBanner, setNewBanner] = useState({ imageUrl: "", sortOrder: 0 });
  const bannerFileRef = useRef(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    adminApi
      .get("/admin/settings")
      .then((r) => setSettings(r.data.data?.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
    adminApi
      .get("/admin/banners")
      .then((r) => setBanners(r.data.data?.banners || []))
      .catch(() => {})
      .finally(() => setBannersLoading(false));
  }, []);

  const set = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.value }));
  const setVal = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.put("/admin/settings", settings);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminApi.post("/admin/banners/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data?.url;
      if (url) {
        setNewBanner((b) => ({ ...b, imageUrl: url }));
        toast.success("Banner image uploaded!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to upload image");
    } finally {
      setBannerUploading(false);
      if (bannerFileRef.current) bannerFileRef.current.value = "";
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner.imageUrl) return toast.error("Upload an image first");
    setBannerSaving(true);
    try {
      const res = await adminApi.post("/admin/banners", newBanner);
      setBanners((prev) => [...prev, res.data.data.banner]);
      setNewBanner({ imageUrl: "", sortOrder: 0 });
      toast.success("Banner added!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to add banner");
    } finally {
      setBannerSaving(false);
    }
  };

  const handleUpdateBanner = async (id, updates) => {
    try {
      const res = await adminApi.put(`/admin/banners/${id}`, updates);
      setBanners((prev) => prev.map((b) => (b.id === id ? res.data.data.banner : b)));
      toast.success("Banner updated!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to update banner");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await adminApi.delete(`/admin/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success("Banner deleted!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to delete banner");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
        Loading...
      </div>
    );

  const textSections = [
    {
      title: "General",
      fields: [
        { label: "Site Name (logo text)", key: "sitename", type: "text" },
        { label: "Browser Tab Title", key: "sitetitle", type: "text" },
        { label: "Site Description (SEO)", key: "sitedesc", type: "text" },
        { label: "Site URL", key: "siteurl", type: "text" },
        { label: "Office Address", key: "address", type: "text" },
        { label: "Support Phone", key: "phone", type: "text" },
        { label: "Support Email", key: "email", type: "email" },
        { label: "WhatsApp Number", key: "whatsapp", type: "text" },
        { label: "Telegram Link", key: "telegram", type: "text" },
        { label: "Facebook Link", key: "facebook", type: "text" },
        { label: "Instagram Link", key: "instagram", type: "text" },
        { label: "Twitter / X Link", key: "twitter", type: "text" },
      ],
    },
    {
      title: "Transaction Fees",
      fields: [
        {
          label: "Airtime Discount (%)",
          key: "airtimeDiscount",
          type: "number",
        },
        { label: "Data Markup (%)", key: "dataMarkup", type: "number" },
        { label: "Cable TV Fee (₦)", key: "cableFee", type: "number" },
        { label: "Electricity Fee (₦)", key: "electricityFee", type: "number" },
      ],
    },
    {
      title: "Payment",
      fields: [
        {
          label: "Minimum Wallet Deposit (₦)",
          key: "minDeposit",
          type: "number",
        },
        {
          label: "Maximum Wallet Deposit (₦)",
          key: "maxDeposit",
          type: "number",
        },
        {
          label: "Wallet Funding Fee (%)",
          key: "walletFundingFeePercent",
          type: "number",
          placeholder: "e.g. 0.5 = 0.5%. Leave 0 for no fee",
        },
        {
          label: "Wallet Funding Fee Cap (₦)",
          key: "walletFundingFeeCap",
          type: "number",
          placeholder: "Maximum fee charged per transaction",
        },
      ],
    },
    {
      title: "Manual Funding Account",
      fields: [
        { label: "Account Name", key: "accountName", type: "text" },
        { label: "Account Number", key: "accountNo", type: "text" },
        { label: "Bank Name", key: "bankName", type: "text" },
      ],
    },
    {
      title: "Referral",
      fields: [
        {
          label: "Referral Bonus (%)",
          key: "referralBonusPercent",
          type: "number",
          description: "Percentage of referee's first deposit paid to referrer. Set 0 to disable.",
        },
      ],
    },
  ];

  const cardStyle = {
    background: "white",
    borderRadius: "1.25rem",
    padding: "1.75rem",
    boxShadow: "0 2px 8px rgba(0,0,0,.05)",
    border: "1px solid #f1f5f9",
  };

  return (
    <RequirePermission permission="settings_manage">
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Site Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            background: saving ? "#94a3b8" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: ".875rem",
            padding: ".625rem 1.25rem",
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: ".875rem",
          }}
        >
          <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* ── Branding uploads ─────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <h2
            style={{
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "1.25rem",
              fontSize: "1.05rem",
            }}
          >
            Branding
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: "1rem",
            }}
          >
            <UploadField
              label="Site Logo"
              hint="PNG or SVG recommended · max 2 MB · appears in navbar & footer"
              type="logo"
              currentUrl={settings.logoUrl}
              onUploaded={setVal("logoUrl")}
            />
            <UploadField
              label="Favicon (browser tab icon)"
              hint=".ico or PNG · 32×32 px recommended · max 2 MB"
              type="favicon"
              currentUrl={settings.faviconUrl}
              onUploaded={setVal("faviconUrl")}
            />
          </div>
        </div>

        {/* ── Text / numeric sections ───────────────────────────────────────── */}
        {textSections.map((section) => (
          <div key={section.title} style={cardStyle}>
            <h2
              style={{
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: "1.25rem",
                fontSize: "1.05rem",
              }}
            >
              {section.title}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: "1rem",
              }}
            >
              {section.fields.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  value={settings[f.key]}
                  onChange={set(f.key)}
                  description={f.description}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── Promotional Banners ──────────────────────────────────────────── */}
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 800, color: "#0f172a", marginBottom: "1.25rem", fontSize: "1.05rem" }}>
            Promotional Banners
          </h2>
          <p style={{ fontSize: ".8rem", color: "#64748b", marginBottom: "1rem" }}>
            Upload banner images that appear on the mobile home screen. They auto-scroll.
          </p>

          {/* Add new banner */}
          <div style={{
            display: "flex", gap: ".75rem", alignItems: "flex-end", flexWrap: "wrap",
            padding: "1rem", background: "#f8fafc", borderRadius: ".875rem", border: "1px solid #e2e8f0", marginBottom: "1.25rem",
          }}>
            <div style={{ flex: "1 1 250px" }}>
              <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "#374151", marginBottom: ".25rem" }}>
                Banner Image
              </label>
              <input ref={bannerFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBannerImageUpload} />
              <button
                onClick={() => bannerFileRef.current?.click()}
                disabled={bannerUploading}
                style={{
                  width: "100%", padding: ".625rem", border: "1px dashed #cbd5e1", borderRadius: ".75rem",
                  background: "white", cursor: bannerUploading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: ".375rem",
                  fontSize: ".8rem", color: "#64748b",
                }}
              >
                <Upload size={14} />
                {bannerUploading ? "Uploading..." : newBanner.imageUrl ? "Change Image" : "Choose Image"}
              </button>
              {newBanner.imageUrl && (
                <img src={newBanner.imageUrl} alt="Preview" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: ".5rem", marginTop: ".5rem" }} />
              )}
            </div>
            <div style={{ width: 80 }}>
              <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600, color: "#374151", marginBottom: ".25rem" }}>Order</label>
              <input
                type="number" value={newBanner.sortOrder}
                onChange={(e) => setNewBanner((b) => ({ ...b, sortOrder: Number(e.target.value) }))}
                style={{ width: "100%", padding: ".625rem", border: "1px solid #e2e8f0", borderRadius: ".75rem", fontSize: ".8rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={handleAddBanner}
              disabled={bannerSaving || !newBanner.imageUrl}
              style={{
                display: "flex", alignItems: "center", gap: ".375rem",
                background: bannerSaving || !newBanner.imageUrl ? "#94a3b8" : "#2563eb",
                color: "white", border: "none", borderRadius: ".75rem",
                padding: ".625rem 1rem", cursor: bannerSaving || !newBanner.imageUrl ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: ".8rem", whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} /> {bannerSaving ? "Adding..." : "Add Banner"}
            </button>
          </div>

          {/* Existing banners list */}
          {bannersLoading ? (
            <p style={{ fontSize: ".8rem", color: "#94a3b8" }}>Loading banners...</p>
          ) : banners.length === 0 ? (
            <p style={{ fontSize: ".8rem", color: "#94a3b8" }}>No banners yet. Upload one above.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
              {banners.map((b) => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: ".75rem", border: "1px solid #e2e8f0", borderRadius: ".75rem", background: "white",
                }}>
                  <GripVertical size={16} color="#cbd5e1" />
                  <img src={b.imageUrl} alt="Banner" style={{ width: 120, height: 50, objectFit: "cover", borderRadius: ".5rem", border: "1px solid #e2e8f0" }} />
                  <input
                    type="number" value={b.sortOrder} title="Sort order"
                    onChange={(e) => handleUpdateBanner(b.id, { sortOrder: Number(e.target.value) })}
                    style={{ width: 60, padding: ".375rem .5rem", border: "1px solid #e2e8f0", borderRadius: ".5rem", fontSize: ".8rem", textAlign: "center", outline: "none" }}
                  />
                  <button
                    onClick={() => handleUpdateBanner(b.id, { active: !b.active })}
                    style={{
                      padding: ".375rem .625rem", borderRadius: ".5rem", border: "none", cursor: "pointer",
                      background: b.active ? "#22c55e" : "#e2e8f0", color: b.active ? "white" : "#64748b",
                      fontSize: ".72rem", fontWeight: 600, whiteSpace: "nowrap",
                    }}
                  >
                    {b.active ? "Active" : "Hidden"}
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    style={{ padding: ".375rem", borderRadius: ".5rem", border: "none", cursor: "pointer", background: "#fef2f2", color: "#ef4444" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}
