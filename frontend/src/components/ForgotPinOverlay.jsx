"use client";
import { useState, useEffect, useRef } from "react";
import { RotateCcw, ArrowLeft, Shield, Lock, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPinOverlay({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: OTP, 2: new PIN
  const [otpToken, setOtpToken] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);
  const otpVerifying = useRef(false);
  const otpSubmitted = useRef(false);

  // Send OTP on mount
  useEffect(() => {
    sendOtp();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtp = async () => {
    try {
      const r = await api.post("/auth/forgot/pin/send");
      setOtpToken(r.data.data.otpToken);
      setOtpEmail(r.data.data.email);
      setResendCooldown(r.data.data.cooldown || 60);
      toast("Verification code sent to your email.");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to send code.");
      onClose();
    }
  };

  const handleVerifyOtp = async () => {
    if (otpVerifying.current) return;
    const code = otpCode.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    otpVerifying.current = true;
    setOtpLoading(true);
    try {
      const r = await api.post("/auth/forgot/pin/verify", { otpToken, code });
      setResetToken(r.data.data.resetToken);
      setStep(2);
      toast.success("Email verified! Set your new PIN.");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Invalid or expired code.");
      setOtpCode(["", "", "", "", "", ""]);
      otpVerifying.current = false;
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    if (otpCode.every((c) => c !== "") && step === 1 && !otpLoading && !otpSubmitted.current) {
      otpSubmitted.current = true;
      handleVerifyOtp();
    }
  }, [otpCode, step]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const r = await api.post("/auth/forgot/pin/resend", { otpToken });
      setOtpToken(r.data.data.otpToken);
      setResendCooldown(r.data.data.cooldown || 60);
      setOtpCode(["", "", "", "", "", ""]);
      otpSubmitted.current = false;
      otpInputRefs.current[0]?.focus();
      toast.success("New verification code sent!");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to resend code.");
    }
  };

  const handleResetPin = async () => {
    if (newPin.length !== 4) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot/pin/reset", { resetToken, newPin });
      toast.success("Transaction PIN reset successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to reset PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newCode = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtpCode(newCode);
      const nextEmpty = newCode.findIndex((c) => !c);
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,58,138,0.85))",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "white", borderRadius: "1.5rem", padding: "1.5rem 1.25rem",
        width: "100%", maxWidth: "400px", boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
      }}>
        {step === 1 && (
          <>
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{
                width: 50, height: 50, borderRadius: "1rem",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 0.75rem",
              }}>
                <Shield size={24} color="white" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", margin: "0 0 0.35rem" }}>
                Verify Your Email
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>
                We sent a 6-digit code to <strong>{otpEmail}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: ".625rem", justifyContent: "center", marginBottom: "1.25rem" }}>
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpInputRefs.current[i] = el)}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  autoFocus={i === 0}
                  style={{
                    width: 44, height: 52, textAlign: "center", fontSize: "1.35rem",
                    fontWeight: 700, border: "2px solid #e2e8f0", borderRadius: 10,
                    outline: "none", color: "#0f172a", background: "#f8fafc",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpCode.some((c) => !c)}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
                background: otpLoading || otpCode.some((c) => !c) ? "#e5e7eb" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none", color: otpLoading || otpCode.some((c) => !c) ? "#9ca3af" : "white",
                fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem",
                cursor: otpLoading || otpCode.some((c) => !c) ? "not-allowed" : "pointer",
              }}
            >
              {otpLoading ? "Verifying..." : "Verify Code"}
            </button>

            <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
              {resendCooldown > 0 ? (
                <p style={{ color: "#94a3b8", fontSize: ".8rem" }}>Resend code in {resendCooldown}s</p>
              ) : (
                <button onClick={handleResend} style={{
                  background: "none", border: "none", color: "#2563eb",
                  fontWeight: 600, fontSize: ".8rem", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: ".375rem",
                }}>
                  <RotateCcw size={13} /> Resend code
                </button>
              )}
            </div>

            <button onClick={onClose} style={{
              background: "none", border: "none", color: "#64748b", fontSize: ".8rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
              margin: "0 auto",
            }}>
              <ArrowLeft size={15} /> Cancel
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{
                width: 50, height: 50, borderRadius: "1rem",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 0.75rem",
              }}>
                <Lock size={24} color="white" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", margin: "0 0 0.35rem" }}>
                Set New PIN
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>
                Create a new 4-digit transaction PIN.
              </p>
            </div>

            <PinEntry label="New PIN" value={newPin} onChange={setNewPin} />
            <div style={{ height: "0.75rem" }} />
            <PinEntry label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />

            <button
              onClick={handleResetPin}
              disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: "0.75rem", marginTop: "1rem",
                background: loading || newPin.length !== 4 || confirmPin.length !== 4 ? "#e5e7eb" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "none", color: loading || newPin.length !== 4 || confirmPin.length !== 4 ? "#9ca3af" : "white",
                fontWeight: 700, fontSize: "0.9rem",
                cursor: loading || newPin.length !== 4 || confirmPin.length !== 4 ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Setting PIN..." : "Set New PIN"}
            </button>

            <button onClick={() => { setStep(1); setNewPin(""); setConfirmPin(""); }} style={{
              background: "none", border: "none", color: "#64748b", fontSize: ".8rem",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
              margin: "0.75rem auto 0",
            }}>
              <ArrowLeft size={15} /> Back to OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PinEntry({ label, value, onChange }) {
  const [showPin, setShowPin] = useState(false);
  const maxLength = 4;

  const handleKeyDown = (e) => {
    if (!/^[0-9]$/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
      e.preventDefault();
    }
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.35rem" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showPin ? "text" : "password"}
          inputMode="numeric"
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder="Enter 4-digit PIN"
          style={{
            width: "100%", padding: "0.75rem 2.5rem 0.75rem 1rem", borderRadius: "0.75rem",
            border: "2px solid #e2e8f0", fontSize: "1.1rem", fontWeight: 700,
            letterSpacing: "0.5rem", outline: "none", boxSizing: "border-box",
            textAlign: "center",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
        <button type="button" onClick={() => setShowPin(!showPin)}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          {showPin ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
        </button>
      </div>
    </div>
  );
}
