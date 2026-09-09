"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  MessageCircle,
  Send,
  Plus,
  Phone,
  Mail,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settings = useSiteSettings();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({ ref: "", query: "" });
  const [submitting, setSubmitting] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const fetchIssues = () => {
    api
      .get("/user/support")
      .then((r) => setIssues(r.data.data?.issues || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    if (prefillApplied) return;
    const wantsNew = searchParams.get("new") === "1";
    const ref = searchParams.get("ref") || "";
    const message = searchParams.get("message") || "";
    if (wantsNew || ref || message) {
      setTab("new");
      setForm({ ref, query: message });
      setPrefillApplied(true);
    }
  }, [prefillApplied, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.query) {
      toast.error("Please describe your issue");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/user/support", form);
      toast.success("Support ticket created! We will respond shortly.");
      setForm({ ref: "", query: "" });
      setTab("list");
      fetchIssues();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        className="grad-bg"
        style={{
          padding: "3rem 1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: ".875rem",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(255,255,255,.2)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color="white" />
        </button>
        <div>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.125rem" }}>
            Support Center
          </h1>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".75rem" }}>
            We're here to help
          </p>
        </div>
      </div>

      <div
        style={{
          margin: "1.25rem 1.25rem 0",
          display: "flex",
          background: "white",
          borderRadius: "1rem",
          padding: ".25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        }}
      >
        {[
          { key: "list", label: "My Tickets" },
          { key: "new", label: "New Ticket" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: ".625rem",
              borderRadius: ".75rem",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: ".85rem",
              background: tab === t.key ? "#2563eb" : "transparent",
              color: tab === t.key ? "white" : "#64748b",
              transition: "all .2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ margin: "1.25rem" }}>
        {tab === "new" ? (
          <div className="card" style={{ padding: "1.5rem" }}>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
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
                  Transaction Reference (optional)
                </label>
                <input
                  className="form-input"
                  placeholder="e.g. AIRTIME-1234567890"
                  value={form.ref}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ref: e.target.value }))
                  }
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
                  Describe Your Issue *
                </label>
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="Tell us what happened in detail..."
                  value={form.query}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, query: e.target.value }))
                  }
                  required
                  style={{ resize: "vertical" }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                }}
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send size={16} /> Submit Ticket
                  </>
                )}
              </button>
            </form>
          </div>
        ) : loading ? (
          <div
            className="card"
            style={{ padding: "3rem", textAlign: "center" }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: "2px solid #dbeafe",
                borderTopColor: "#2563eb",
                borderRadius: "50%",
                margin: "0 auto",
              }}
              className="spinner"
            />
          </div>
        ) : issues.length === 0 ? (
          <div
            className="card"
            style={{ padding: "3rem", textAlign: "center" }}
          >
            <MessageCircle
              size={32}
              color="#cbd5e1"
              style={{ margin: "0 auto .75rem" }}
            />
            <p style={{ color: "#94a3b8", fontSize: ".875rem" }}>
              No tickets yet
            </p>
            <button
              onClick={() => setTab("new")}
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: ".375rem",
                margin: ".875rem auto 0",
                background: "#eff6ff",
                color: "#2563eb",
                border: "none",
                borderRadius: ".75rem",
                padding: ".625rem 1.25rem",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: ".85rem",
              }}
            >
              <Plus size={14} /> Create Ticket
            </button>
          </div>
        ) : (
          <div className="card">
            {issues.map((issue, i) => (
              <div
                key={issue.id}
                style={{
                  padding: "1.25rem",
                  borderBottom:
                    i < issues.length - 1 ? "1px solid #f8fafc" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: ".5rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      flex: 1,
                      marginRight: ".875rem",
                    }}
                  >
                    {issue.ref ? `Ref: ${issue.ref}` : "General Issue"}
                  </div>
                  <span
                    style={{
                      fontSize: ".7rem",
                      fontWeight: 600,
                      padding: ".2rem .5rem",
                      borderRadius: 99,
                      background: "#eff6ff",
                      color: "#2563eb",
                      flexShrink: 0,
                    }}
                  >
                    {issue.replies?.length || 0} replies
                  </span>
                </div>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: ".8rem",
                    lineHeight: 1.5,
                  }}
                >
                  {issue.query?.substring(0, 100)}
                  {issue.query?.length > 100 ? "..." : ""}
                </p>
                {issue.replies?.length > 0 && (
                  <div
                    style={{
                      marginTop: ".875rem",
                      background: "#f0fdf4",
                      borderRadius: ".75rem",
                      padding: ".875rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: ".7rem",
                        fontWeight: 700,
                        color: "#15803d",
                        marginBottom: ".25rem",
                      }}
                    >
                      Admin Reply:
                    </div>
                    <p style={{ fontSize: ".8rem", color: "#166534" }}>
                      {issue.replies[issue.replies.length - 1].reply}
                    </p>
                  </div>
                )}
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "#94a3b8",
                    marginTop: ".5rem",
                  }}
                >
                  {new Date(issue.createdAt).toLocaleString("en-NG")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact info from site settings */}
      {(settings.phone || settings.email || settings.whatsapp) && (
        <div
          style={{
            margin: "1.25rem",
            background: "linear-gradient(135deg,#eff6ff,#f0fdf4)",
            borderRadius: "1.25rem",
            padding: "1.25rem",
            border: "1px solid #dbeafe",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: ".8rem",
              color: "#1e40af",
              marginBottom: ".875rem",
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            Contact Support Directly
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}
          >
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".625rem",
                  color: "#15803d",
                  textDecoration: "none",
                  fontSize: ".875rem",
                  fontWeight: 600,
                }}
              >
                <Phone size={16} /> {settings.phone}
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".625rem",
                  color: "#2563eb",
                  textDecoration: "none",
                  fontSize: ".875rem",
                  fontWeight: 600,
                }}
              >
                <Mail size={16} /> {settings.email}
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".625rem",
                  color: "#7c3aed",
                  textDecoration: "none",
                  fontSize: ".875rem",
                  fontWeight: 600,
                }}
              >
                <MessageCircle size={16} /> WhatsApp: {settings.whatsapp}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
