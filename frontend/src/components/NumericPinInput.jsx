"use client";
import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";

export default function NumericPinInput({ onSubmit, isLoading, title, description, onBack, onForgotPin }) {
  const [pin, setPin] = useState("");
  const [showPinValue, setShowPinValue] = useState(false);
  const maxLength = 4;

  const handleKeyDown = (e) => {
    const isNumber = /^[0-9]$/.test(e.key);
    const isBackspace = e.key === "Backspace";
    const isArrowKey = ["ArrowLeft", "ArrowRight"].includes(e.key);
    if (!isNumber && !isBackspace && !isArrowKey && e.key !== "Tab") {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    setPin(value);
  };

  const handleNumberClick = (num) => {
    if (pin.length < maxLength) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length === maxLength && !isLoading) {
      onSubmit(pin);
    }
  };

  const isFilled = pin.length === maxLength;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dotPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .pin-overlay {
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pin-card {
          animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pin-key:active {
          transform: scale(0.93) !important;
        }
        @media (max-height: 700px) {
          .pin-card { gap: 0.4rem !important; padding: 0.75rem !important; }
          .pin-icon { width: 36px !important; height: 36px !important; }
          .pin-title { font-size: 0.95rem !important; }
          .pin-desc { font-size: 0.7rem !important; }
          .pin-dot-row { padding: 0.5rem 0.75rem !important; }
          .pin-key { min-height: 38px !important; font-size: 0.9rem !important; }
          .pin-action { min-height: 38px !important; }
        }
      `}</style>

      <div
        className="pin-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(88,28,135,0.85))",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          minHeight: "100dvh",
        }}
      >
        <div
          className="pin-card"
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "1.5rem 1.25rem",
            width: "100%",
            maxWidth: "400px",
            maxHeight: "calc(100dvh - 2rem)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Close button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              style={{
                position: "absolute",
                top: "0.875rem",
                right: "0.875rem",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "#faf5ff",
                color: "#7c3aed",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                zIndex: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Back button row */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              style={{
                background: "none",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                padding: "0.25rem 0",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                alignSelf: "flex-start",
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              <span>Back</span>
            </button>
          )}

          {/* Icon */}
          <div
            className="pin-icon"
            style={{
              width: 56,
              height: 56,
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 10px 25px rgba(124, 58, 237, 0.3)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Title */}
          <h2
            className="pin-title"
            style={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: "1.15rem",
              color: "#0f172a",
              letterSpacing: "-.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>

          {/* Description */}
          <p
            className="pin-desc"
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "0.8rem",
              margin: 0,
              lineHeight: 1.5,
              paddingBottom: "0.25rem",
            }}
          >
            {description}
          </p>

          {/* Form wrapping all interactive elements */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, minHeight: 0 }}>

          {/* Hidden input */}
          <input
            type="text"
            inputMode="none"
            pattern="[0-9]*"
            value={pin}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            tabIndex={-1}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-1p-ignore="true"
            style={{
              position: "fixed",
              top: "-9999px",
              left: "-9999px",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
              border: "none",
              outline: "none",
              padding: 0,
              margin: 0,
            }}
            aria-hidden="true"
          />

          {/* Dot display */}
          <div
            className="pin-dot-row"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.875rem 1rem",
              background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
              borderRadius: "1rem",
              position: "relative",
              border: "2px solid #ddd6fe",
            }}
          >
            {Array.from({ length: maxLength }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: i < pin.length
                    ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                    : "white",
                  border: i < pin.length ? "2px solid #7c3aed" : "2px solid #cbd5e1",
                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: i < pin.length ? "scale(1.15)" : "scale(1)",
                  boxShadow: i < pin.length
                    ? "0 3px 10px rgba(124, 58, 237, 0.35)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: showPinValue && i < pin.length ? "white" : "transparent",
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  animation: i < pin.length ? "dotPop 0.2s ease" : "none",
                }}
              >
                {showPinValue && i < pin.length ? pin[i] : null}
              </div>
            ))}

            {/* Eye toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPinValue((v) => !v);
              }}
              style={{
                position: "absolute",
                right: "0.625rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1.5px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                zIndex: 2,
              }}
              title={showPinValue ? "Hide PIN" : "Show PIN"}
            >
              {showPinValue ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.5 0-10-5-10-10 0-1.4.3-2.7.9-3.9" />
                  <path d="M1 1l22 22" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  <path d="M14.12 14.12A3 3 0 0 0 9.88 9.88" />
                  <path d="M8.1 4.3A10.05 10.05 0 0 1 12 4c5.5 0 10 5 10 10 0 1.9-.5 3.6-1.4 5" />
                  <path d="M6.1 6.1C3.8 8.2 2 10.8 2 14c0 5.5 4.5 10 10 10 3.2 0 5.8-1.8 7.9-4.1" opacity="0" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Keyboard - 2 columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.5rem",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                className="pin-key"
                type="button"
                onClick={() => handleNumberClick(num)}
                disabled={pin.length >= maxLength}
                style={{
                  padding: "0",
                  borderRadius: "0.85rem",
                  border: "2px solid #ede9fe",
                  background: pin.length >= maxLength ? "#f8fafc" : "white",
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  cursor: pin.length >= maxLength ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  opacity: pin.length >= maxLength ? 0.4 : 1,
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {num}
              </button>
            ))}
            {[9, 0].map((num) => (
              <button
                key={num}
                className="pin-key"
                type="button"
                onClick={() => handleNumberClick(num)}
                disabled={pin.length >= maxLength}
                style={{
                  padding: "0",
                  borderRadius: "0.85rem",
                  border: "2px solid #ede9fe",
                  background: pin.length >= maxLength ? "#f8fafc" : "white",
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  cursor: pin.length >= maxLength ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  opacity: pin.length >= maxLength ? 0.4 : 1,
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {num}
              </button>
            ))}

            {/* Delete button */}
            <button
              className="pin-key"
              type="button"
              onClick={handleDelete}
              style={{
                gridColumn: "span 2",
                padding: "0",
                borderRadius: "0.85rem",
                border: "2px solid #fee2e2",
                background: "white",
                color: "#dc2626",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {onBack && (
              <button
                type="button"
                className="pin-action"
                onClick={onBack}
                disabled={isLoading}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.85rem",
                  background: "white",
                  border: "2px solid #ede9fe",
                  color: "#7c3aed",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  whiteSpace: "nowrap",
                  minHeight: 48,
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
                <span>Back</span>
              </button>
            )}
            <button
              type="submit"
              className="pin-action"
              disabled={!isFilled || isLoading}
              style={{
                flex: 1,
                padding: "0.75rem 1.25rem",
                borderRadius: "0.85rem",
                background: isFilled && !isLoading
                  ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                  : "#e5e7eb",
                border: "none",
                color: isFilled && !isLoading ? "white" : "#9ca3af",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: isFilled && !isLoading ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                letterSpacing: "-.01em",
                boxShadow: isFilled && !isLoading
                  ? "0 8px 24px rgba(124, 58, 237, 0.35)"
                  : "none",
                minHeight: 48,
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
          </form>

          {onForgotPin && (
            <button
              type="button"
              onClick={onForgotPin}
              style={{
                background: "none", border: "none", color: "#6b7280",
                fontSize: "0.8rem", cursor: "pointer", textAlign: "center",
                padding: "0.5rem 0 0.25rem", width: "100%", fontWeight: 500,
              }}
            >
              Forgot PIN?
            </button>
          )}
        </div>
      </div>
    </>
  );
}
