"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wifi, ChevronLeft, CheckCircle2, Phone, Lock, Eye, EyeOff, ArrowRight, RotateCcw } from "lucide-react";
import NetworkIcon, { getNetworkMeta } from "@/components/NetworkIcon";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { fetchWithCache, TTL } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { detectNetwork } from "@/lib/detectNetwork";
import ForgotPinOverlay from "@/components/ForgotPinOverlay";

export default function DataPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [networks, setNetworks] = useState([]);
  const [selectedNet, setSelectedNet] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [loadingNets, setLoadingNets] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showForgotPin, setShowForgotPin] = useState(false);

  useEffect(() => {
    fetchWithCache("data:networks", TTL.NETWORKS, () =>
      api.get("/data/networks").then((r) => r.data.data?.networks || []),
    )
      .then((nets) => {
        setNetworks(nets);
        if (nets.length > 0) setSelectedNet(nets[0]);
      })
      .finally(() => setLoadingNets(false));
  }, []);

  useEffect(() => {
    if (!selectedNet) return;
    setLoadingPlans(true);
    setSelectedPlan(null);
    setSelectedType("");
    fetchWithCache(`data:plans:${selectedNet.id}`, TTL.PLANS, () =>
      api.get(`/data/plans?network=${selectedNet.id}`).then((r) => r.data.data?.plans || []),
    )
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, [selectedNet]);

  const planTypes = [...new Set(plans.map((p) => p.type).filter(Boolean))];
  const plansForType = selectedType ? plans.filter((p) => p.type === selectedType) : [];

  const typeColor = {
    SME: { icon: "🔵", accent: "#2563eb" },
    Gifting: { icon: "🟠", accent: "#ea580c" },
    "Cooperate Gifting": { icon: "🟣", accent: "#7c3aed" },
    Other: { icon: "⚪", accent: "#64748b" },
  };

  const sellPrice = selectedPlan
    ? parseFloat(
        (user?.type === 2 ? selectedPlan.vendorPrice : null) ||
          selectedPlan.userPrice ||
          selectedPlan.price ||
          selectedPlan.amount ||
          0,
      )
    : 0;

  const canContinue = selectedNet && selectedPlan && phone && phone.length >= 10;

  const handleContinue = () => {
    if (!selectedNet) return toast.error("Select a network");
    if (!selectedPlan) return toast.error("Select a data plan");
    if (!phone || phone.length < 10) return toast.error("Enter a valid phone number");
    if (parseFloat(user?.wallet || 0) < sellPrice) return toast.error("Insufficient balance");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return toast.error("Enter your transaction PIN");
    setLoading(true);
    try {
      const r = await api.post("/data/purchase", {
        planId: selectedPlan.id,
        planSource: selectedPlan.source || "classic",
        phone,
        pin,
      });
      const result = r.data.data;
      if (result?.status === "fail") {
        toast.error(result?.message || result?.msg || "Purchase failed. Please try again.");
        return;
      }
      await refreshUser();
      if (result?.ref) return router.push(`/dashboard/transactions/${result.ref}?new=1`);
      setSuccess({ phone, plan: selectedPlan, network: selectedNet?.name, sellPrice });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Purchase failed.");
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPin) {
    return (
      <ForgotPinOverlay
        onClose={() => setShowForgotPin(false)}
        onSuccess={() => {
          setShowForgotPin(false);
          toast.success("PIN reset! Use your new PIN to complete the purchase.");
        }}
      />
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
        <div className="grad-bg" style={{ padding: "3rem 1.25rem 2rem" }}>
          <button className="back-btn" onClick={() => router.push("/dashboard")}>
            <ChevronLeft size={20} color="white" />
          </button>
        </div>
        <div style={{ padding: "1.25rem" }}>
          <div style={{ background: "white", borderRadius: "1.5rem", padding: "2rem 1.5rem", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <CheckCircle2 size={38} color="#16a34a" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "1.15rem", marginBottom: ".5rem" }}>Data Purchased!</h2>
            <p style={{ color: "#71717a", fontSize: ".85rem", marginBottom: "1.75rem" }}>Data sent to <b>{success.phone}</b></p>
            <div style={{ background: "#f9f9fb", borderRadius: "1rem", padding: "1rem", marginBottom: "1.5rem" }}>
              {[["Network", success.network], ["Plan", success.plan?.plan || success.plan?.name], ["Phone", success.phone], ["Paid", `₦${parseFloat(success.sellPrice || success.plan?.userPrice || 0).toLocaleString()}`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
                  <span style={{ fontSize: ".82rem", color: "#71717a" }}>{k}</span>
                  <span style={{ fontSize: ".82rem", fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => { setSuccess(null); setPhone(""); setSelectedPlan(null); setStep(1); setPin(""); }}>Buy More Data</button>
            <button className="btn-secondary" style={{ marginTop: ".75rem" }} onClick={() => router.push("/dashboard/transactions")}>View Transactions</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".875rem", position: "relative", zIndex: 1 }}>
          <button className="back-btn" onClick={() => step === 2 ? setStep(1) : router.back()}>
            <ChevronLeft size={20} color="white" />
          </button>
          <div>
            <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-.02em" }}>
              {step === 1 ? "Buy Data" : "Confirm Purchase"}
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              {step === 1 ? "Best rates, instant delivery" : "Enter your PIN to complete"}
            </p>
          </div>
        </div>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem", justifyContent: "center" }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ height: 4, borderRadius: 2, flex: 1, maxWidth: 120, background: s <= step ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.25)" }} />
          ))}
        </div>
      </div>

      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {step === 1 ? (
          <>
            {/* Network */}
            <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              <p style={{ fontWeight: 700, fontSize: ".78rem", color: "#52525b", marginBottom: ".875rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Select Network</p>
              {loadingNets ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".625rem" }}>
                  {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />)}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".625rem" }}>
                  {networks.map((net) => {
                    const isActive = selectedNet?.id === net.id;
                    const meta = getNetworkMeta(net.name);
                    return (
                      <button key={net.id || net.network} className="net-pill" onClick={() => setSelectedNet(net)} style={{ position: "relative", border: `2px solid ${isActive ? meta.ring : "#e4e4e7"}`, background: isActive ? meta.ring : "white", transition: "background .18s, border-color .18s" }}>
                        {isActive && (
                          <span style={{ position: "absolute", top: 5, right: 5, width: 17, height: 17, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.18)" }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke={meta.ring} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        )}
                        <NetworkIcon logoUrl={net.logoUrl} name={net.name} size={40} />
                        <span style={{ fontSize: ".7rem", fontWeight: 700, color: isActive ? "white" : "#3f3f46" }}>{net.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Plan Type + Plans */}
            <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: ".78rem", color: "#52525b", textTransform: "uppercase", letterSpacing: ".04em", margin: 0 }}>Choose Plan</p>
              <div>
                <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "#71717a", marginBottom: ".4rem", letterSpacing: ".03em" }}>Plan Type</label>
                <div style={{ position: "relative" }}>
                  <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedPlan(null); }} disabled={loadingPlans || planTypes.length === 0} style={{ width: "100%", appearance: "none", WebkitAppearance: "none", background: selectedType ? "#f5f3ff" : "#f8fafc", border: `2px solid ${selectedType ? "#818cf8" : "#e4e4e7"}`, borderRadius: 14, padding: ".75rem 3rem .75rem 1rem", fontSize: ".9rem", fontWeight: 600, color: selectedType ? "#4f46e5" : "#71717a", cursor: "pointer", outline: "none", transition: "border-color .15s, background .15s", fontFamily: "inherit" }}>
                    <option value="">— Select type —</option>
                    {planTypes.map((t) => { const meta = typeColor[t] || typeColor.Other; return <option key={t} value={t}>{meta.icon} {t}</option>; })}
                  </select>
                  <svg style={{ position: "absolute", right: ".875rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke={selectedType ? "#4f46e5" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                {loadingPlans && <p style={{ fontSize: ".72rem", color: "#a1a1aa", marginTop: ".4rem" }}>Loading plans…</p>}
              </div>
              {selectedType && (
                <div>
                  <p style={{ fontSize: ".72rem", fontWeight: 600, color: "#71717a", marginBottom: ".5rem", letterSpacing: ".03em" }}>{plansForType.length} plan{plansForType.length !== 1 ? "s" : ""} available</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".4rem" }}>
                    {plansForType.map((plan) => {
                      const isSelected = selectedPlan?.id === plan.id;
                      const price = parseFloat((user?.type === 2 ? plan.vendorPrice : null) || plan.userPrice || plan.price || plan.amount || 0);
                      const palette = typeColor[selectedType] || typeColor.Other;
                      return (
                        <button key={plan.id} onClick={() => setSelectedPlan(isSelected ? null : plan)} style={{ background: isSelected ? palette.accent : "white", border: `1.5px solid ${isSelected ? palette.accent : "#e4e4e7"}`, borderRadius: 12, padding: ".45rem .35rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: ".15rem", transition: "background .15s, border-color .15s", outline: "none" }}>
                          <span style={{ fontWeight: 800, fontSize: ".72rem", color: isSelected ? "white" : "#18181b", lineHeight: 1.2, textAlign: "center" }}>{plan.plan || plan.name}</span>
                          {(plan.validity || plan.duration) && <span style={{ fontSize: ".6rem", color: isSelected ? "rgba(255,255,255,.75)" : "#71717a", lineHeight: 1.2 }}>{plan.validity ? `${plan.validity} day${plan.validity === "1" ? "" : "s"}` : plan.duration}</span>}
                          <span style={{ fontWeight: 900, fontSize: ".78rem", color: isSelected ? "white" : palette.accent, letterSpacing: "-.01em", marginTop: ".05rem" }}>₦{price.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedPlan && (() => {
                const price = parseFloat((user?.type === 2 ? selectedPlan.vendorPrice : null) || selectedPlan.userPrice || selectedPlan.price || selectedPlan.amount || 0);
                const palette = typeColor[selectedType] || typeColor.Other;
                return (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${palette.accent}12 0%, ${palette.accent}06 100%)`, border: `1.5px solid ${palette.accent}30`, borderRadius: 14, padding: ".75rem 1rem" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: ".88rem", color: palette.accent }}>{selectedPlan.plan || selectedPlan.name}</p>
                      <p style={{ margin: 0, fontSize: ".7rem", color: "#71717a", marginTop: ".15rem" }}>{selectedType} · {selectedPlan.validity ? `${selectedPlan.validity} day${selectedPlan.validity === "1" ? "" : "s"}` : selectedPlan.duration || "—"}</p>
                    </div>
                    <span style={{ fontWeight: 900, fontSize: "1.1rem", color: palette.accent }}>₦{price.toLocaleString()}</span>
                  </div>
                );
              })()}
            </div>

            {/* Phone Number */}
            <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              <label style={{ fontWeight: 700, fontSize: ".78rem", color: "#52525b", display: "block", marginBottom: ".75rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Phone Number</label>
              <div className="input-wrap">
                <Phone size={17} style={{ position: "absolute", left: ".875rem", color: "#a1a1aa", pointerEvents: "none" }} />
                <input className="form-input" type="tel" placeholder="08012345678" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} style={{ paddingLeft: "2.75rem" }} />
              </div>
              {phone.length >= 4 && (
                <div style={{ marginTop: ".5rem", fontSize: ".82rem", fontWeight: 600, color: detectNetwork(phone) ? "#16a34a" : "#dc2626" }}>
                  {detectNetwork(phone) ? (
                    <>Network detected: <span style={{ fontWeight: 800 }}>{detectNetwork(phone)}</span> <span style={{ fontSize: ".75rem", color: "#16a34a" }}>&#10003;</span></>
                  ) : (
                    <span>Network not recognized — ported number?</span>
                  )}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button className="btn-primary" onClick={handleContinue} disabled={!canContinue} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", opacity: canContinue ? 1 : 0.5 }}>
              Continue <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            {/* Step 2: Confirm + PIN */}
            {/* Order Summary */}
            <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              <p style={{ fontWeight: 700, fontSize: ".78rem", color: "#52525b", marginBottom: ".875rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Order Summary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                {[["Network", selectedNet?.name], ["Plan", selectedPlan?.plan || selectedPlan?.name], ["Type", selectedType], ["Phone", phone], ["Amount", `₦${sellPrice.toLocaleString()}`]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: ".82rem", color: "#71717a" }}>{k}</span>
                    <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#0f172a" }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: ".6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: ".85rem", fontWeight: 700, color: "#0f172a" }}>Wallet Balance</span>
                  <span style={{ fontSize: ".85rem", fontWeight: 700, color: parseFloat(user?.wallet || 0) >= sellPrice ? "#16a34a" : "#ef4444" }}>₦{parseFloat(user?.wallet || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Transaction PIN */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                <label style={{ fontWeight: 700, fontSize: ".78rem", color: "#52525b", display: "block", marginBottom: ".75rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Transaction PIN</label>
                <div className="input-wrap">
                  <Lock size={18} className="input-icon" />
                  <input className="form-input" type={showPin ? "text" : "password"} inputMode="numeric" autoComplete="off" maxLength={4} placeholder="Enter 4-digit PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} style={{ paddingRight: "2.75rem" }} />
                  <button type="button" onClick={() => setShowPin((v) => !v)} style={{ position: "absolute", right: ".875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8", display: "flex", alignItems: "center" }} tabIndex={-1}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="button" onClick={() => setShowForgotPin(true)} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: ".78rem", fontWeight: 600, cursor: "pointer", padding: 0, marginTop: ".6rem", display: "flex", alignItems: "center", gap: ".3rem" }}>
                  <RotateCcw size={13} /> Forgot PIN?
                </button>
              </div>

              <button className="btn-primary" type="submit" disabled={loading || !pin} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                    <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spinner" />
                    Processing...
                  </span>
                ) : (
                  <>Pay ₦{sellPrice.toLocaleString()}</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
