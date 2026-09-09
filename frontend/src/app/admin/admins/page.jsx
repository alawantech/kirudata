"use client";
import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, X, Users, ShieldCheck, Shield } from "lucide-react";

const ALL_PERMISSIONS = [
  { key: "dashboard_view", label: "View Dashboard" },
  { key: "users_view", label: "View Users" },
  { key: "users_edit", label: "Edit User Details" },
  { key: "users_credit", label: "Credit User Wallet" },
  { key: "users_debit", label: "Debit User Wallet" },
  { key: "users_reset_pin", label: "Reset User PIN" },
  { key: "users_reset_password", label: "Reset User Password" },
  { key: "transactions_view", label: "View Transactions" },
  { key: "transactions_edit", label: "Edit Transactions" },
  { key: "notifications_manage", label: "Manage Notifications" },
  { key: "issues_manage", label: "Manage Support Issues" },
  { key: "messages_manage", label: "Manage Contact Messages" },
  { key: "networks_manage", label: "Manage Networks" },
  { key: "data_plans_manage", label: "Manage Data Plans" },
  { key: "provider_data_plans_manage", label: "Manage Provider Data Plans" },
  { key: "data_card_plans_manage", label: "Manage Data Card Plans" },
  { key: "recharge_card_plans_manage", label: "Manage Recharge Card Plans" },
  { key: "cable_plans_manage", label: "Manage Cable TV Plans" },
  { key: "electricity_manage", label: "Manage Electricity Providers" },
  { key: "exam_providers_manage", label: "Manage Exam Providers" },
  { key: "airtime_discounts_manage", label: "Manage Airtime Discounts" },
  { key: "airtime_to_cash_manage", label: "Manage Airtime to Cash" },
  { key: "api_configs_manage", label: "Manage API Config" },
  { key: "api_links_manage", label: "Manage API Providers" },
  { key: "settings_manage", label: "Manage Site Settings" },
  { key: "blacklist_manage", label: "Manage Blacklist" },
  { key: "upgrade_requests_manage", label: "Manage Upgrade Requests" },
  { key: "kyc_manage", label: "Manage KYC Verifications" },
  { key: "admin_manage", label: "Manage Admins (Super Admin)" },
];

const inputStyle = { width: "100%", padding: ".75rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: ".875rem", fontSize: ".9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

export default function AdminsPage() {
  const { admin } = useAdmin();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "admin", permissions: [], status: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      const res = await adminApi.get("/admin/auth/admins");
      setAdmins(res.data.data?.admins || []);
    } catch { toast.error("Failed to load admins."); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditAdmin(null);
    setForm({ name: "", email: "", phone: "", password: "", role: "admin", permissions: [], status: 1 });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditAdmin(a);
    let perms = a.permissions;
    if (typeof perms === "string") perms = JSON.parse(perms);
    setForm({ name: a.name, email: a.email, phone: a.phone || "", password: "", role: a.role, permissions: perms || [], status: a.status });
    setShowModal(true);
  };

  const togglePerm = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key],
    }));
  };

  const selectAll = () => setForm((f) => ({ ...f, permissions: ALL_PERMISSIONS.map((p) => p.key) }));
  const clearAll = () => setForm((f) => ({ ...f, permissions: [] }));

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error("Name and email are required.");
    if (!editAdmin && !form.password) return toast.error("Password is required.");
    if (form.password && form.password.length < 8) return toast.error("Password must be at least 8 characters.");

    setSaving(true);
    try {
      if (editAdmin) {
        const body = { ...form };
        if (!body.password) delete body.password;
        await adminApi.put(`/admin/auth/admins/${editAdmin.id}`, body);
        toast.success("Admin updated!");
      } else {
        await adminApi.post("/admin/auth/admins", form);
        toast.success("Admin created!");
      }
      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete admin "${name}"?`)) return;
    try {
      await adminApi.delete(`/admin/auth/admins/${id}`);
      toast.success("Admin deleted.");
      fetchAdmins();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed.");
    }
  };

  if (admin?.role !== "super_admin") {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <Shield size={48} style={{ margin: "0 auto 1rem", opacity: .3 }} />
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Access Denied</h2>
        <p style={{ fontSize: ".85rem" }}>Only Super Admin can manage admins.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.4rem" }}>Manage Admins</h1>
          <p style={{ color: "#64748b", fontSize: ".85rem" }}>Create and manage admin accounts with role-based permissions</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".75rem 1.25rem", background: "linear-gradient(135deg,#2563eb,#0ea5e9)", color: "white", border: "none", borderRadius: ".875rem", fontWeight: 600, fontSize: ".85rem", cursor: "pointer" }}>
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>Loading...</div>
      ) : admins.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>No admins found.</div>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {admins.map((a) => {
            let perms = a.permissions;
            if (typeof perms === "string") perms = JSON.parse(perms);
            return (
              <div key={a.id} style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: a.role === "super_admin" ? "#dbeafe" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {a.role === "super_admin" ? <ShieldCheck size={20} color="#2563eb" /> : <Shield size={20} color="#64748b" />}
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{a.name}</div>
                  <div style={{ color: "#64748b", fontSize: ".8rem" }}>{a.email}</div>
                </div>
                <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ padding: ".25rem .6rem", borderRadius: "2rem", fontSize: ".7rem", fontWeight: 600, background: a.role === "super_admin" ? "#dbeafe" : "#f1f5f9", color: a.role === "super_admin" ? "#1d4ed8" : "#475569" }}>
                    {a.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                  <span style={{ padding: ".25rem .6rem", borderRadius: "2rem", fontSize: ".7rem", fontWeight: 600, background: a.status === 1 ? "#dcfce7" : "#fee2e2", color: a.status === 1 ? "#15803d" : "#dc2626" }}>
                    {a.status === 1 ? "Active" : "Inactive"}
                  </span>
                  <span style={{ fontSize: ".7rem", color: "#94a3b8" }}>{perms?.length || 0} permissions</span>
                </div>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <button onClick={() => openEdit(a)} style={{ padding: ".5rem", borderRadius: ".5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}><Edit2 size={14} color="#64748b" /></button>
                  <button onClick={() => handleDelete(a.id, a.name)} style={{ padding: ".5rem", borderRadius: ".5rem", border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer" }}><Trash2 size={14} color="#dc2626" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>{editAdmin ? "Edit Admin" : "Create Admin"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#64748b" /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@example.com" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08012345678" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>{editAdmin ? "New Password (leave blank to keep)" : "Password *"}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: parseInt(e.target.value) })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
                  <label style={{ fontSize: ".8rem", fontWeight: 600, color: "#374151" }}>Permissions</label>
                  <div style={{ display: "flex", gap: ".5rem" }}>
                    <button type="button" onClick={selectAll} style={{ background: "none", border: "none", color: "#2563eb", fontSize: ".75rem", cursor: "pointer", fontWeight: 600 }}>Select All</button>
                    <button type="button" onClick={clearAll} style={{ background: "none", border: "none", color: "#dc2626", fontSize: ".75rem", cursor: "pointer", fontWeight: 600 }}>Clear All</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".375rem", background: "#f9fafb", borderRadius: ".875rem", padding: ".875rem", border: "1px solid #e5e7eb" }}>
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p.key} style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".78rem", color: "#374151", cursor: "pointer", padding: ".25rem 0" }}>
                      <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} style={{ accentColor: "#2563eb" }} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: ".75rem", borderRadius: ".875rem", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: ".85rem" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: ".75rem", borderRadius: ".875rem", border: "none", background: "linear-gradient(135deg,#2563eb,#0ea5e9)", color: "white", fontWeight: 700, fontSize: ".85rem", cursor: "pointer" }}>
                  {saving ? "Saving..." : editAdmin ? "Update Admin" : "Create Admin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
