"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, RefreshCw, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import api from "@/lib/api";

export default function FundWalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const settings = useSiteSettings();
  const [copied, setCopied] = useState(false);
  const [virtualAccounts, setVirtualAccounts] = useState(null);
  const [vasPending, setVasPending] = useState(false);
  const [vasLoading, setVasLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("auto");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualRequests, setManualRequests] = useState([]);
  const [dvaFailed, setDvaFailed] = useState(false);
  const [dynamicAmount, setDynamicAmount] = useState("");
  const [dynamicLoading, setDynamicLoading] = useState(false);

  const fetchVirtualAccounts = useCallback(async () => {
    setVasLoading(true);
    try {
      const res = await api.get("/user/virtual-accounts");
      setVirtualAccounts(res.data.data.accounts || []);
      setVasPending(res.data.data.pending || false);
      setDvaFailed(res.data.data.dvaFailed || false);
    } catch {
      setVirtualAccounts([]);
      setVasPending(false);
      setDvaFailed(false);
    } finally {
      setVasLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVirtualAccounts();
  }, [fetchVirtualAccounts]);

  useEffect(() => {
    if (!vasPending || vasLoading) return;
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        return;
      }
      fetchVirtualAccounts();
    }, 3000);
    return () => clearInterval(interval);
  }, [vasPending, vasLoading, fetchVirtualAccounts]);

  useEffect(() => {
    if (activeTab !== "manual") return;
    const fetchManual = async () => {
      setManualLoading(true);
      try {
        const res = await api.get("/user/manual-funds");
        setManualRequests(res.data.data.requests || []);
      } catch {
        setManualRequests([]);
      } finally {
        setManualLoading(false);
      }
    };
    fetchManual();
  }, [activeTab]);

  useEffect(() => {
    if (document.getElementById("paystack-script")) return;
    const script = document.createElement("script");
    script.id = "paystack-script";
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleDynamicPay = async () => {
    const amt = parseFloat(dynamicAmount);
    if (!amt || amt < 100) return toast.error("Minimum amount is ₦100");
    if (dynamicLoading) return;

    setDynamicLoading(true);
    try {
      const keyRes = await api.get("/public/paystack-key");
      const publicKey = keyRes.data.data.publicKey;
      if (!publicKey) { toast.error("Payment not configured."); setDynamicLoading(false); return; }

      const reference = `KIR-${user.id}-${Date.now()}`;
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: Math.round(amt * 100),
        ref: reference,
        metadata: { userId: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, purpose: "wallet_funding" },
        onSuccess: () => { toast.success("Payment successful! Your wallet will be credited shortly."); setDynamicLoading(false); router.push("/dashboard/fund-wallet"); },
        onClose: () => { setDynamicLoading(false); },
      });
      handler.openIframe();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to initialize payment.");
      setDynamicLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleContactAdmin = () => {
    if (!settings.whatsapp) {
      toast.error("Admin WhatsApp number is not configured yet.");
      return;
    }
    const number = settings.whatsapp.replace(/[^0-9]/g, "");
    const msg =
      "I made a manual transfer. Please confirm my wallet funding. I can share the receipt here.";
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, "_blank");
  };

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
          <button className="back-btn" onClick={() => router.back()}>
            <ChevronLeft size={20} color="white" />
          </button>
          <div>
            <h1
              style={{ color: "white", fontWeight: 800, fontSize: "1.15rem" }}
            >
              Fund Wallet
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              Balance: ₦{parseFloat(user?.wallet || 0).toLocaleString()}
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
        <div style={{ display: "flex", gap: ".5rem" }}>
          {[
            { key: "auto", label: "Automatic" },
            { key: "manual", label: "Manual" },
            { key: "dynamic", label: "Dynamic" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: ".75rem",
                borderRadius: ".9rem",
                fontWeight: 800,
                border:
                  activeTab === tab.key
                    ? "2px solid #4f46e5"
                    : "1.5px solid #e4e4e7",
                background:
                  activeTab === tab.key ? "rgba(79,70,229,.07)" : "white",
                color: activeTab === tab.key ? "#4f46e5" : "#71717a",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "auto" ? (
          <>
            {virtualAccounts === null || vasLoading ? (
              <div
                style={{
                  background: "linear-gradient(135deg,#312e81 0%,#4f46e5 100%)",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  boxShadow: "0 4px 20px rgba(79,70,229,.35)",
                }}
              >
                <RefreshCw
                  size={18}
                  style={{ opacity: 0.7, animation: "spin 1s linear infinite" }}
                />
                <p style={{ fontSize: ".85rem", opacity: 0.85 }}>
                  Loading your dedicated account…
                </p>
              </div>
            ) : vasPending ? (
              <div
                style={{
                  background: "linear-gradient(135deg,#312e81 0%,#4f46e5 100%)",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(79,70,229,.35)",
                }}
              >
                <p
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    opacity: 0.75,
                    marginBottom: ".5rem",
                  }}
                >
                  Your Dedicated Account
                </p>
                <p
                  style={{
                    fontSize: ".85rem",
                    opacity: 0.85,
                    marginBottom: "1rem",
                  }}
                >
                  Your virtual account is being created — this usually takes a few
                  seconds.
                </p>
                <button
                  onClick={fetchVirtualAccounts}
                  disabled={vasLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".4rem",
                    background: "rgba(255,255,255,.18)",
                    border: "none",
                    borderRadius: ".75rem",
                    padding: ".55rem 1rem",
                    cursor: "pointer",
                    color: "white",
                    fontWeight: 700,
                    fontSize: ".78rem",
                  }}
                >
                  <RefreshCw size={14} /> Check Again
                </button>
              </div>
            ) : virtualAccounts.length > 0 ? (
              <div
                style={{
                  background: "linear-gradient(135deg,#312e81 0%,#4f46e5 100%)",
                  borderRadius: "1.5rem",
                  padding: "1.25rem",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(79,70,229,.35)",
                }}
              >
                <p
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    opacity: 0.75,
                    marginBottom: ".875rem",
                  }}
                >
                  Your Dedicated Accounts
                </p>
                <p
                  style={{
                    fontSize: ".78rem",
                    opacity: 0.8,
                    marginBottom: "1rem",
                  }}
                >
                  Transfer directly to any of these accounts to fund your wallet
                  instantly — no reference needed.
                </p>

                {parseFloat(settings?.walletFundingFeePercent || "0") > 0 && (
                  <div
                    style={{
                      background: "rgba(255,255,255,.1)",
                      borderRadius: ".75rem",
                      padding: ".625rem .875rem",
                      marginBottom: "1rem",
                      fontSize: ".78rem",
                      opacity: 0.9,
                    }}
                  >
                    Wallet funding fee: {settings.walletFundingFeePercent}%
                    {parseFloat(settings?.walletFundingFeeCap || "50") > 0 &&
                      ` (max ₦${settings.walletFundingFeeCap})`}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".625rem",
                  }}
                >
                  {virtualAccounts.map((acct, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,.12)",
                        borderRadius: "1rem",
                        padding: ".875rem 1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: ".35rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: ".72rem",
                            opacity: 0.75,
                            fontWeight: 600,
                          }}
                        >
                          {acct.bankName}
                        </span>
                        <button
                          onClick={() => copy(acct.accountNumber)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".3rem",
                            background: "rgba(255,255,255,.18)",
                            border: "none",
                            borderRadius: "6px",
                            padding: ".3rem .65rem",
                            cursor: "pointer",
                            color: "white",
                            fontWeight: 700,
                            fontSize: ".7rem",
                          }}
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <p
                        style={{
                          fontSize: "1.35rem",
                          fontWeight: 800,
                          letterSpacing: ".05em",
                          marginBottom: ".25rem",
                        }}
                      >
                        {acct.accountNumber}
                      </p>
                      <p style={{ fontSize: ".78rem", opacity: 0.85 }}>
                        {acct.accountName || `${user?.firstname} ${user?.lastname}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "white",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#94a3b8" }}>
                  No accounts available yet. Please contact support.
                </p>
              </div>
            )}
          </>
        ) : activeTab === "dynamic" ? (
          <>
            <div
              style={{
                background: "linear-gradient(135deg,#312e81 0%,#4f46e5 100%)",
                borderRadius: "1.5rem",
                padding: "1.5rem",
                color: "white",
                boxShadow: "0 4px 20px rgba(79,70,229,.35)",
              }}
            >
              <p style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", opacity: 0.75, marginBottom: ".5rem" }}>
                Fund Wallet Online
              </p>
              <p style={{ fontSize: ".85rem", opacity: 0.85, marginBottom: "1rem" }}>
                Pay with your card, bank transfer, or USSD — instant credit.
              </p>

              {parseFloat(settings?.walletFundingFeePercent || "0") > 0 && (
                <div style={{ background: "rgba(255,255,255,.1)", borderRadius: ".75rem", padding: ".625rem .875rem", marginBottom: "1rem", fontSize: ".78rem", opacity: 0.9 }}>
                  Wallet funding fee: {settings.walletFundingFeePercent}%
                  {parseFloat(settings?.walletFundingFeeCap || "50") > 0 && ` (max ₦${settings.walletFundingFeeCap})`}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                <div>
                  <label style={{ fontSize: ".78rem", opacity: 0.8, fontWeight: 600, marginBottom: ".35rem", display: "block" }}>Amount (₦)</label>
                  <input type="number" min="100" step="50" placeholder="Enter amount" value={dynamicAmount} onChange={(e) => setDynamicAmount(e.target.value)}
                    style={{ width: "100%", padding: ".85rem 1rem", borderRadius: ".75rem", border: "2px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.12)", color: "white", fontSize: "1.1rem", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <button onClick={handleDynamicPay} disabled={dynamicLoading || !dynamicAmount || parseFloat(dynamicAmount) < 100}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", background: dynamicLoading ? "rgba(255,255,255,.15)" : "white", border: "none", borderRadius: ".75rem", padding: ".85rem", cursor: dynamicLoading ? "wait" : "pointer", color: "#4f46e5", fontWeight: 800, fontSize: ".9rem", opacity: !dynamicAmount || parseFloat(dynamicAmount) < 100 ? 0.5 : 1 }}>
                  <CreditCard size={18} />
                  {dynamicLoading ? "Initializing..." : "Pay Now"}
                </button>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} onClick={() => setDynamicAmount(String(amt))}
                    style={{ padding: ".35rem .7rem", borderRadius: ".5rem", background: dynamicAmount === String(amt) ? "white" : "rgba(255,255,255,.15)", color: dynamicAmount === String(amt) ? "#4f46e5" : "white", border: "none", fontWeight: 700, fontSize: ".72rem", cursor: "pointer" }}>
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: "1.5rem", padding: "1.25rem", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
              <h4 style={{ fontWeight: 800, marginBottom: ".5rem", fontSize: ".9rem" }}>How it works</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                {[
                  { step: "1", text: "Enter the amount you want to fund" },
                  { step: "2", text: "Click Pay Now and choose your payment method" },
                  { step: "3", text: "Complete payment — wallet is credited instantly" },
                ].map((item) => (
                  <div key={item.step} style={{ display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 800, flexShrink: 0 }}>
                      {item.step}
                    </div>
                    <p style={{ fontSize: ".82rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                boxShadow: "0 4px 20px rgba(0,0,0,.08)",
              }}
            >
              <h3 style={{ fontWeight: 800, marginBottom: ".4rem" }}>
                Manual Transfer
              </h3>
              <p style={{ fontSize: ".85rem", color: "#64748b" }}>
                Transfer to the admin account below, then contact admin on WhatsApp.
              </p>
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                boxShadow: "0 4px 20px rgba(0,0,0,.08)",
                border: settings.accountNo ? "1px solid #e5e7eb" : "2px dashed #f59e0b",
              }}
            >
              <h4 style={{ fontWeight: 800, marginBottom: ".8rem" }}>
                Admin Transfer Account
              </h4>
              {settings.accountNo ? (
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  <div style={{ color: "#0f172a", fontWeight: 700 }}>
                    {settings.accountName}
                  </div>
                  <div style={{ color: "#64748b", fontSize: ".85rem" }}>
                    {settings.bankName}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: ".75rem",
                      padding: ".65rem .85rem",
                      borderRadius: ".75rem",
                      background: "#f8fafc",
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                      {settings.accountNo}
                    </span>
                    <button
                      onClick={() => copy(settings.accountNo)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".3rem",
                        background: "#111827",
                        border: "none",
                        borderRadius: ".5rem",
                        padding: ".35rem .6rem",
                        cursor: "pointer",
                        color: "white",
                        fontWeight: 700,
                        fontSize: ".7rem",
                      }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#b45309", fontSize: ".85rem" }}>
                  Admin has not set the manual funding account yet.
                </p>
              )}
            </div>
            <button
              onClick={handleContactAdmin}
              style={{
                width: "100%",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: ".875rem",
                padding: ".85rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Contact Admin on WhatsApp
            </button>

            <div
              style={{
                background: "white",
                borderRadius: "1.5rem",
                padding: "1.25rem",
                boxShadow: "0 4px 20px rgba(0,0,0,.08)",
              }}
            >
              <h4 style={{ fontWeight: 800, marginBottom: ".8rem" }}>
                Your Manual Requests
              </h4>
              {manualLoading ? (
                <p style={{ color: "#94a3b8" }}>Loading...</p>
              ) : manualRequests.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No manual funding requests yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                  {manualRequests.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: ".75rem",
                        padding: ".75rem 1rem",
                        border: "1px solid #f1f5f9",
                        borderRadius: ".9rem",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          ₦{Number(r.amount || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                          {r.account} • {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: ".25rem .6rem",
                          borderRadius: "999px",
                          fontWeight: 700,
                          fontSize: ".7rem",
                          background:
                            r.status === 1
                              ? "#dcfce7"
                              : r.status === 2
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            r.status === 1
                              ? "#16a34a"
                              : r.status === 2
                              ? "#dc2626"
                              : "#d97706",
                        }}
                      >
                        {r.status === 1
                          ? "Approved"
                          : r.status === 2
                          ? "Rejected"
                          : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
