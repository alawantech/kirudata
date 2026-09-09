"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, ChevronLeft, CheckCircle2, Lock, Copy, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { fetchWithCache, TTL } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import NetworkIcon from "@/components/NetworkIcon";

const NET_COLORS = { 1: "#f59e0b", 2: "#dc2626", 3: "#16a34a", 4: "#0d9488" };
const NET_BG = { 1: "#fffbeb", 2: "#fef2f2", 3: "#f0fdf4", 4: "#f0fdfa" };

const RC_GRADIENT = "linear-gradient(135deg,#14532d,#16a34a,#22c55e)";

export default function RechargeCardPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [networks, setNetworks] = useState([]);
  const [selectedNet, setSelectedNet] = useState(null);
  const [loadingNets, setLoadingNets] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cardName, setCardName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchWithCache("recharge-card:networks", TTL.NETWORKS, () =>
      api.get("/recharge-card/networks").then((r) =>
        (r.data.data?.networks || []).map((n) => ({
          id: n.id,
          name: n.name,
          color: NET_COLORS[n.id] || "#6366f1",
          bg: NET_BG[n.id] || "#f5f3ff",
        })),
      ),
    )
      .then(setNetworks)
      .catch(() => {})
      .finally(() => setLoadingNets(false));
  }, []);

  useEffect(() => {
    if (!selectedNet) return;
    setLoadingPlans(true);
    setSelectedPlan(null);
    fetchWithCache(`recharge-card:plans:${selectedNet}`, TTL.PLANS, () =>
      api.get(`/recharge-card/plans?network=${selectedNet}`).then((r) => r.data.data?.plans || []),
    )
      .then((ps) => {
        setPlans(ps);
        if (ps.length > 0) setSelectedPlan(ps[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, [selectedNet]);

  const netInfo = networks.find((n) => n.id === selectedNet);
  const unitPrice = selectedPlan ? parseFloat(selectedPlan.userPrice || 0) : 0;
  const total = unitPrice * quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNet) return toast.error("Select a network");
    if (!selectedPlan) return toast.error("Select a plan");
    if (!cardName.trim()) return toast.error("Enter a card name");
    if (parseFloat(user?.wallet || 0) < total)
      return toast.error("Insufficient balance");
    if (!pin)
      return toast.error("Enter your transaction PIN");
    setLoading(true);
    try {
      const r = await api.post("/recharge-card/purchase", {
        planId: selectedPlan.id,
        quantity,
        cardName: cardName.trim(),
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
        plan: selectedPlan,
        quantity,
        total,
        cards: result?.cards || [],
        loadPin: result?.loadPin,
        checkBalance: result?.checkBalance,
      });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Purchase failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
        <div
          className="grad-bg"
          style={{ padding: "3rem 1.25rem 2rem", background: RC_GRADIENT }}
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
              boxShadow: "0 4px 20px rgba(0,0,0,.08)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <CheckCircle2 size={38} color="#16a34a" />
              </div>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  marginBottom: ".35rem",
                }}
              >
                Recharge Cards Purchased!
              </h2>
              <p style={{ color: "#71717a", fontSize: ".85rem" }}>
                {success.quantity} × {success.plan?.name}
              </p>
            </div>

            {/* Cards */}
            {success.cards && success.cards.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
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
                  Your Recharge Cards
                </p>
                {success.cards.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f0fdf4",
                      border: "2px dashed #86efac",
                      borderRadius: ".875rem",
                      padding: ".875rem 1rem",
                      marginBottom: ".625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: ".35rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: ".75rem",
                          color: "#16a34a",
                          fontWeight: 700,
                        }}
                      >
                        CARD {i + 1}
                      </span>
                      <button
                        onClick={() => copyToClipboard(card.pin)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: ".3rem",
                          color: "#16a34a",
                          fontSize: ".75rem",
                          fontWeight: 700,
                        }}
                      >
                        <Copy size={13} /> Copy PIN
                      </button>
                    </div>
                    {card.serial && (
                      <div
                        style={{
                          fontSize: ".75rem",
                          color: "#71717a",
                          marginBottom: ".25rem",
                        }}
                      >
                        Serial:{" "}
                        <span style={{ fontWeight: 700, color: "#09090b" }}>
                          {card.serial}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        letterSpacing: ".12em",
                        color: "#14532d",
                      }}
                    >
                      {card.pin}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* USSD info */}
            {(success.loadPin || success.checkBalance) && (
              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: ".875rem",
                  padding: ".875rem 1rem",
                  marginBottom: "1.25rem",
                  fontSize: ".82rem",
                }}
              >
                {success.loadPin && (
                  <div style={{ marginBottom: ".35rem" }}>
                    Load PIN: <strong>{success.loadPin}</strong>
                  </div>
                )}
                {success.checkBalance && (
                  <div>
                    Check Balance: <strong>{success.checkBalance}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div
              style={{
                background: "#f9f9fb",
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {[
                ["Plan", success.plan?.name],
                [
                  "Quantity",
                  `${success.quantity} card${success.quantity > 1 ? "s" : ""}`,
                ],
                ["Total Paid", `₦${success.total.toLocaleString()}`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: ".4rem",
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
                setSelectedPlan(null);
                setQuantity(1);
                setPin("");
              }}
              style={{ background: RC_GRADIENT }}
            >
              Buy More Cards
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
        style={{ padding: "3rem 1.25rem 1.75rem", background: RC_GRADIENT }}
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
              Recharge Card
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              KiruData · Scratch card airtime pins
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
        {/* Network selection */}
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
            Select Network
          </p>
          {loadingNets ? (
            <div style={{ display: "flex", gap: ".625rem", flexWrap: "wrap" }}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="shimmer"
                  style={{ flex: "1 1 calc(50% - .3rem)", height: 68, borderRadius: 12 }}
                />
              ))}
            </div>
          ) : (
          <div style={{ display: "flex", gap: ".625rem", flexWrap: "wrap" }}>
            {networks.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNet(n.id)}
                style={{
                  flex: "1 1 calc(50% - .3rem)",
                  padding: ".875rem",
                  border:
                    selectedNet === n.id
                      ? `2px solid ${n.color}`
                      : "1.5px solid #e4e4e7",
                  borderRadius: ".875rem",
                  background: selectedNet === n.id ? n.bg : "#fafafa",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: ".9rem",
                  color: selectedNet === n.id ? n.color : "#09090b",
                  transition: "all .15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
                  <NetworkIcon name={n.name} size={28} />
                  <span>{n.name}</span>
                </div>
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Plans */}
        {selectedNet && (
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
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="shimmer"
                    style={{ height: 60, borderRadius: 12 }}
                  />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p
                style={{
                  color: "#71717a",
                  fontSize: ".85rem",
                  textAlign: "center",
                  padding: "1rem",
                }}
              >
                No plans available for this network
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".5rem",
                }}
              >
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: ".875rem 1rem",
                      border:
                        selectedPlan?.id === p.id
                          ? `2px solid ${netInfo?.color || "#16a34a"}`
                          : "1.5px solid #e4e4e7",
                      borderRadius: ".875rem",
                      background:
                        selectedPlan?.id === p.id
                          ? netInfo?.bg || "#f0fdf4"
                          : "#fafafa",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: ".9rem",
                          color:
                            selectedPlan?.id === p.id
                              ? netInfo?.color || "#16a34a"
                              : "#09090b",
                        }}
                      >
                        {p.name}
                      </div>
                      {p.loadPin && (
                        <div
                          style={{
                            fontSize: ".75rem",
                            color: "#71717a",
                            marginTop: ".1rem",
                          }}
                        >
                          Load: {p.loadPin}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: ".9rem",
                        color:
                          selectedPlan?.id === p.id
                            ? netInfo?.color || "#16a34a"
                            : "#09090b",
                      }}
                    >
                      ₦{parseFloat(p.userPrice).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quantity + form */}
        {selectedPlan && (
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
                Quantity (1 – 10)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".875rem",
                }}
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

            {/* Card Name */}
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
                Card Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g. My Business"
                maxLength={50}
                style={{
                  width: "100%",
                  border: "1.5px solid #e4e4e7",
                  borderRadius: ".875rem",
                  padding: ".875rem 1rem",
                  fontSize: ".9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: ".72rem", color: "#71717a", marginTop: ".4rem" }}>
                Name to appear on the card
              </p>
            </div>

            {/* Summary */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #bbf7d0",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".85rem", color: "#166534" }}>
                  {quantity} × ₦{unitPrice.toLocaleString()}
                </span>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "1rem",
                    color: "#14532d",
                  }}
                >
                  ₦{total.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: ".35rem",
                }}
              >
                <span style={{ fontSize: ".82rem", color: "#16a34a" }}>
                  Wallet balance
                </span>
                <span
                  style={{
                    fontSize: ".82rem",
                    fontWeight: 700,
                    color:
                      parseFloat(user?.wallet || 0) < total
                        ? "#dc2626"
                        : "#065f46",
                  }}
                >
                  ₦{parseFloat(user?.wallet || 0).toLocaleString()}
                </span>
              </div>
            </div>

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
                    onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
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

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ background: RC_GRADIENT, opacity: loading ? 0.6 : 1 }}
            >
              {loading
                ? "Processing..."
                : `Buy ${quantity} Card${quantity > 1 ? "s" : ""} · ₦${total.toLocaleString()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
