"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, ChevronLeft, KeyRound, UserPlus, Eye, EyeOff, Lock } from "lucide-react";

const MIN_LENGTH = 8;

export default function NumericPasswordInput({
  onSubmit,
  isLoading,
  title,
  description,
  onBack,
  onForgotPassword,
  onRegister,
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = password.length >= MIN_LENGTH;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onSubmit(password);
    }
  };

  const showAccountActions = !!(onForgotPassword || onRegister);

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
        .pwd-card {
          animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pwd-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }
        .pwd-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(37, 99, 235, 0.4) !important;
        }
        .pwd-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .pwd-action-btn:hover:not(:disabled) {
          background: #f8fafc !important;
        }
        @media (max-height: 700px) {
          .pwd-card { padding: 1.25rem 1rem !important; }
          .pwd-icon { width: 40px !important; height: 40px !important; }
          .pwd-title { font-size: 1rem !important; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100dvh - 8rem)",
          padding: "1rem",
        }}
      >
        <div
          className="pwd-card"
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "2rem 1.5rem",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            position: "relative",
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
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "#f1f5f9",
                color: "#64748b",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                zIndex: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Back button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="pwd-action-btn"
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
                transition: "color 0.15s ease",
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              <span>Back</span>
            </button>
          )}

          {/* Icon */}
          <div
            className="pwd-icon"
            style={{
              width: 52,
              height: 52,
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Lock size={24} color="white" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h2
            className="pwd-title"
            style={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: "1.2rem",
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
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "0.82rem",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Password input */}
            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="new-password"
                minLength={MIN_LENGTH}
                disabled={isLoading}
                className="pwd-input"
                style={{
                  width: "100%",
                  padding: "0.875rem 3rem 0.875rem 1rem",
                  borderRadius: "0.85rem",
                  border: "2px solid #e2e8f0",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  background: isLoading ? "#f8fafc" : "white",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  transition: "color 0.15s ease",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Character count */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "-0.5rem", padding: "0 0.25rem" }}>
              <span style={{ fontSize: "0.72rem", color: password.length === 0 ? "#94a3b8" : isValid ? "#16a34a" : "#f59e0b" }}>
                {password.length === 0
                  ? `Minimum ${MIN_LENGTH} characters`
                  : password.length < MIN_LENGTH
                    ? `${password.length} / ${MIN_LENGTH} characters`
                    : `\u2713 ${password.length} characters`}
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="pwd-submit"
              disabled={!isValid || isLoading}
              style={{
                width: "100%",
                padding: "0.875rem 1.25rem",
                borderRadius: "0.85rem",
                border: "none",
                background: isValid && !isLoading
                  ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                  : "#e5e7eb",
                color: isValid && !isLoading ? "white" : "#9ca3af",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: isValid && !isLoading ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                letterSpacing: "-.01em",
                boxShadow: isValid && !isLoading
                  ? "0 8px 24px rgba(37, 99, 235, 0.35)"
                  : "none",
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
          </form>

          {/* Account actions */}
          {showAccountActions && (
            <div
              style={{
                border: "1px solid #e0e7ff",
                borderRadius: "0.85rem",
                background: "linear-gradient(180deg, #ffffff, #f8faff)",
                overflow: "hidden",
              }}
            >
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={isLoading}
                  className="pwd-action-btn"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "transparent",
                    color: "#0f172a",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    borderBottom: onRegister ? "1px solid #f1f5f9" : "none",
                    transition: "background 0.15s ease",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <KeyRound size={14} color="#2563eb" />
                    <span>Forgot password?</span>
                  </span>
                  <span style={{ color: "#2563eb" }}>Reset</span>
                </button>
              )}
              {onRegister && (
                <button
                  type="button"
                  onClick={onRegister}
                  disabled={isLoading}
                  className="pwd-action-btn"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "transparent",
                    color: "#0f172a",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    transition: "background 0.15s ease",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <UserPlus size={14} color="#2563eb" />
                    <span>Don&apos;t have an account?</span>
                  </span>
                  <span style={{ color: "#2563eb" }}>Register</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
