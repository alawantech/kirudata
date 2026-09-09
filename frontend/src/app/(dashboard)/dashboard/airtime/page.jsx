"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, ChevronLeft, Info, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import NetworkIcon, { getNetworkMeta } from "@/components/NetworkIcon";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { fetchWithCache, TTL } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { detectNetwork } from "@/lib/detectNetwork";

const AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [networks, setNetworks] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNets, setLoadingNets] = useState(true);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchWithCache("airtime:networks", TTL.NETWORKS, () =>
      api.get("/airtime/networks").then((r) => r.data.data?.networks || []),
    )
      .then((nets) => {
        setNetworks(nets);
        if (nets.length > 0) setSelected(nets[0]);
      })
      .finally(() => setLoadingNets(false));
  }, []);

  // Fetch discount when selected network changes
  useEffect(() => {
    if (!selected) return;
    fetchWithCache(`airtime:discount:${selected.id}`, TTL.DISCOUNT, () =>
      api.get(`/airtime/discount?network=${selected.id}&type=VTU`).then((r) => {
        const discounts = r.data.data?.discounts || [];
        const d = discounts[0];
        if (!d) return 0;
        const t = user?.type || 1;
        const costPct = parseFloat(t === 2 || t === 3 ? (d.vendorDiscount || 100) : (d.userDiscount || 100));
        return parseFloat((100 - costPct).toFixed(2));
      }),
    )
      .then(setDiscount)
      .catch(() => setDiscount(0));
  }, [selected]);

  const cost = amount ? parseFloat(amount) * (1 - discount / 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error("Select a network");
    if (!phone || phone.length < 10)
      return toast.error("Enter a valid phone number");
    if (!amount || parseFloat(amount) < 50)
      return toast.error("Minimum amount is ₦50");
    if (parseFloat(user?.wallet || 0) < cost)
      return toast.error("Insufficient wallet balance");
    if (!pin)
      return toast.error("Enter your transaction PIN");
    setLoading(true);
    try {
      const r = await api.post("/airtime/purchase", {
        networkId: selected.id,
        phone,
        amount: parseFloat(amount),
        airtimeType: "VTU",
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
      setSuccess({ phone, amount, network: selected?.name, cost });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Purchase failed. Try again.");
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
              Airtime Sent!
            </h2>
            <p
              style={{
                color: "#71717a",
                fontSize: ".85rem",
                marginBottom: "1.75rem",
              }}
            >
              ₦{parseFloat(success.amount).toLocaleString()} sent to{" "}
              <b>{success.phone}</b>
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
                ["Network", success.network],
                ["Phone", success.phone],
                ["Amount", `₦${parseFloat(success.amount).toLocaleString()}`],
                ["You Paid", `₦${parseFloat(success.cost).toFixed(2)}`],
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
                setPhone("");
                setAmount("");
              }}
            >
              Buy More Airtime
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
              Buy Airtime
            </h1>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}>
              Instant top-up for any network
            </p>
          </div>
        </div>
        {discount > 0 && (
          <div
            style={{
              marginTop: "1rem",
              background: "rgba(255,255,255,.12)",
              borderRadius: ".875rem",
              padding: ".625rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Info size={15} color="rgba(255,255,255,.8)" />
            <span
              style={{
                color: "rgba(255,255,255,.85)",
                fontSize: ".78rem",
                fontWeight: 500,
              }}
            >
              {discount}% discount active
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Network */}
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: ".625rem",
              }}
            >
              {[...Array(4)].map((_, i) => (
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
                gridTemplateColumns: "repeat(4,1fr)",
                gap: ".625rem",
              }}
            >
              {networks.map((net) => {
                const isActive =
                  selected?.id === net.id || 
                  (selected?.network && selected.network === net.network) ||
                  (selected?.name && selected.name === net.name);
                const meta = getNetworkMeta(net.name);
                return (
                  <button
                    key={net.id || net.network}
                    className="net-pill"
                    onClick={() => setSelected(net)}
                    style={{
                      position: "relative",
                      border: `2px solid ${isActive ? meta.ring : "#e4e4e7"}`,
                      background: isActive ? meta.ring : "white",
                      transition: "background .18s, border-color .18s",
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          width: 17,
                          height: 17,
                          borderRadius: "50%",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 4px rgba(0,0,0,.18)",
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5l2.5 2.5L8 2.5"
                            stroke={meta.ring}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                    <NetworkIcon logoUrl={net.logoUrl} name={net.name} size={40} />
                    <span
                      style={{
                        fontSize: ".7rem",
                        fontWeight: 700,
                        color: isActive ? "white" : "#3f3f46",
                      }}
                    >
                      {net.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Phone */}
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
              Phone Number
            </label>
            <div className="input-wrap">
              <Phone
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
                inputMode="tel"
                style={{ paddingLeft: "2.75rem" }}
              />
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

          {/* Amount */}
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
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              min={50}
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
                        ? "2px solid #4f46e5"
                        : "1.5px solid #e4e4e7",
                    background:
                      amount === String(a) ? "rgba(79,70,229,.06)" : "#fafafa",
                    color: amount === String(a) ? "#4f46e5" : "#52525b",
                    cursor: "pointer",
                  }}
                >
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div
              style={{
                background: "rgba(79,70,229,.04)",
                borderRadius: "1.25rem",
                padding: "1.125rem 1.25rem",
                border: "1.5px solid rgba(79,70,229,.12)",
              }}
            >
              {discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: ".5rem",
                  }}
                >
                  <span style={{ fontSize: ".8rem", color: "#71717a" }}>
                    Discount ({discount}%)
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: ".8rem",
                      color: "#059669",
                    }}
                  >
                    -₦{((parseFloat(amount) * discount) / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: ".85rem" }}>
                  You Pay
                </span>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: ".9rem",
                    color: "#4f46e5",
                  }}
                >
                  ₦{cost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Transaction PIN */}
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
            disabled={loading || loadingNets}
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
              `Buy Airtime${amount ? ` — ₦${cost.toFixed(2)}` : ""}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
