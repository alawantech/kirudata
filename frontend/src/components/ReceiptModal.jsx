"use client";
import { useEffect } from "react";
import { X, ArrowRight, Home } from "lucide-react";
import ReceiptView from "./Receipt";

export default function ReceiptModal({ open, tx, onClose, onViewReceipt }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.55)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <div
        className="receipt-modal"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#fafafa",
          borderTopLeftRadius: "1.75rem",
          borderTopRightRadius: "1.75rem",
          padding: "1.25rem 1.25rem 1.75rem",
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "slideUp .35s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: "#e4e4e7",
            borderRadius: 99,
            margin: "0 auto 1rem",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: ".5rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
            Payment Successful
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {tx && <ReceiptView tx={tx} showPrint />}

        <div style={{ display: "flex", gap: ".625rem", marginTop: "1.25rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "#fff",
              border: "1.5px solid #e4e4e7",
              borderRadius: "1rem",
              padding: ".9rem",
              fontWeight: 700,
              fontSize: ".85rem",
              color: "#18181b",
              cursor: "pointer",
            }}
          >
            Done
          </button>
          <button
            onClick={onViewReceipt}
            style={{
              flex: 1.4,
              background: "#4f46e5",
              border: "none",
              borderRadius: "1rem",
              padding: ".9rem",
              fontWeight: 700,
              fontSize: ".85rem",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".4rem",
              cursor: "pointer",
            }}
          >
            View Full Receipt <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: .5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 600px) {
          .receipt-modal {
            border-radius: 1.75rem !important;
            margin-bottom: 1.5rem;
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
}
