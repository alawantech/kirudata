"use client";
import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { ChevronLeft, Copy, CheckCircle2, Download } from "lucide-react";
import toast from "react-hot-toast";
import ReceiptView from "@/components/Receipt";

export default function TransactionDetailPage({ params }) {
  const { ref } = use(params);
  const router = useRouter();
  const sp = useSearchParams();
  const isNew = sp.get("new") === "1";
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get(`/user/transactions/${ref}`)
      .then((r) => setTx(r.data.data?.transaction || r.data.data))
      .catch(() => router.replace("/dashboard/transactions"))
      .finally(() => setLoading(false));
  }, [ref]);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
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
            <h1
              style={{ color: "white", fontWeight: 800, fontSize: "1.15rem" }}
            >
              Receipt
            </h1>
          </div>
        </div>
        <div style={{ padding: "1.25rem" }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: 52, borderRadius: 12, marginBottom: ".625rem" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!tx) return null;

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
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.15rem" }}>
            Receipt
          </h1>
        </div>
      </div>

      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          animation: isNew ? "popIn .4s cubic-bezier(.22,1,.36,1)" : "none",
        }}
      >
        {isNew && (
          <div
            style={{
              textAlign: "center",
              marginBottom: ".25rem",
            }}
          >
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              🎉 Payment Successful
            </div>
            <p style={{ color: "#71717a", fontSize: ".78rem", marginTop: 4 }}>
              Your receipt is ready below.
            </p>
          </div>
        )}

        <ReceiptView tx={tx} showPrint />

        <button
          onClick={() => copy(tx.transref || tx.ref || "")}
          style={{
            width: "100%",
            background: "white",
            border: "1.5px solid #e4e4e7",
            borderRadius: "1.25rem",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".5rem",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: ".875rem",
            color: "#4f46e5",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}
        >
          {copied ? <CheckCircle2 size={17} /> : <Copy size={17} />}
          {copied ? "Reference Copied!" : "Copy Transaction Reference"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
          <button
            className="btn-primary"
            onClick={() => router.push("/dashboard/services")}
          >
            Buy Another
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push("/dashboard/transactions")}
          >
            Back to Transactions
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: translateY(14px) scale(.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
