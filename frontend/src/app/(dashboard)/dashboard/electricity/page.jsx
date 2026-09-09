"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ChevronLeft,
  CheckCircle2,
  User,
  Hash,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { fetchWithCache, TTL } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import ProviderIcon from "@/components/ProviderIcon";

const METER_TYPES = [
  { id: "prepaid", label: "Prepaid" },
  { id: "postpaid", label: "Postpaid" },
];
const AMOUNTS = [1000, 2000, 5000, 10000, 20000];

export default function ElectricityPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [providers, setProviders] = useState([]);
  const [selectedProv, setSelectedProv] = useState(null);
  const [meterType, setMeterType] = useState("prepaid");
  const [meter, setMeter] = useState("");
  const [amount, setAmount] = useState("");
  const [customer, setCustomer] = useState(null);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loadingProvs, setLoadingProvs] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [electricityFee, setElectricityFee] = useState(0);

  useEffect(() => {
    fetchWithCache("electricity:settings", TTL.SETTINGS, () =>
      api.get("/public/settings").then((r) => r.data.data?.settings),
    )
      .then((s) => {
        if (s?.electricityFee) setElectricityFee(parseFloat(s.electricityFee));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWithCache("electricity:providers", TTL.NETWORKS, () =>
      api.get("/electricity/providers").then((r) => r.data.data?.providers || []),
    )
      .then((ps) => {
        setProviders(ps);
        if (ps.length > 0) setSelectedProv(ps[0]);
      })
      .finally(() => setLoadingProvs(false));
  }, []);

  const handleVerify = async () => {
    if (!meter) return toast.error("Enter meter number");
    if (!selectedProv) return toast.error("Select a provider");
    setVerifying(true);
    try {
      const r = await api.post("/electricity/verify", {
        provider: selectedProv.id,
        meter,
        meterType,
      });
      setCustomer(r.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Meter verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer) return toast.error("Verify meter first");
    if (!amount || parseFloat(amount) < 1000)
      return toast.error("Minimum amount is ₦1,000");
    if (parseFloat(user?.wallet || 0) < parseFloat(amount) + electricityFee)
      return toast.error("Insufficient balance");
    if (!phone || phone.length < 10)
      return toast.error("Enter a valid phone number");
    if (!pin)
      return toast.error("Enter your transaction PIN");
    setLoading(true);
    try {
      const r = await api.post("/electricity/purchase", {
        providerId: selectedProv.id,
        meter,
        meterType,
        amount: parseFloat(amount),
        phone,
        pin,
        customerName: customer?.customerName || customer?.name || null,
        address: customer?.address || null,
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
        customer,
        amount,
        provider: selectedProv?.name,
        meter,
        token: result?.token,
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
            background: "linear-gradient(135deg,#92400e,#d97706,#f59e0b)",
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
                background: "#fef9c3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <CheckCircle2 size={38} color="#a16207" />
            </div>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "1.15rem",
                marginBottom: ".5rem",
              }}
            >
              Electricity Purchased!
            </h2>
            {success.token && (
              <div
                style={{
                  background: "#fefce8",
                  border: "2px dashed #d97706",
                  borderRadius: ".875rem",
                  padding: ".875rem 1rem",
                  margin: ".75rem 0 1.5rem",
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  letterSpacing: ".15em",
                  color: "#92400e",
                }}
              >
                {success.token}
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
                ["Provider", success.provider],
                ["Meter", success.meter],
                ["Customer", success.customer?.name || "—"],
                ["Amount", `₦${parseFloat(success.amount).toLocaleString()}`],
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
                setMeter("");
                setCustomer(null);
                setAmount("");
              }}
              style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}
            >
              New Purchase
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
          background: "linear-gradient(135deg,#92400e,#d97706,#f59e0b)",
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
              Electricity
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              Pay your electricity bills instantly
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
        {/* Provider */}
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
            Select Provider (DISCO)
          </p>
          {loadingProvs ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: ".625rem",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="shimmer"
                  style={{ height: 56, borderRadius: 12 }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: ".625rem",
              }}
            >
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProv(p)}
                  style={{
                    padding: ".75rem 1rem",
                    border:
                      selectedProv?.id === p.id
                        ? "2px solid #d97706"
                        : "1.5px solid #e4e4e7",
                    borderRadius: ".875rem",
                    background:
                      selectedProv?.id === p.id
                        ? "rgba(217,119,6,.06)"
                        : "#fafafa",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: ".78rem",
                    color: selectedProv?.id === p.id ? "#d97706" : "#52525b",
                    textAlign: "left",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <ProviderIcon name={p.name} size={24} />
                    <span>{p.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meter type */}
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
            Meter Type
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: ".625rem",
            }}
          >
            {METER_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setMeterType(t.id)}
                style={{
                  padding: ".75rem",
                  border:
                    meterType === t.id
                      ? "2px solid #d97706"
                      : "1.5px solid #e4e4e7",
                  borderRadius: ".875rem",
                  background:
                    meterType === t.id ? "rgba(217,119,6,.06)" : "#fafafa",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".82rem",
                  color: meterType === t.id ? "#d97706" : "#52525b",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meter Number + Verify */}
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
            Meter Number
          </label>
          <div className="input-wrap" style={{ marginBottom: ".875rem" }}>
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
              type="text"
              placeholder="Enter meter number"
              value={meter}
              onChange={(e) => setMeter(e.target.value.replace(/\D/g, ""))}
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>
          {customer ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".875rem",
                background: "#f0fdf4",
                borderRadius: ".875rem",
                padding: ".875rem",
                border: "1.5px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={18} color="#16a34a" />
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: ".85rem",
                    color: "#09090b",
                  }}
                >
                  {customer.name || customer.customerName || "Verified"}
                </p>
                <p style={{ fontSize: ".75rem", color: "#71717a" }}>
                  {customer.address || meter}
                </p>
              </div>
            </div>
          ) : (
            <button
              className="btn-secondary"
              onClick={handleVerify}
              disabled={verifying || !meter}
              style={{
                background: "linear-gradient(135deg,#d97706,#f59e0b)",
                color: "white",
                border: "none",
                fontWeight: 700,
              }}
            >
              {verifying ? "Verifying..." : "Verify Meter"}
            </button>
          )}
        </div>

        {customer && (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
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
                Amount (₦)
              </label>
              <input
                className="form-input"
                type="number"
                placeholder="Minimum ₦1,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1000}
                style={{ marginBottom: ".875rem" }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: ".5rem",
                }}
              >
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(String(a))}
                    style={{
                      padding: ".6rem",
                      borderRadius: ".75rem",
                      fontSize: ".78rem",
                      fontWeight: 700,
                      border:
                        amount === String(a)
                          ? "2px solid #d97706"
                          : "1.5px solid #e4e4e7",
                      background:
                        amount === String(a)
                          ? "rgba(217,119,6,.06)"
                          : "#fafafa",
                      color: amount === String(a) ? "#d97706" : "#52525b",
                      cursor: "pointer",
                    }}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone + PIN */}
            <div className="input-wrap" style={{ marginBottom: ".75rem" }}>
              <Phone size={18} className="input-icon" />
              <input
                className="form-input"
                type="tel"
                inputMode="numeric"
                placeholder="Contact phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
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

            {amount && parseFloat(amount) > 0 && (
              <div
                style={{
                  background: "rgba(217,119,6,.04)",
                  borderRadius: "1rem",
                  padding: ".85rem 1rem",
                  border: "1.5px solid rgba(217,119,6,.15)",
                  marginBottom: ".75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".25rem" }}>
                  <span style={{ fontWeight: 500, fontSize: ".78rem", color: "#71717a" }}>Amount</span>
                  <span style={{ fontWeight: 600, fontSize: ".85rem" }}>₦{parseFloat(amount).toLocaleString()}</span>
                </div>
                {electricityFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".25rem" }}>
                    <span style={{ fontWeight: 500, fontSize: ".78rem", color: "#71717a" }}>Platform Fee</span>
                    <span style={{ fontWeight: 600, fontSize: ".85rem" }}>₦{electricityFee.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(217,119,6,.15)", paddingTop: ".35rem", marginTop: ".15rem" }}>
                  <span style={{ fontWeight: 700, fontSize: ".85rem" }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: ".95rem", color: "#d97706" }}>₦{(parseFloat(amount) + electricityFee).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !amount}
              style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}
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
                `Pay ₦${amount ? (parseFloat(amount) + electricityFee).toLocaleString() : "—"}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
