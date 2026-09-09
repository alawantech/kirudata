"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import AppLogo from "@/components/AppLogo";

export default function ContactPage() {
  const settings = useSiteSettings();
  const siteName = settings.sitename || "KIRU DATA";
  const siteInitial = siteName.charAt(0).toUpperCase();
  const logoUrl = settings.logoUrl || "";
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const labelStyle = {
    display: "block",
    fontSize: ".8rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: ".375rem",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Message received! We will get back to you shortly.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          background: "#0f172a",
          padding: "0 1.5rem",
          height: 88,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/home"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <AppLogo showBrandName={false} logoHeight={72} />
        </Link>
        <Link
          href="/home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".375rem",
            color: "rgba(255,255,255,.6)",
            textDecoration: "none",
            fontSize: ".85rem",
          }}
        >
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </nav>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)",
          padding: "4rem 1.5rem",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(1.75rem,4vw,2.75rem)",
            fontWeight: 900,
            marginBottom: ".75rem",
            letterSpacing: "-.03em",
          }}
        >
          Contact Us
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,.7)",
            fontSize: "1rem",
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          Have a question or need help? We're here 24/7.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "4rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "3rem",
        }}
      >
        {/* Contact Info */}
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "1.75rem",
              letterSpacing: "-.02em",
            }}
          >
            Get in Touch
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Phone */}
            {(() => {
              const phone = settings.phone || "+234 803 223 0464";
              const digits = phone.replace(/\D/g, "");
              return (
                <a
                  href={`tel:+${digits}`}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "1rem 1.25rem",
                    borderRadius: "1rem",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "box-shadow .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(22,163,74,.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#16a34a18",
                      border: "1px solid #16a34a22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={20} color="#16a34a" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: ".8rem",
                        color: "#166534",
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Phone
                    </div>
                    <div
                      style={{
                        color: "#15803d",
                        fontWeight: 600,
                        fontSize: ".95rem",
                        marginTop: ".1rem",
                      }}
                    >
                      {phone}
                    </div>
                    <div
                      style={{
                        fontSize: ".75rem",
                        color: "#86efac",
                        marginTop: ".1rem",
                      }}
                    >
                      Tap to call
                    </div>
                  </div>
                </a>
              );
            })()}

            {/* Email */}
            {(() => {
              const emailVal = settings.email || "support@kirudata.com";
              return (
                <a
                  href={`mailto:${emailVal}`}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "1rem 1.25rem",
                    borderRadius: "1rem",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "box-shadow .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(37,99,235,.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#2563eb18",
                      border: "1px solid #2563eb22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={20} color="#2563eb" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: ".8rem",
                        color: "#1e40af",
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Email
                    </div>
                    <div
                      style={{
                        color: "#1d4ed8",
                        fontWeight: 600,
                        fontSize: ".95rem",
                        marginTop: ".1rem",
                      }}
                    >
                      {emailVal}
                    </div>
                    <div
                      style={{
                        fontSize: ".75rem",
                        color: "#93c5fd",
                        marginTop: ".1rem",
                      }}
                    >
                      We reply within 24 hours
                    </div>
                  </div>
                </a>
              );
            })()}

            {/* WhatsApp Live Chat */}
            {(() => {
              const waNumber = settings.whatsapp || settings.phone || "";
              const waDigits = waNumber.replace(/\D/g, "");
              const waHref = waDigits
                ? `https://wa.me/${waDigits.startsWith("0") ? "234" + waDigits.slice(1) : waDigits}`
                : "https://wa.me/";
              const waDisplay = waNumber || "Chat with us";
              return (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    padding: "1rem 1.25rem",
                    borderRadius: "1rem",
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "box-shadow .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(124,58,237,.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#7c3aed18",
                      border: "1px solid #7c3aed22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MessageCircle size={20} color="#7c3aed" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: ".8rem",
                        color: "#5b21b6",
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Live Chat
                    </div>
                    <div
                      style={{
                        color: "#6d28d9",
                        fontWeight: 600,
                        fontSize: ".95rem",
                        marginTop: ".1rem",
                      }}
                    >
                      {waDisplay}
                    </div>
                    <div
                      style={{
                        fontSize: ".75rem",
                        color: "#c4b5fd",
                        marginTop: ".1rem",
                      }}
                    >
                      Open WhatsApp → Chat now
                    </div>
                  </div>
                </a>
              );
            })()}

            {/* Office Address */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                padding: "1rem 1.25rem",
                borderRadius: "1rem",
                background: "#fffbeb",
                border: "1px solid #fde68a",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#d9770618",
                  border: "1px solid #d9770622",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MapPin size={20} color="#d97706" />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: ".8rem",
                    color: "#92400e",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  Office
                </div>
                <div
                  style={{
                    color: "#b45309",
                    fontWeight: 600,
                    fontSize: ".95rem",
                    marginTop: ".1rem",
                  }}
                >
                  {settings.address || "Nigeria"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,.06)",
            border: "1px solid #f1f5f9",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: ".375rem",
              letterSpacing: "-.02em",
            }}
          >
            Send a Message
          </h2>
          <p
            style={{
              fontSize: ".85rem",
              color: "#64748b",
              marginBottom: "1.5rem",
            }}
          >
            Fill in your details and we'll get back to you shortly.
          </p>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.125rem",
            }}
          >
            {/* Full Name */}
            <div>
              <label style={labelStyle}>
                Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Aminu Ibrahim"
                value={form.name}
                onChange={set("name")}
                required
                autoComplete="name"
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>
                Phone Number <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                className="form-input"
                type="tel"
                placeholder="e.g. 08012345678"
                value={form.phone}
                onChange={set("phone")}
                required
                autoComplete="tel"
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>
                Email Address <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="e.g. you@example.com"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="email"
              />
            </div>

            {/* Message */}
            <div>
              <label style={labelStyle}>
                Message <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Describe your issue or question in detail..."
                value={form.message}
                onChange={set("message")}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
              }}
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send size={16} /> Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer
        style={{
          background: "#0f172a",
          padding: "2rem 1.5rem",
          textAlign: "center",
          color: "rgba(255,255,255,.4)",
          fontSize: ".8rem",
        }}
      >
        © {new Date().getFullYear()} {siteName}. All rights reserved. | Developed by <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.6)", textDecoration: "underline" }}>ZEDROTECH</a>
      </footer>
    </div>
  );
}
