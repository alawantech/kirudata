"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, TrendingUp, CheckCircle2, Clock3, XCircle, Star } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";

const STATUS = {
  0: { label: "Pending review", icon: Clock3, color: "#d97706", bg: "#fef3c7" },
  1: { label: "Approved — you are a vendor!", icon: CheckCircle2, color: "#16a34a", bg: "#dcfce7" },
  2: { label: "Rejected", icon: XCircle, color: "#dc2626", bg: "#fee2e2" },
};

const PERKS = [
  "Cheaper buying prices on data, airtime and all services",
  "Access to vendor-only data plan types",
  "Priority support handling",
  "Resell to your own customers at your own margins",
];

export default function VendorUpgradePage() {
  const router = useRouter();
  const settings = useSiteSettings();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const siteName = settings?.sitename || "our platform";

  const fetchStatus = () => {
    api
      .get("/user/upgrade-status")
      .then((r) => setRequest(r.data.data?.request || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isVendor = user?.type === 2 || request?.status === 1;
  const isPending = request?.status === 0;
  const info = isVendor ? STATUS[1] : isPending ? STATUS[0] : request?.status === 2 ? STATUS[2] : null;

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      const r = await api.post("/user/upgrade-request");
      toast.success(r.data?.msg || "Upgrade request submitted!");
      fetchStatus();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const StatusIcon = info?.icon || TrendingUp;

  return (
    <div>
      <div
        className="grad-bg"
        style={{
          padding: "3rem 1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: ".875rem",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,.15)",
            border: "none",
            borderRadius: 10,
            padding: ".45rem",
            cursor: "pointer",
            color: "#fff",
            display: "flex",
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>
            Vendor Upgrade
          </h1>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: ".82rem", marginTop: ".15rem" }}>
            Upgrade your account to vendor status
          </p>
        </div>
      </div>

      <div style={{ padding: "1.25rem", maxWidth: 640 }}>
        {/* Status card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: ".9rem",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: info?.bg || "#eef2ff",
              color: info?.color || "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <StatusIcon size={24} />
          </div>
          <div>
            <p style={{ fontSize: ".72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
              Current status
            </p>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: info?.color || "#334155" }}>
              {loading ? "Loading..." : info?.label || "Regular account"}
            </p>
            {isPending && (
              <p style={{ fontSize: ".78rem", color: "#94a3b8", marginTop: ".15rem" }}>
                Submitted {new Date(request.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Perks */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".85rem" }}>
            <Star size={18} color="#4f46e5" />
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
              Vendor benefits
            </h2>
          </div>
          {PERKS.map((perk) => (
            <div
              key={perk}
              style={{ display: "flex", gap: ".6rem", alignItems: "flex-start", padding: ".45rem 0" }}
            >
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: ".88rem", color: "#334155", lineHeight: 1.45 }}>{perk}</span>
            </div>
          ))}
        </div>

        {/* Action */}
        {!isVendor && !isPending && (
          <button
            onClick={handleRequest}
            disabled={submitting}
            className="grad-bg"
            style={{
              width: "100%",
              padding: ".95rem",
              borderRadius: 12,
              border: "none",
              color: "#fff",
              fontWeight: 800,
              fontSize: ".95rem",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Request Vendor Upgrade"}
          </button>
        )}

        {isPending && (
          <p
            style={{
              textAlign: "center",
              fontSize: ".85rem",
              color: "#64748b",
              background: "#f8fafc",
              borderRadius: 12,
              padding: ".9rem",
            }}
          >
            Your request is being reviewed by {siteName} admins. You will be upgraded shortly.
          </p>
        )}

        {request?.status === 2 && !isVendor && (
          <>
            {request.note && (
              <p
                style={{
                  fontSize: ".82rem",
                  color: "#b91c1c",
                  background: "#fef2f2",
                  borderRadius: 12,
                  padding: ".75rem .9rem",
                  marginBottom: ".75rem",
                }}
              >
                Reason: {request.note}
              </p>
            )}
            <button
              onClick={handleRequest}
              disabled={submitting}
              className="grad-bg"
              style={{
                width: "100%",
                padding: ".95rem",
                borderRadius: 12,
                border: "none",
                color: "#fff",
                fontWeight: 800,
                fontSize: ".95rem",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Re-submit Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
