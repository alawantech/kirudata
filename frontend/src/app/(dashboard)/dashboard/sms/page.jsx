"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ChevronLeft, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const MAX_CHARS = 160;
const SMS_GRADIENT = "linear-gradient(135deg,#0369a1,#0891b2,#06b6d4)";

export default function SmsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [phones, setPhones] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [smsConfig, setSmsConfig] = useState({ price: 0, status: "Off" });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api
      .get("/sms/config")
      .then((r) => setSmsConfig(r.data.data || { price: 0, status: "Off" }))
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const charsLeft = MAX_CHARS - message.length;
  const price = parseFloat(smsConfig.price || 0);

  // Parse comma-separated numbers
  const phoneList = phones
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  const phoneCount = phoneList.length;
  const totalCost = price * phoneCount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phones.trim()) return toast.error("Enter recipient phone number(s)");
    if (!message.trim()) return toast.error("Enter your message");
    if (message.length > MAX_CHARS)
      return toast.error(`Message cannot exceed ${MAX_CHARS} characters`);
    if (smsConfig.status !== "On")
      return toast.error("Bulk SMS service is currently unavailable");
    if (phoneCount > 10000)
      return toast.error("Maximum 10,000 numbers per request");
    // Validate each number
    for (const num of phoneList) {
      if (!/^\d{10,14}$/.test(num)) {
        return toast.error(`Invalid number: ${num}. Use 10-14 digits.`);
      }
    }
    if (parseFloat(user?.wallet || 0) < totalCost)
      return toast.error("Insufficient balance");
    if (!pin)
      return toast.error("Enter your transaction PIN");
    setLoading(true);
    try {
      const smsRes = await api.post("/sms/send", { phone: phones.trim(), message, senderName: senderName.trim(), pin });
      await refreshUser();
      const smsRef = smsRes?.data?.data?.ref;
      if (smsRef) return router.push(`/dashboard/transactions/${smsRef}?new=1`);
      setSuccess({ phone: phones.trim(), message, totalCost, senderName: senderName.trim(), phoneCount });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to send SMS.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
        <div
          className="grad-bg"
          style={{ padding: "3rem 1.25rem 2rem", background: SMS_GRADIENT }}
        >
          <button
            className="back-btn"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft size={20} color="white" />
          </button>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "2rem 1.5rem",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,.08)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <CheckCircle2 size={38} color="#0891b2" />
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "1.15rem",
                marginBottom: ".5rem",
              }}
            >
              SMS Sent!
            </h2>
            <p
              style={{
                color: "#71717a",
                fontSize: ".85rem",
                marginBottom: "1.5rem",
              }}
            >
              Your message has been delivered
            </p>
            <div
              style={{
                background: "#f9f9fb",
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1.5rem",
                textAlign: "left",
              }}
            >
              {[
                ["Recipients", success.phoneCount === 1 ? success.phone : `${success.phoneCount} numbers`],
                ["Sender", success.senderName || "API"],
                ["Total Cost", `₦${success.totalCost.toLocaleString()}`],
                ["Message", success.message],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: ".5rem",
                    gap: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".82rem",
                      color: "#71717a",
                      flexShrink: 0,
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      fontSize: ".82rem",
                      fontWeight: 700,
                      textAlign: "right",
                      wordBreak: "break-word",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setSuccess(null);
                setPhones("");
                setSenderName("");
                setMessage("");
                setPin("");
              }}
              style={{ background: SMS_GRADIENT }}
            >
              Send Another SMS
            </button>
            <button
              className="btn-secondary"
              style={{ marginTop: ".75rem" }}
              onClick={() => router.push("/dashboard/transactions")}
            >
              View Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div
        className="grad-bg"
        style={{ padding: "3rem 1.25rem 1.75rem", background: SMS_GRADIENT }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".875rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <button className="back-btn" onClick={() => router.back()}>
            <ChevronLeft size={20} color="white" />
          </button>
          <div>
            <h1
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "-.02em",
              }}
            >
              Bulk SMS
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              Send SMS to any number instantly
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div
              style={{
                background: "rgba(255,255,255,.15)",
                borderRadius: "2rem",
                padding: ".25rem .75rem",
                fontSize: ".75rem",
                color: "white",
                fontWeight: 700,
              }}
            >
              {loadingConfig ? "..." : `₦${price.toLocaleString()} / SMS`}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Service status warning */}
        {!loadingConfig && smsConfig.status !== "On" && (
          <div
            style={{
              background: "#fff7ed",
              border: "1.5px solid #fed7aa",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              color: "#c2410c",
              fontSize: ".85rem",
              fontWeight: 600,
            }}
          >
            ⚠️ Bulk SMS service is currently unavailable. Please check back
            later.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Recipient Phone Numbers */}
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
              <label
                style={{
                  fontWeight: 700,
                  fontSize: ".78rem",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                }}
              >
                Phone Numbers
              </label>
              {phoneCount > 0 && (
                <span style={{
                  fontSize: ".75rem",
                  fontWeight: 700,
                  color: "#0891b2",
                  background: "#e0f7fa",
                  padding: ".2rem .6rem",
                  borderRadius: "1rem",
                }}>
                  {phoneCount.toLocaleString()} number{phoneCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <textarea
              placeholder="08012345678,08098765432,07011223344"
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                border: "1.5px solid #e4e4e7",
                borderRadius: ".875rem",
                padding: ".875rem 1rem",
                fontSize: ".9rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "monospace",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0891b2")}
              onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
            />
            <p style={{ margin: ".35rem 0 0", fontSize: ".72rem", color: "#71717a" }}>
              Separate multiple numbers with commas. No spaces. Max 10,000 numbers.
            </p>
          </div>

          {/* Sender Name */}
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            <label
              style={{
                fontWeight: 700,
                fontSize: ".78rem",
                color: "#52525b",
                display: "block",
                marginBottom: ".75rem",
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Sender Name
            </label>
            <input
              type="text"
              placeholder="e.g. KiruData"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              maxLength={11}
              style={{
                width: "100%",
                border: "1.5px solid #e4e4e7",
                borderRadius: ".875rem",
                padding: ".875rem 1rem",
                fontSize: ".95rem",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0891b2")}
              onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
            />
            <p style={{ margin: ".35rem 0 0", fontSize: ".72rem", color: "#71717a" }}>
              Max 11 characters. Leave empty for default.
            </p>
          </div>

          {/* Message */}
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: ".75rem",
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: ".78rem",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                }}
              >
                Message
              </label>
              <span
                style={{
                  fontSize: ".75rem",
                  fontWeight: 700,
                  color: charsLeft < 20 ? "#dc2626" : "#71717a",
                }}
              >
                {charsLeft} / {MAX_CHARS}
              </span>
            </div>
            <textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={MAX_CHARS}
              style={{
                width: "100%",
                border: "1.5px solid #e4e4e7",
                borderRadius: ".875rem",
                padding: ".875rem 1rem",
                fontSize: ".9rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0891b2")}
              onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
            />
          </div>

          {/* Summary */}
          {phones && message && (
            <div
              style={{
                background: "#e0f7fa",
                border: "1.5px solid #b2ebf2",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: ".85rem", color: "#0e7490" }}>
                  {phoneCount} SMS × ₦{price.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#0369a1",
                  }}
                >
                  ₦{totalCost.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: ".35rem",
                }}
              >
                <span style={{ fontSize: ".82rem", color: "#0e7490" }}>
                  Wallet balance
                </span>
                <span
                  style={{
                    fontSize: ".82rem",
                    fontWeight: 700,
                    color:
                      parseFloat(user?.wallet || 0) < totalCost
                        ? "#dc2626"
                        : "#065f46",
                  }}
                >
                  ₦{parseFloat(user?.wallet || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* PIN */}
          <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: ".78rem",
                  color: "#52525b",
                  display: "block",
                  marginBottom: ".75rem",
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                }}
              >
                <Lock size={12} style={{ marginRight: 4 }} />
                Transaction PIN
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  style={{
                    width: "100%",
                    border: "1.5px solid #e4e4e7",
                    borderRadius: ".875rem",
                    padding: ".875rem 2.75rem .875rem 1rem",
                    fontSize: "1.25rem",
                    letterSpacing: ".35em",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0891b2")}
                  onBlur={(e) => (e.target.style.borderColor = "#e4e4e7")}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  style={{
                    position: "absolute",
                    right: ".875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                  }}
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || smsConfig.status !== "On"}
            style={{
              background: SMS_GRADIENT,
              opacity: loading || smsConfig.status !== "On" ? 0.6 : 1,
            }}
          >
            {loading ? "Sending..." : "Send SMS"}
          </button>
        </form>
      </div>
    </div>
  );
}
