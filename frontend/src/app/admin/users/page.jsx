"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const TYPE_LABELS = { 1: "Regular", 2: "Vendor" };
const STATUS_LABELS = {
  1: { label: "Active", color: "#16a34a", bg: "#dcfce7" },
  2: { label: "Unverified", color: "#d97706", bg: "#fef3c7" },
  3: { label: "Suspended", color: "#dc2626", bg: "#fee2e2" },
};

const TABS = ["Edit", "Type", "Status", "Wallet", "Password", "PIN"];

const inputStyle = {
  width: "100%",
  padding: ".75rem",
  border: "1px solid #e2e8f0",
  borderRadius: ".875rem",
  fontFamily: "inherit",
  fontSize: ".9rem",
  outline: "none",
  boxSizing: "border-box",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editUser, setEditUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Type");
  const [saving, setSaving] = useState(false);

  // Per-tab form fields
  const [selectedType, setSelectedType] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState(1);
  const [editFields, setEditFields] = useState({ firstname: "", lastname: "", email: "", phone: "" });
  const [walletDebit, setWalletDebit] = useState(false);
  const [walletAmt, setWalletAmt] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminApi
      .get(`/admin/users?page=${page}&search=${search}&type=${typeFilter}`)
      .then((r) => {
        setUsers(r.data.data?.users || []);
        setMeta(r.data.data?.meta || {});
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEdit = (u) => {
    setEditUser(u);
    setActiveTab("Edit");
    setEditFields({
      firstname: u.firstname || "",
      lastname: u.lastname || "",
      email: u.email || "",
      phone: u.phone || "",
    });
    setSelectedType(u.type || 1);
    setSelectedStatus(u.regStatus || 1);
    setWalletDebit(false);
    setWalletAmt("");
    setWalletNote("");
    setNewPassword("");
    setNewPin("");
  };

  const closeEdit = () => setEditUser(null);

  const save = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      if (activeTab === "Edit") {
        await adminApi.put(`/admin/users/${editUser.id}`, editFields);
        toast.success("User details updated");
        fetchUsers();
        closeEdit();
      } else if (activeTab === "Type") {
        await adminApi.put(`/admin/users/${editUser.id}/type`, { type: selectedType });
        toast.success("Account type updated");
        fetchUsers();
        closeEdit();
      } else if (activeTab === "Status") {
        await adminApi.put(`/admin/users/${editUser.id}/status`, { status: selectedStatus });
        toast.success("Account status updated");
        fetchUsers();
        closeEdit();
      } else if (activeTab === "Wallet") {
        const amt = parseFloat(walletAmt);
        if (!amt || amt <= 0) { toast.error("Enter a valid amount"); setSaving(false); return; }
        const ep = walletDebit ? "/admin/wallet/debit" : "/admin/wallet/credit";
        await adminApi.post(ep, { userId: editUser.id, amount: amt, reason: walletNote });
        toast.success(walletDebit ? "Wallet debited" : "Wallet credited");
        fetchUsers();
        closeEdit();
      } else if (activeTab === "Password") {
        if (!newPassword || newPassword.length < 6) {
          toast.error("Password must be at least 6 characters");
          setSaving(false);
          return;
        }
        await adminApi.post("/admin/users/reset-password", { userId: editUser.id, newPassword });
        toast.success("Password reset successfully");
        closeEdit();
      } else if (activeTab === "PIN") {
        const p = newPin || "1234";
        if (!/^\d{4}$/.test(p)) { toast.error("PIN must be exactly 4 digits"); setSaving(false); return; }
        await adminApi.post(`/admin/users/${editUser.id}/reset-pin`, { pin: p });
        toast.success("Transaction PIN reset");
        closeEdit();
      }
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const btnLabel = () => {
    if (activeTab === "Edit") return "Save Changes";
    if (activeTab === "Type") return "Update Type";
    if (activeTab === "Status") return "Update Status";
    if (activeTab === "Wallet") return walletDebit ? "Debit Wallet" : "Credit Wallet";
    if (activeTab === "Password") return "Reset Password";
    if (activeTab === "PIN") return "Reset PIN";
    return "Save";
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/users/${deleteUser.id}`);
      toast.success(`${deleteUser.firstname} deleted permanently`);
      setDeleteUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(e?.response?.data?.msg || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const btnColor = () => {
    if (activeTab === "Status" && selectedStatus === 3) return "#dc2626";
    if (activeTab === "Wallet" && walletDebit) return "#dc2626";
    return "#2563eb";
  };

  return (
    <RequirePermission permission="users_view">
    <div>
      {/* Header */}
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-.03em" }}>
          Users ({meta.total || 0})
        </h1>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                paddingLeft: "2.125rem",
                padding: ".625rem .875rem .625rem 2.125rem",
                border: "1px solid #e2e8f0",
                borderRadius: ".75rem",
                background: "white",
                fontFamily: "inherit",
                fontSize: ".85rem",
                width: 230,
                outline: "none",
              }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
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
            <option value="">All Types</option>
            <option value="1">Regular</option>
            <option value="2">Vendor</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                {["Name", "Email", "Phone", "Type", "Balance", "Status", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: ".875rem 1.25rem",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      fontSize: ".75rem",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
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
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const st = STATUS_LABELS[u.regStatus] || STATUS_LABELS[2];
                  const typeLabel = TYPE_LABELS[u.type] || "Regular";
                  const isVendor = u.type === 2;
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: ".875rem 1.25rem", fontWeight: 600, color: "#0f172a" }}>
                        {u.firstname} {u.lastname}
                      </td>
                      <td style={{ padding: ".875rem 1.25rem", color: "#64748b" }}>{u.email}</td>
                      <td style={{ padding: ".875rem 1.25rem", color: "#64748b" }}>{u.phone}</td>
                      <td style={{ padding: ".875rem 1.25rem" }}>
                        <span
                          style={{
                            fontSize: ".72rem",
                            fontWeight: 700,
                            padding: ".2rem .55rem",
                            borderRadius: 99,
                            background: isVendor ? "#eff6ff" : "#f8fafc",
                            color: isVendor ? "#2563eb" : "#64748b",
                          }}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td style={{ padding: ".875rem 1.25rem", fontWeight: 700, color: "#0f172a" }}>
                        ₦{parseFloat(u.wallet || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: ".875rem 1.25rem" }}>
                        <span
                          style={{
                            fontSize: ".7rem",
                            fontWeight: 600,
                            padding: ".2rem .625rem",
                            borderRadius: 99,
                            background: st.bg,
                            color: st.color,
                          }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: ".875rem 1.25rem" }}>
                        <div style={{ display: "flex", gap: ".5rem" }}>
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit user"
                            style={{
                              width: 32,
                              height: 32,
                              border: "1px solid #e2e8f0",
                              background: "white",
                              borderRadius: ".625rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Edit2 size={14} color="#2563eb" />
                          </button>
                          <button
                            onClick={() => setDeleteUser(u)}
                            title="Delete user permanently"
                            style={{
                              width: 32,
                              height: 32,
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              borderRadius: ".625rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={14} color="#dc2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".875rem",
              padding: "1.25rem",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ width: 34, height: 34, border: "1px solid #e2e8f0", background: "white", borderRadius: ".625rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: ".875rem", color: "#64748b", fontWeight: 600 }}>
              Page {page} of {meta.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              style={{ width: 34, height: 34, border: "1px solid #e2e8f0", background: "white", borderRadius: ".625rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
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
              maxWidth: 460,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "1.5rem 1.75rem 1.25rem",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <p style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
                  {editUser.firstname} {editUser.lastname}
                </p>
                <p style={{ color: "#64748b", fontSize: ".8rem", marginTop: ".2rem" }}>
                  {editUser.email} • {editUser.phone}
                </p>
                <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                  <span
                    style={{
                      fontSize: ".7rem",
                      fontWeight: 700,
                      padding: ".2rem .55rem",
                      borderRadius: 99,
                      background: editUser.type === 2 ? "#eff6ff" : "#f8fafc",
                      color: editUser.type === 2 ? "#2563eb" : "#64748b",
                    }}
                  >
                    {TYPE_LABELS[editUser.type] || "Regular"}
                  </span>
                  <span
                    style={{
                      fontSize: ".7rem",
                      fontWeight: 700,
                      padding: ".2rem .55rem",
                      borderRadius: 99,
                      background: STATUS_LABELS[editUser.regStatus]?.bg || "#f8fafc",
                      color: STATUS_LABELS[editUser.regStatus]?.color || "#64748b",
                    }}
                  >
                    {STATUS_LABELS[editUser.regStatus]?.label || "Unknown"}
                  </span>
                </div>
              </div>
              <button
                onClick={closeEdit}
                style={{ background: "none", border: "none", cursor: "pointer", padding: ".25rem" }}
              >
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: ".25rem",
                padding: "1rem 1.75rem .5rem",
                overflowX: "auto",
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: ".4rem .875rem",
                    borderRadius: "99px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: ".78rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: activeTab === tab ? "#2563eb" : "#f1f5f9",
                    color: activeTab === tab ? "white" : "#64748b",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: "1.25rem 1.75rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

              {activeTab === "Edit" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                    <div>
                      <label style={{ fontSize: ".75rem", fontWeight: 700, color: "#64748b", marginBottom: ".4rem", display: "block" }}>First Name</label>
                      <input
                        value={editFields.firstname}
                        onChange={(e) => setEditFields({ ...editFields, firstname: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: ".75rem", fontWeight: 700, color: "#64748b", marginBottom: ".4rem", display: "block" }}>Last Name</label>
                      <input
                        value={editFields.lastname}
                        onChange={(e) => setEditFields({ ...editFields, lastname: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: ".75rem", fontWeight: 700, color: "#64748b", marginBottom: ".4rem", display: "block" }}>Email</label>
                    <input
                      value={editFields.email}
                      onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: ".75rem", fontWeight: 700, color: "#64748b", marginBottom: ".4rem", display: "block" }}>Phone Number</label>
                    <input
                      value={editFields.phone}
                      onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {activeTab === "Type" && (
                <>
                  <p style={{ fontSize: ".85rem", color: "#52525b" }}>
                    Change account type. Vendors get discounted pricing on all services.
                  </p>
                  <div style={{ display: "flex", gap: ".75rem" }}>
                    {[{ val: 1, label: "Regular" }, { val: 2, label: "Vendor" }].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setSelectedType(opt.val)}
                        style={{
                          flex: 1,
                          padding: ".75rem",
                          borderRadius: ".875rem",
                          border: `2px solid ${selectedType === opt.val ? "#2563eb" : "#e2e8f0"}`,
                          background: selectedType === opt.val ? "#eff6ff" : "white",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: 700,
                          fontSize: ".875rem",
                          color: selectedType === opt.val ? "#2563eb" : "#64748b",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "Status" && (
                <>
                  <p style={{ fontSize: ".85rem", color: "#52525b" }}>
                    Activate or suspend this user account.
                  </p>
                  <div style={{ display: "flex", gap: ".75rem" }}>
                    {[
                      { val: 1, label: "Active", activeColor: "#16a34a", activeBg: "#f0fdf4" },
                      { val: 3, label: "Suspended", activeColor: "#dc2626", activeBg: "#fff5f5" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setSelectedStatus(opt.val)}
                        style={{
                          flex: 1,
                          padding: ".75rem",
                          borderRadius: ".875rem",
                          border: `2px solid ${selectedStatus === opt.val ? opt.activeColor : "#e2e8f0"}`,
                          background: selectedStatus === opt.val ? opt.activeBg : "white",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: 700,
                          fontSize: ".875rem",
                          color: selectedStatus === opt.val ? opt.activeColor : "#64748b",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "Wallet" && (
                <>
                  <p style={{ fontSize: ".85rem", color: "#52525b" }}>
                    Current balance: <strong>₦{parseFloat(editUser.wallet || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
                  </p>
                  <div style={{ display: "flex", gap: ".75rem" }}>
                    {[{ label: "Credit", val: false }, { label: "Debit", val: true }].map((b) => (
                      <button
                        key={b.label}
                        onClick={() => setWalletDebit(b.val)}
                        style={{
                          flex: 1,
                          padding: ".625rem",
                          borderRadius: ".75rem",
                          border: `2px solid ${walletDebit === b.val ? (b.val ? "#dc2626" : "#16a34a") : "#e2e8f0"}`,
                          background: walletDebit === b.val ? (b.val ? "#fff5f5" : "#f0fdf4") : "white",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: 600,
                          fontSize: ".875rem",
                          color: walletDebit === b.val ? (b.val ? "#dc2626" : "#16a34a") : "#64748b",
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Amount (₦)"
                    value={walletAmt}
                    onChange={(e) => setWalletAmt(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Note (optional)"
                    value={walletNote}
                    onChange={(e) => setWalletNote(e.target.value)}
                    style={inputStyle}
                  />
                </>
              )}

              {activeTab === "Password" && (
                <>
                  <p style={{ fontSize: ".85rem", color: "#52525b" }}>
                    Set a new password for this user. Minimum 6 characters.
                  </p>
                  <input
                    type="text"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle}
                  />
                </>
              )}

              {activeTab === "PIN" && (
                <>
                  <p style={{ fontSize: ".85rem", color: "#52525b" }}>
                    Reset transaction PIN. Leave blank to reset to default <strong>1234</strong>.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="New 4-digit PIN (or leave blank for 1234)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    style={inputStyle}
                  />
                </>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".25rem" }}>
                <button
                  onClick={closeEdit}
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
                  onClick={save}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: ".75rem",
                    background: saving ? "#94a3b8" : btnColor(),
                    color: "white",
                    border: "none",
                    borderRadius: ".875rem",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  {saving ? "Saving..." : btnLabel()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => !deleting && setDeleteUser(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={20} color="#dc2626" />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>Delete User</h2>
            </div>
            <p style={{ fontSize: ".9rem", color: "#64748b", marginBottom: ".5rem", lineHeight: 1.6 }}>
              Are you sure you want to permanently delete <strong style={{ color: "#0f172a" }}>{deleteUser.firstname} {deleteUser.lastname}</strong>?
            </p>
            <p style={{ fontSize: ".8rem", color: "#dc2626", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              This will permanently delete all their data — transactions, wallet, referrals, KYC, and everything else. They can re-register with the same details.
            </p>
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button
                onClick={() => setDeleteUser(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  borderRadius: ".875rem",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: ".75rem",
                  background: deleting ? "#94a3b8" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: ".875rem",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                }}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}

