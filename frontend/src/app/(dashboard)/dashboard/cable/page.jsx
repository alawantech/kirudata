"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  Search,
  CreditCard,
  User,
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

const STEPS = ["Provider", "Verify", "Pay"];

export default function CablePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [providers, setProviders] = useState([]);
  const [selectedProv, setSelectedProv] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [smartcard, setSmartcard] = useState("");
  const [customer, setCustomer] = useState(null);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loadingProvs, setLoadingProvs] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [cableFee, setCableFee] = useState(0);

  useEffect(() => {
    fetchWithCache("cable:settings", TTL.SETTINGS, () =>
      api.get("/public/settings").then((r) => r.data.data?.settings),
    )
      .then((s) => {
        if (s?.cableFee) setCableFee(parseFloat(s.cableFee));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWithCache("cable:providers", TTL.NETWORKS, () =>
      api.get("/cable/providers").then((r) => r.data.data?.providers || []),
    )
      .then((ps) => {
        setProviders(ps);
        if (ps.length > 0) setSelectedProv(ps[0]);
      })
      .finally(() => setLoadingProvs(false));
  }, []);

  useEffect(() => {
    if (!selectedProv) return;
    setLoadingPlans(true);
    setSelectedPlan(null);
    fetchWithCache(`cable:plans:${selectedProv.id}`, TTL.PLANS, () =>
      api.get(`/cable/plans?provider=${selectedProv.id}`).then((r) => r.data.data?.plans || []),
    )
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, [selectedProv]);

  const handleVerify = async () => {
    if (!smartcard) return toast.error("Enter smartcard number");
    if (!selectedProv) return toast.error("Select a provider");
    setVerifying(true);
    try {
      const r = await api.post("/cable/verify", {
        iuc: smartcard,
        provider: selectedProv.id,
      });
      setCustomer(r.data.data);
      setStep(1);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) return toast.error("Select a plan");
    if (!phone || phone.length < 10)
      return toast.error("Enter a valid phone number");
    if (!pin)
      return toast.error("Enter your transaction PIN");
    if (
      parseFloat(user?.wallet || 0) <
parseFloat(selectedPlan.buyingPrice || 0) + cableFee
    )
      return toast.error("Insufficient balance");
    setLoading(true);
    try {
      const r = await api.post("/cable/purchase", {
        providerId: selectedProv.id,
        planId: selectedPlan.id,
        iuc: smartcard,
        phone,
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
        customer,
        plan: selectedPlan,
        provider: selectedProv?.name,
        smartcard,
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
        <div className="grad-bg" style={{ padding: "3rem 1.25rem 2rem" }}>
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
              Subscription Active!
            </h2>
            <p
              style={{
                color: "#71717a",
                fontSize: ".85rem",
                marginBottom: "1.75rem",
              }}
            >
              Cable TV subscription was successful
            </p>
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
                ["Plan", success.plan?.plan || success.plan?.name],
                ["Smartcard", success.smartcard],
                ["Customer", success.customer?.name || "—"],
                [
                  "Paid",
                  `₦${parseFloat(success.plan?.price || success.plan?.amount || 0).toLocaleString()}`,
                ],
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
                setStep(0);
                setSmartcard("");
                setCustomer(null);
                setSelectedPlan(null);
              }}
            >
              New Subscription
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
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".875rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <button
            className="back-btn"
            onClick={() => (step > 0 ? setStep((s) => s - 1) : router.back())}
          >
            <ChevronLeft size={20} color="white" />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "-.02em",
              }}
            >
              Cable TV
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              DSTV, GOTV, Startimes & more
            </p>
          </div>
        </div>
        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".375rem",
            marginTop: "1.25rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: ".375rem",
              }}
            >
              <div
                style={{
                  height: 3,
                  width: "100%",
                  borderRadius: 99,
                  background: i <= step ? "white" : "rgba(255,255,255,.3)",
                  transition: "background .25s",
                }}
              />
              <span
                style={{
                  fontSize: ".65rem",
                  fontWeight: 600,
                  color: i <= step ? "white" : "rgba(255,255,255,.5)",
                }}
              >
                {s}
              </span>
            </div>
          ))}
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
        {step === 0 && (
          <>
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
                Select Provider
              </p>
              {loadingProvs ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: ".625rem",
                  }}
                >
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{ height: 72, borderRadius: 12 }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: ".625rem",
                  }}
                >
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      className={`net-pill ${selectedProv?.id === p.id ? "selected" : ""}`}
                      onClick={() => setSelectedProv(p)}
                    >
                      <ProviderIcon name={p.name} size={28} logoUrl={p.logoUrl} />
                      <span style={{ fontSize: ".7rem" }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Smartcard */}
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
                Smartcard / IUC Number
              </label>
              <div className="input-wrap">
                <CreditCard
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
                  placeholder="Enter smartcard number"
                  value={smartcard}
                  onChange={(e) =>
                    setSmartcard(e.target.value.replace(/\D/g, ""))
                  }
                  style={{ paddingLeft: "2.75rem" }}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleVerify}
              disabled={verifying || !smartcard}
            >
              {verifying ? (
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
                  Verifying...
                </span>
              ) : (
                "Verify Smartcard →"
              )}
            </button>
          </>
        )}

        {step >= 1 && (
          <>
            {/* Customer Info */}
            {customer && (
              <div
                style={{
                  background: "white",
                  borderRadius: "1.5rem",
                  padding: "1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "rgba(124,58,237,.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={22} color="#7c3aed" />
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: ".9rem",
                      color: "#09090b",
                    }}
                  >
                    {customer.name || customer.customerName || "Customer"}
                  </p>
                  <p style={{ fontSize: ".78rem", color: "#71717a" }}>
                    {smartcard} • {selectedProv?.name}
                  </p>
                </div>
              </div>
            )}

            {/* Plans */}
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
                Select Plan
              </p>
              {loadingPlans ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".5rem",
                  }}
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".5rem",
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""}`}
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        border: "none",
                        textAlign: "left",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: ".85rem",
                              color: "#09090b",
                              marginBottom: ".2rem",
                            }}
                          >
                            {plan.plan || plan.name}
                          </p>
                          <p style={{ fontSize: ".72rem", color: "#71717a" }}>
                            {plan.validity || plan.duration || "—"}
                          </p>
                        </div>
                        <span
                          style={{
                            fontWeight: 900,
                            fontSize: ".95rem",
                            color:
                              selectedPlan?.id === plan.id
                                ? "#7c3aed"
                                : "#09090b",
                          }}
                        >
                          ₦
                          {(
                            parseFloat(plan.buyingPrice || 0) + cableFee
                          ).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPlan && (
              <div
                style={{
                  background: "rgba(124,58,237,.04)",
                  borderRadius: "1.25rem",
                  padding: "1rem 1.25rem",
                  border: "1.5px solid rgba(124,58,237,.15)",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}
                >
                  <span style={{ fontWeight: 500, fontSize: ".8rem", color: "#71717a" }}>
                    Plan Price
                  </span>
                  <span style={{ fontWeight: 600, fontSize: ".85rem" }}>
                    ₦{parseFloat(selectedPlan.buyingPrice || 0).toLocaleString()}
                  </span>
                </div>
                {cableFee > 0 && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}
                  >
                    <span style={{ fontWeight: 500, fontSize: ".8rem", color: "#71717a" }}>
                      Platform Fee
                    </span>
                    <span style={{ fontWeight: 600, fontSize: ".85rem" }}>
                      ₦{cableFee.toLocaleString()}
                    </span>
                  </div>
                )}
                <div
                  style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(124,58,237,.15)", paddingTop: ".5rem", marginTop: ".25rem" }}
                >
                  <span style={{ fontWeight: 700, fontSize: ".85rem" }}>
                    Total
                  </span>
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: ".95rem",
                      color: "#7c3aed",
                    }}
                  >
                    ₦{(parseFloat(selectedPlan.buyingPrice || 0) + cableFee).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

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

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || !selectedPlan}
              style={{ background: "linear-gradient(135deg,#7c3aed,#8b5cf6)" }}
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
                "Subscribe Now"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
