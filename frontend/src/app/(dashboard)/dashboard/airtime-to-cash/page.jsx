"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Phone,
  CreditCard,
  MessageSquare,
  Clock,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ATC_GRADIENT = "linear-gradient(135deg,#059669,#10b981,#34d399)";

export default function AirtimeToCashPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("new");

  // Form state
  const [network, setNetwork] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState(null);
  const [networkError, setNetworkError] = useState("");
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [markedTransferred, setMarkedTransferred] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/airtime-to-cash/config").catch(() => ({ data: { data: {} } })),
      api.get("/airtime-to-cash/history").catch(() => ({ data: { data: { requests: [] } } })),
    ]).then(([configRes, historyRes]) => {
      setConfig(configRes.data.data || {});
      setHistory(historyRes.data.data?.requests || []);
    }).finally(() => setLoading(false));
  }, []);

  const MTN_PREFIXES = [
    "0803","0806","0816","0903","0906","0810","0813","0902","0908","0916","0814","0703","0706","0913",
  ];
  const AIRTEL_PREFIXES = ["0802","0808","0812","0708","0701","0907","0901"];
  const GLO_PREFIXES = ["0805","0807","0811","0815","0905","0705","0819"];
  const NINE_MOBILE_PREFIXES = ["0809","0817","0818","0909","0908"];

  const detectNetwork = (num) => {
    const prefix = num.substring(0, 4);
    if (MTN_PREFIXES.includes(prefix)) return "MTN";
    if (AIRTEL_PREFIXES.includes(prefix)) return "AIRTEL";
    if (GLO_PREFIXES.includes(prefix)) return "GLO";
    if (NINE_MOBILE_PREFIXES.includes(prefix)) return "9MOBILE";
    return null;
  };

  const handleNumberChange = (val) => {
    const digits = val.replace(/\D/g, "").substring(0, 11);
    setSenderNumber(digits);
    setNetworkError("");
    setDetectedNetwork(null);
    if (digits.length === 11) {
      const detected = detectNetwork(digits);
      setDetectedNetwork(detected);
      if (!detected) {
        setNetworkError("Invalid phone number. Enter a valid Nigerian number.");
      } else if (detected !== "MTN" && detected !== "AIRTEL") {
        setNetworkError(`This number is ${detected}. We only accept MTN and Airtel airtime.`);
      } else if (detected !== network) {
        setNetworkError(`This number is ${detected}, not ${network}. Change network to ${detected}.`);
      }
    } else if (digits.length > 0) {
      setDetectedNetwork(null);
    }
  };

  const selectedNet = config?.networks?.find((n) => n.id === network);
  const receiveAmount = amount ? (parseFloat(amount) * (config?.rate || 80)) / 100 : 0;

  const canProceedStep1 = !!network;
  const canProceedStep2 = senderNumber.length === 11 && !networkError && detectedNetwork && (detectedNetwork === "MTN" || detectedNetwork === "AIRTEL") && detectedNetwork === network;
  const canProceedStep3 = !!amount && parseFloat(amount) >= (config?.minAmount || 100) && !!payoutMethod;

  const whatsAppMessage = encodeURIComponent(
    `Hello, I've completed an airtime transfer for Airtime to Cash.\n\nAmount: ₦${parseFloat(amount || 0).toLocaleString()}\nName: ${(user?.firstname || "")} ${(user?.lastname || "")}\nEmail: ${user?.email || ""}\nPhone: ${senderNumber}\n\nPlease verify and credit my account.`
  );
  const whatsAppNumber = (config?.whatsapp || "07088318837").replace(/[^0-9]/g, "").replace(/^0+/, "");

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post("/airtime-to-cash/submit", {
        network,
        senderNumber,
        amount: parseFloat(amount),
        payoutMethod,
        bankName: payoutMethod === "bank" ? bankName : undefined,
        bankAccount: payoutMethod === "bank" ? bankAccount : undefined,
        bankAccountName: payoutMethod === "bank" ? bankAccountName : undefined,
      });
      setResult(res.data.data);
      await refreshUser();
      const historyRes = await api.get("/airtime-to-cash/history");
      setHistory(historyRes.data.data?.requests || []);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setNetwork("");
    setSenderNumber("");
    setDetectedNetwork(null);
    setNetworkError("");
    setAmount("");
    setPayoutMethod("");
    setBankName("");
    setBankAccount("");
    setBankAccountName("");
    setResult(null);
  };

  const statusBadge = (s) => {
    const map = {
      pending: { label: "Pending", bg: "#fef9c3", color: "#a16207" },
      completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
      rejected: { label: "Rejected", bg: "#fee2e2", color: "#dc2626" },
    };
    const m = map[s] || map.pending;
    return (
      <span style={{ fontSize: ".7rem", fontWeight: 600, padding: ".2rem .6rem", borderRadius: 99, background: m.bg, color: m.color }}>
        {m.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!config?.enabled) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
        <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.5rem", background: ATC_GRADIENT }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".875rem" }}>
            <button onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={20} color="white" />
            </button>
            <div>
              <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.125rem" }}>Airtime to Cash</h1>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".75rem" }}>Convert airtime to cash</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "3rem 1.25rem", textAlign: "center" }}>
          <AlertTriangle size={40} color="#f59e0b" style={{ margin: "0 auto 1rem" }} />
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: ".5rem" }}>Service Unavailable</h2>
          <p style={{ color: "#71717a", fontSize: ".9rem" }}>Airtime to Cash is currently disabled. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      {/* Header */}
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 1.5rem", background: ATC_GRADIENT }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".875rem" }}>
          <button onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={20} color="white" />
          </button>
          <div>
            <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.125rem" }}>Airtime to Cash</h1>
            <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".75rem" }}>Convert your airtime to wallet or bank</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: "2rem", padding: ".25rem .75rem", fontSize: ".75rem", color: "white", fontWeight: 700 }}>
              Rate: {config?.rate || 80}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ margin: "1.25rem 1.25rem 0", display: "flex", background: "white", borderRadius: "1rem", padding: ".25rem", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        {[{ key: "new", label: "New Request" }, { key: "history", label: "History" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: ".625rem", borderRadius: ".75rem", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: ".85rem", background: tab === t.key ? "#059669" : "transparent", color: tab === t.key ? "white" : "#64748b", transition: "all .2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "1.25rem" }}>
        {tab === "history" ? (
          <div>
            {history.length === 0 ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                <Clock size={32} color="#cbd5e1" style={{ margin: "0 auto .75rem" }} />
                <p style={{ color: "#94a3b8", fontSize: ".875rem" }}>No requests yet</p>
              </div>
            ) : (
              <div className="card">
                {history.map((r, i) => (
                  <div key={r.id} style={{ padding: "1rem 1.25rem", borderBottom: i < history.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".3rem" }}>
                      <div style={{ fontSize: ".875rem", fontWeight: 700 }}>
                        ₦{r.amount.toLocaleString()} → ₦{r.receiveAmount.toLocaleString()}
                      </div>
                      {statusBadge(r.status)}
                    </div>
                    <div style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                      {r.network} · {r.senderNumber} · {new Date(r.createdAt).toLocaleDateString("en-NG")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Step indicator */}
            {step <= 4 && (
              <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem" }}>
                {["Network", "Phone", "Amount", "Details"].map((label, i) => (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: step > i + 1 ? "#059669" : step === i + 1 ? "#059669" : "#e2e8f0", color: step >= i + 1 ? "white" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .3rem", fontSize: ".75rem", fontWeight: 700, transition: "all .3s" }}>
                      {step > i + 1 ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: ".65rem", color: step >= i + 1 ? "#059669" : "#94a3b8", fontWeight: step === i + 1 ? 700 : 400 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Network */}
            {step === 1 && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Select Network</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                  {config?.networks?.map((n) => {
                    const netStyle = n.id === "MTN"
                      ? { bg: "#fffde7", border: "#fbc02d", color: "#000000", accent: "#fbc02d" }
                      : { bg: "#fff0f0", border: "#e53935", color: "#e53935", accent: "#e53935" };
                    const isSelected = network === n.id;
                    return (
                      <button key={n.id} type="button" onClick={() => { setNetwork(n.id); setNetworkError(""); }} style={{ padding: "1.5rem .75rem", borderRadius: "1rem", border: `2.5px solid ${isSelected ? netStyle.border : "#e2e8f0"}`, background: isSelected ? netStyle.bg : "white", cursor: "pointer", textAlign: "center", transition: "all .15s", boxShadow: isSelected ? `0 4px 14px ${netStyle.border}30` : "0 1px 3px rgba(0,0,0,.06)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: netStyle.border, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .6rem" }}>
                          <span style={{ color: "white", fontWeight: 900, fontSize: n.id === "MTN" ? ".7rem" : ".65rem", letterSpacing: ".02em" }}>{n.id === "MTN" ? "MTN" : "Airtel"}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: ".9rem", color: netStyle.color }}>{n.label}</div>
                        {isSelected && <div style={{ marginTop: ".4rem", fontSize: ".7rem", color: netStyle.accent, fontWeight: 600 }}>✓ Selected</div>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => canProceedStep1 && setStep(2)} disabled={!canProceedStep1} style={{ width: "100%", padding: ".875rem", marginTop: "1.25rem", borderRadius: "1rem", border: "none", background: canProceedStep1 ? ATC_GRADIENT : "#e2e8f0", color: canProceedStep1 ? "white" : "#94a3b8", fontWeight: 700, fontSize: ".9rem", cursor: canProceedStep1 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                      Next <ChevronRight size={16} />
                    </button>
              </div>
            )}

            {/* Step 2: Phone Number */}
            {step === 2 && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Enter Your Phone Number</h3>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>
                  Sender Phone Number
                </label>
                <input type="tel" placeholder="e.g. 08012345678" value={senderNumber} onChange={(e) => handleNumberChange(e.target.value)} maxLength={11} style={{ width: "100%", border: `1.5px solid ${networkError ? "#dc2626" : "#e4e4e7"}`, borderRadius: ".875rem", padding: ".875rem 1rem", fontSize: ".95rem", outline: "none", boxSizing: "border-box" }} />
                {detectedNetwork && !networkError && (
                  <div style={{ marginTop: ".5rem", fontSize: ".8rem", color: "#059669", fontWeight: 600 }}>
                    ✓ Network is: {detectedNetwork}
                  </div>
                )}
                {networkError && (
                  <div style={{ marginTop: ".5rem", fontSize: ".8rem", color: "#dc2626", fontWeight: 600, background: "#fef2f2", padding: ".5rem .75rem", borderRadius: ".5rem", border: "1px solid #fecaca" }}>
                    ⚠ {networkError}
                  </div>
                )}
                <p style={{ marginTop: ".5rem", fontSize: ".72rem", color: "#71717a", fontStyle: "italic" }}>
                  NB: Ignore this warning for Ported Numbers
                </p>
                <div style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem" }}>
                  <button onClick={() => setStep(1)} style={{ padding: ".875rem 1.5rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: ".85rem" }}>
                    Back
                  </button>
                  <button onClick={() => canProceedStep2 && setStep(3)} disabled={!canProceedStep2} style={{ flex: 1, padding: ".875rem", borderRadius: "1rem", border: "none", background: canProceedStep2 ? ATC_GRADIENT : "#e2e8f0", color: canProceedStep2 ? "white" : "#94a3b8", fontWeight: 700, fontSize: ".9rem", cursor: canProceedStep2 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Amount + Payout */}
            {step === 3 && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>Enter Details</h3>

                <div style={{ background: "#f0fdf4", borderRadius: ".875rem", padding: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem" }}>
                    <span style={{ color: "#374151" }}>Rate</span>
                    <span style={{ fontWeight: 700, color: "#059669" }}>{config?.rate || 80}%</span>
                  </div>
                </div>

                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>
                  Amount to Convert (₦)
                </label>
                <input type="number" placeholder={`Min ₦${config?.minAmount || 100}`} value={amount} onChange={(e) => setAmount(e.target.value)} min={config?.minAmount || 100} max={config?.maxAmount || 50000} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".875rem 1rem", fontSize: ".95rem", outline: "none", boxSizing: "border-box", marginBottom: ".75rem" }} />

                {amount && (
                  <div style={{ background: "#f0fdf4", borderRadius: ".875rem", padding: "1rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: ".85rem", color: "#374151" }}>You will receive</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#059669" }}>₦{receiveAmount.toLocaleString()}</span>
                  </div>
                )}

                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>
                  How do you want to receive the money?
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginBottom: "1.25rem" }}>
                  {[{ key: "wallet", label: "Wallet Balance", icon: "💰" }, { key: "bank", label: "Bank Account", icon: "🏦" }].map((m) => (
                    <button key={m.key} type="button" onClick={() => setPayoutMethod(m.key)} style={{ padding: "1rem", borderRadius: "1rem", border: `2px solid ${payoutMethod === m.key ? "#059669" : "#e2e8f0"}`, background: payoutMethod === m.key ? "#ecfdf5" : "white", cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>{m.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: ".8rem" }}>{m.label}</div>
                    </button>
                  ))}
                </div>

                {payoutMethod === "bank" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Bank Name</label>
                      <select value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".875rem 1rem", fontSize: ".9rem", outline: "none", boxSizing: "border-box", background: "white" }}>
                        <option value="">Select bank</option>
                        {["Access Bank","Citibank","Ecobank","Fidelity Bank","First Bank","First City Monument Bank","Globus Bank","Guaranty Trust Bank","Heritage Bank","Keystone Bank","Kuda Bank","Opay","Palmpay","Polaris Bank","Providus Bank","Stanbic IBTC","Standard Chartered","Sterling Bank","SunTrust Bank","Titan Trust Bank","Union Bank","United Bank for Africa","Unity Bank","VFD Microfinance Bank","Wema Bank","Zenith Bank"].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Account Number</label>
                      <input type="tel" placeholder="10-digit account number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, "").substring(0, 10))} maxLength={10} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".875rem 1rem", fontSize: ".95rem", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Account Name</label>
                      <input type="text" placeholder="Account holder name" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} style={{ width: "100%", border: "1.5px solid #e4e4e7", borderRadius: ".875rem", padding: ".875rem 1rem", fontSize: ".95rem", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem" }}>
                  <button onClick={() => setStep(2)} style={{ padding: ".875rem 1.5rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: ".85rem" }}>Back</button>
                  <button onClick={() => canProceedStep3 && setStep(4)} disabled={!canProceedStep3} style={{ flex: 1, padding: ".875rem", borderRadius: "1rem", border: "none", background: canProceedStep3 ? ATC_GRADIENT : "#e2e8f0", color: canProceedStep3 ? "white" : "#94a3b8", fontWeight: 700, fontSize: ".9rem", cursor: canProceedStep3 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Transfer Instructions + Mark as Transferred */}
            {step === 4 && !result && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: ".75rem" }}>Transfer Airtime</h3>

                {/* Step-by-step guide */}
                <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "1rem", padding: "1rem", marginBottom: "1.25rem" }}>
                  <p style={{ fontSize: ".82rem", fontWeight: 700, color: "#1e40af", marginBottom: ".6rem" }}>How to complete this transfer:</p>
                  {[
                    { step: "1", text: "Copy the airtime number below" },
                    { step: "2", text: `Dial *499*₦${parseFloat(amount).toLocaleString()}*${selectedNet?.receiveNumber}# or use your phone dialer to transfer ₦${parseFloat(amount).toLocaleString()} airtime` },
                    { step: "3", text: "Come back and tap \"Mark as Transferred\" below" },
                    { step: "4", text: "Tap \"Contact Admin\" on WhatsApp to confirm your transfer" },
                  ].map((s) => (
                    <div key={s.step} style={{ display: "flex", gap: ".6rem", marginBottom: ".5rem", alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 10, background: "#3b82f6", color: "white", fontSize: ".7rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.step}</div>
                      <p style={{ fontSize: ".78rem", color: "#374151", margin: 0, lineHeight: 1.4 }}>{s.text}</p>
                    </div>
                  ))}
                </div>

                {/* Number to transfer to */}
                <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: "1rem", padding: "1rem", marginBottom: "1.25rem" }}>
                  <p style={{ fontSize: ".85rem", color: "#c2410c", fontWeight: 600, marginBottom: ".5rem" }}>Transfer ₦{parseFloat(amount).toLocaleString()} airtime to:</p>
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", background: "white", borderRadius: ".75rem", padding: ".75rem 1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: ".75rem", color: "#71717a" }}>{network} Number</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: ".05em" }}>{selectedNet?.receiveNumber}</div>
                    </div>
                    <button onClick={() => handleCopy(selectedNet?.receiveNumber)} style={{ padding: ".5rem .75rem", borderRadius: ".5rem", border: "1.5px solid #e2e8f0", background: copied ? "#dcfce7" : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".75rem", fontWeight: 600, color: copied ? "#15803d" : "#64748b" }}>
                      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: "#f9f9fb", borderRadius: "1rem", padding: "1rem", marginBottom: "1.25rem" }}>
                  {[
                    ["Network", network],
                    ["Your Number", senderNumber],
                    ["Amount", `₦${parseFloat(amount).toLocaleString()}`],
                    ["You Receive", `₦${receiveAmount.toLocaleString()}`],
                    ["Payout", payoutMethod === "wallet" ? "Wallet Balance" : `${bankName} - ${bankAccount}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem", fontSize: ".82rem" }}>
                      <span style={{ color: "#71717a" }}>{k}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                <div style={{ background: "#fefce8", border: "1.5px solid #fde68a", borderRadius: ".875rem", padding: ".75rem 1rem", marginBottom: "1.25rem", display: "flex", gap: ".5rem", alignItems: "flex-start" }}>
                  <AlertTriangle size={14} color="#ca8a04" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: ".78rem", color: "#854d0e", margin: 0, lineHeight: 1.4 }}>Only transfer from a {network} number. Wrong network may result in loss of funds.</p>
                </div>

                <div style={{ display: "flex", gap: ".75rem" }}>
                  <button onClick={() => setStep(3)} style={{ padding: ".875rem 1.5rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: ".85rem" }}>Back</button>
                  <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: ".875rem", borderRadius: "1rem", border: "none", background: !submitting ? ATC_GRADIENT : "#e2e8f0", color: !submitting ? "white" : "#94a3b8", fontWeight: 700, fontSize: ".9rem", cursor: !submitting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                    {submitting ? "Processing..." : "✓ Mark as Transferred"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4b: After marking — WhatsApp guidance */}
            {step === 4 && result && (
              <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <CheckCircle2 size={32} color="#059669" />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: ".5rem" }}>Transfer Noted!</h2>
                <p style={{ color: "#71717a", fontSize: ".85rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                  Please contact admin on WhatsApp to confirm you&apos;ve transferred the airtime. Include your transfer screenshot as proof.
                </p>

                <div style={{ background: "#f9f9fb", borderRadius: "1rem", padding: "1rem", marginBottom: "1.25rem", textAlign: "left" }}>
                  {[
                    ["Amount to Send", `₦${parseFloat(amount).toLocaleString()}`],
                    ["Send To", `${network}: ${selectedNet?.receiveNumber}`],
                    ["You Receive", `₦${receiveAmount.toLocaleString()}`],
                    ["Ref", result.request?.ref],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem", fontSize: ".82rem" }}>
                      <span style={{ color: "#71717a" }}>{k}</span>
                      <span style={{ fontWeight: 700, wordBreak: "break-all", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                    </div>
                  ))}
                </div>

                <a href={`https://wa.me/234${whatsAppNumber}?text=${whatsAppMessage}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", padding: ".875rem", borderRadius: "1rem", background: "#25D366", color: "white", fontWeight: 700, fontSize: ".9rem", textDecoration: "none", marginBottom: ".75rem" }}>
                  <MessageSquare size={16} /> Contact Admin (WhatsApp)
                </a>

                <button onClick={() => { resetForm(); setTab("history"); }} style={{ width: "100%", padding: ".875rem", borderRadius: "1rem", border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 600, fontSize: ".9rem" }}>
                  View History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
