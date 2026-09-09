"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

export default function AdminBlacklistPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phone: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    adminApi
      .get("/admin/blacklist")
      .then((r) => setList(r.data.data?.blacklist || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.phone) {
      toast.error("Phone number required");
      return;
    }
    setSaving(true);
    try {
      await adminApi.post("/admin/blacklist", form);
      toast.success("Number blacklisted");
      setForm({ phone: "", reason: "" });
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove from blacklist?")) return;
    try {
      await adminApi.delete(`/admin/blacklist/${id}`);
      toast.success("Removed");
      fetch();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <RequirePermission permission="blacklist_manage">
    <div>
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
          Blacklist ({list.length})
        </h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            background: "#dc2626",
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
          <Plus size={16} /> Blacklist Number
        </button>
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
        {loading ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
          >
            Loading...
          </div>
        ) : list.length === 0 ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
          >
            No blacklisted numbers
          </div>
        ) : (
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
                {["Phone Number", "Reason", "Date Added", "Action"].map((h) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((item, i) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom:
                      i < list.length - 1 ? "1px solid #f8fafc" : "none",
                  }}
                >
                  <td
                    style={{
                      padding: ".875rem 1.25rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.phone}
                  </td>
                  <td style={{ padding: ".875rem 1.25rem", color: "#64748b" }}>
                    {item.reason || "—"}
                  </td>
                  <td
                    style={{
                      padding: ".875rem 1.25rem",
                      color: "#94a3b8",
                      fontSize: ".8rem",
                    }}
                  >
                    {new Date(item.createdAt).toLocaleDateString("en-NG")}
                  </td>
                  <td style={{ padding: ".875rem 1.25rem" }}>
                    <button
                      onClick={() => remove(item.id)}
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
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "2rem",
              width: "100%",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ fontWeight: 800, color: "#0f172a" }}>
                Blacklist Number
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={20} color="#94a3b8" />
              </button>
            </div>
            <form
              onSubmit={handleAdd}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
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
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="08012345678"
                  required
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
                  Reason (optional)
                </label>
                <input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="e.g. Fraudulent activity"
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
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: ".875rem",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: ".875rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  marginTop: ".375rem",
                }}
              >
                {saving ? "Adding..." : "Add to Blacklist"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
