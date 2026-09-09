"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  Hash,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { fetchWithCache, TTL } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import ProviderIcon from "@/components/ProviderIcon";

export default function ExamPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [providers, setProviders] = useState([]);
  const [selectedProv, setSelectedProv] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loadingProvs, setLoadingProvs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchWithCache("exam:providers", TTL.NETWORKS, () =>
      api.get("/exam/providers").then((r) => r.data.data?.providers || []),
    )
      .then((ps) => {
        setProviders(ps);
        if (ps.length > 0) setSelectedProv(ps[0]);
      })
      .finally(() => setLoadingProvs(false));
  }, []);

  const total = selectedProv
    ? parseFloat(selectedProv.price || selectedProv.amount || 0) * quantity
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProv) return toast.error("Select exam type");
    if (quantity < 1) return toast.error("Enter valid quantity");
    if (parseFloat(user?.wallet || 0) < total)
      return toast.error("Insufficient balance");
    if (!pin)
      return toast.error("Enter your transaction PIN");
    setLoading(true);
    try {
      const r = await api.post("/exam/purchase", {
        providerId: selectedProv.id,
        quantity,
        pin,
      });
      const result = r.data.data;
      if (result?.status === "fail") {
        toast.error(
          result?.message ||
            result?.msg ||
            "Purchase failed. Please try again.",
        );
        return;
      }
      await refreshUser();
      if (result?.ref) return router.push(`/dashboard/transactions/${result.ref}?new=1`);
      setSuccess({
        provider: selectedProv,
        quantity,
        total,
        pins: result?.pins,
      });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Purchase failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
        <div
          className="grad-bg"
          style={{
            padding: "3rem 1.25rem 2rem",
            background: "linear-gradient(135deg,#064e3b,#059669,#10b981)",
          }}
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
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <CheckCircle2 size={38} color="#16a34a" />
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "1.15rem",
                marginBottom: ".5rem",
              }}
            >
              Exam Pins Purchased!
            </h2>
            <p
              style={{
                color: "#71717a",
                fontSize: ".85rem",
                marginBottom: "1.5rem",
              }}
            >
              {success.quantity} × {success.provider?.name} pin
              {success.quantity > 1 ? "s" : ""}
            </p>
            {success.pins && success.pins.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: ".78rem",
                    color: "#52525b",
                    marginBottom: ".75rem",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  Your Pins
                </p>
                {success.pins.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f0fdf4",
                      border: "2px dashed #86efac",
                      borderRadius: ".875rem",
                      padding: ".75rem 1rem",
                      marginBottom: ".5rem",
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "1rem",
                      letterSpacing: ".15em",
                      color: "#064e3b",
                    }}
                  >
                    {typeof item === "string" ? item : `${item.pin || ""}${item.serial ? ` (Serial: ${item.serial})` : ""}`}
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                background: "#f9f9fb",
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {[
                ["Exam", success.provider?.name],
                ["Quantity", success.quantity],
                ["Total Paid", `₦${success.total.toLocaleString()}`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: ".5rem",
                  }}
                >
                  <span style={{ fontSize: ".82rem", color: "#71717a" }}>
                    {k}
                  </span>
                  <span style={{ fontSize: ".82rem", fontWeight: 700 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setSuccess(null);
                setQuantity(1);
              }}
              style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
            >
              Buy More Pins
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
      <div
        className="grad-bg"
        style={{
          padding: "3rem 1.25rem 1.75rem",
          background: "linear-gradient(135deg,#064e3b,#059669,#10b981)",
        }}
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
              Exam Pins
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              WAEC, NECO, JAMB & more
            </p>
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
        {/* Providers */}
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "1.25rem",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: ".78rem",
              color: "#52525b",
              marginBottom: ".875rem",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Select Exam Type
          </p>
          {loadingProvs ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}
            >
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="shimmer"
                  style={{ height: 60, borderRadius: 12 }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}
            >
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProv(p)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: ".875rem 1rem",
                    border:
                      selectedProv?.id === p.id
                        ? "2px solid #059669"
                        : "1.5px solid #e4e4e7",
                    borderRadius: ".875rem",
                    background:
                      selectedProv?.id === p.id
                        ? "rgba(5,150,105,.06)"
                        : "#fafafa",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: ".85rem",
                    color: selectedProv?.id === p.id ? "#059669" : "#09090b",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".75rem",
                    }}
                  >
                    <ProviderIcon name={p.name} size={36} />
                    <span>{p.name}</span>
                  </div>
                  <span style={{ fontSize: ".85rem", fontWeight: 900 }}>
                    ₦{parseFloat(p.price || p.amount || 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Quantity */}
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
              Quantity
            </label>
            <div
              style={{ display: "flex", alignItems: "center", gap: ".875rem" }}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1.5px solid #e4e4e7",
                  background: "#fafafa",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontWeight: 900,
                  fontSize: "1.5rem",
                  color: "#09090b",
                }}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: "1.5px solid #e4e4e7",
                  background: "#fafafa",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Phone (optional) */}
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
              Phone (optional — to receive pin via SMS)
            </label>
            <div className="input-wrap">
              <Hash
                size={17}
                style={{
                  position: "absolute",
                  left: ".875rem",
                  color: "#a1a1aa",
                  pointerEvents: "none",
                }}
              />
              <input
                className="form-input"
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          {selectedProv && (
            <div
              style={{
                background: "rgba(5,150,105,.04)",
                borderRadius: "1.25rem",
                padding: "1rem 1.25rem",
                border: "1.5px solid rgba(5,150,105,.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: ".4rem",
                }}
              >
                <span style={{ fontSize: ".8rem", color: "#71717a" }}>
                  {selectedProv.name} × {quantity}
                </span>
                <span style={{ fontWeight: 700, fontSize: ".8rem" }}>
                  ₦
                  {parseFloat(
                    selectedProv.price || selectedProv.amount || 0,
                  ).toLocaleString()}{" "}
                  each
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: ".85rem" }}>
                  Total
                </span>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: ".95rem",
                    color: "#059669",
                  }}
                >
                  ₦{total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

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
            Transaction PIN
          </label>
          <div className="input-wrap" style={{ marginBottom: "1rem" }}>
              <Lock size={18} className="input-icon" />
              <input
                className="form-input"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="Transaction PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                style={{ paddingRight: "2.75rem" }}
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

          <button
            className="btn-primary"
            type="submit"
            disabled={loading || !selectedProv}
            style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(255,255,255,.4)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                  className="spinner"
                />
                Processing...
              </span>
            ) : (
              `Buy ${quantity} Pin${quantity > 1 ? "s" : ""}${total ? ` — ₦${total.toLocaleString()}` : ""}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
