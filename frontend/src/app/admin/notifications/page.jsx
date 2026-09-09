"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import RequirePermission from "@/components/RequirePermission";

const EMPTY = { subject: "", message: "", target: "all" };

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    adminApi
      .get("/admin/notifications")
      .then((r) => setNotifs(r.data.data?.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      toast.error("Subject and message required");
      return;
    }
    setSaving(true);
    try {
      await adminApi.post("/admin/notifications", form);
      toast.success("Notification sent!");
      setForm(EMPTY);
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this notification?")) return;
    try {
      await adminApi.delete(`/admin/notifications/${id}`);
      toast.success("Deleted");
      fetch();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <RequirePermission permission="notifications_manage">
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
          Notifications
        </h1>
        <button
          onClick={() => setShowForm(true)}
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
          <Plus size={16} /> New Notification
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {notifs.length === 0 ? (
            <div
              style={{
                background: "white",
                borderRadius: "1.25rem",
                padding: "3rem",
                textAlign: "center",
                color: "#94a3b8",
                boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              }}
            >
              No notifications yet
            </div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "white",
                  borderRadius: "1.25rem",
                  padding: "1.25rem 1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: ".25rem",
                    }}
                  >
                    {n.subject}
                  </div>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: ".875rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {n.message}
                  </p>
                  <div
                    style={{
                      fontSize: ".7rem",
                      color: "#94a3b8",
                      marginTop: ".5rem",
                    }}
                  >
                    {new Date(n.createdAt).toLocaleString("en-NG")}
                  </div>
                </div>
                <button
                  onClick={() => del(n.id)}
                  style={{
                    width: 32,
                    height: 32,
                    border: "1px solid #fee2e2",
                    background: "#fff5f5",
                    borderRadius: ".625rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} color="#dc2626" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

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
              maxWidth: 440,
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
                Send Notification
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
              onSubmit={handleCreate}
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
                  Subject
                </label>
                <input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="e.g. Service Maintenance"
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
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  rows={4}
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
                    resize: "vertical",
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
                  Target
                </label>
                <select
                  value={form.target}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target: e.target.value }))
                  }
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
                  <option value="all">All Users</option>
                  <option value="agents">Agents Only</option>
                  <option value="vendors">Vendors Only</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: ".875rem",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: ".875rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  marginTop: ".375rem",
                }}
              >
                {saving ? "Sending..." : "Send Notification"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
