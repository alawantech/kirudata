"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Mail, Shield } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import AppLogo from "@/components/AppLogo";
import NumericPasswordInput from "@/components/NumericPasswordInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: confirm password
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);
  const otpVerifying = useRef(false);
  const otpSubmitted = useRef(false);

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email.");
      return;
    }
    setLoading(true);
    try {
      const r = await api.post("/auth/forgot/password/send", { email: email.trim() });
      setOtpToken(r.data.data.otpToken);
      setOtpEmail(r.data.data.email);
      setStep(2);
      setResendCooldown(r.data.data.cooldown || 60);
      toast("Verification code sent to your email.");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to send code.");
    } finally {
      setLoading(false);
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
      const r = await api.post("/auth/forgot/password/verify", { otpToken, code });
      setResetToken(r.data.data.resetToken);
      setStep(3);
      toast.success("Email verified! Set your new password.");
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
    if (otpCode.every((c) => c !== "") && step === 2 && !otpLoading && !otpSubmitted.current) {
      otpSubmitted.current = true;
      handleVerifyOtp();
    }
  }, [otpCode, step]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const r = await api.post("/auth/forgot/password/resend", { otpToken });
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

  const handleNewPassword = (val) => {
    setNewPassword(val);
    setStep(4);
  };

  const handleConfirmPassword = async (val) => {
    if (newPassword !== val) {
      toast.error("Passwords do not match.");
      setStep(3);
      setNewPassword("");
      return;
    }
    setLoading(true);
    try {
      const r = await api.post("/auth/forgot/password/reset", { resetToken, newPassword });
      toast.success("Password reset successful! Please log in with your new password.");
      router.replace("/login");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to reset password.");
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "1.5rem",
          padding: "2rem 1.5rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <AppLogo />
        </div>

        {/* Step 1: Enter email */}
        {step === 1 && (
          <>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "1rem",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
              }}>
                <Mail size={28} color="white" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0f172a", margin: "0 0 0.5rem" }}>
                Forgot Password?
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
                Enter your registered email and we&apos;ll send you a verification code.
              </p>
            </div>
            <form onSubmit={handleSendOtp}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "0.875rem 1rem", borderRadius: "0.75rem",
                  border: "2px solid #e2e8f0", fontSize: "0.95rem", outline: "none",
                  boxSizing: "border-box", marginBottom: "1rem",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "0.875rem", borderRadius: "0.75rem",
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(37, 99, 235, 0.35)",
                }}
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "1rem",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem", boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
              }}>
                <Shield size={28} color="white" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#0f172a", margin: "0 0 0.5rem" }}>
                Verify Your Email
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
                We sent a 6-digit code to <strong>{otpEmail}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", marginBottom: "1.5rem" }}>
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpInputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  autoFocus={i === 0}
                  style={{
                    width: 48, height: 56, textAlign: "center", fontSize: "1.5rem",
                    fontWeight: 700, border: "2px solid #e2e8f0", borderRadius: 12,
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
                width: "100%", padding: "0.875rem", borderRadius: "0.75rem",
                background: otpLoading || otpCode.some((c) => !c) ? "#e5e7eb" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none", color: otpLoading || otpCode.some((c) => !c) ? "#9ca3af" : "white",
                fontWeight: 700, fontSize: "0.95rem",
                cursor: otpLoading || otpCode.some((c) => !c) ? "not-allowed" : "pointer",
                marginBottom: "1rem",
              }}
            >
              {otpLoading ? "Verifying..." : "Verify Code"}
            </button>

            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              {resendCooldown > 0 ? (
                <p style={{ color: "#94a3b8", fontSize: ".85rem" }}>Resend code in {resendCooldown}s</p>
              ) : (
                <button onClick={handleResend} style={{
                  background: "none", border: "none", color: "#2563eb",
                  fontWeight: 600, fontSize: ".85rem", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: ".375rem",
                }}>
                  <RotateCcw size={14} /> Resend code
                </button>
              )}
            </div>

            <button onClick={() => { setStep(1); setOtpCode(["", "", "", "", "", ""]); otpVerifying.current = false; otpSubmitted.current = false; }}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: ".85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", margin: "0 auto" }}>
              <ArrowLeft size={16} /> Back to email
            </button>
          </>
        )}

        {/* Step 3: New password via custom keyboard */}
        {step === 3 && (
          <NumericPasswordInput
            title="Set New Password"
            description="Create a new password for your account. Minimum 8 characters."
            onSubmit={handleNewPassword}
            isLoading={loading}
            onBack={() => setStep(2)}
          />
        )}

        {/* Step 4: Confirm password via custom keyboard */}
        {step === 4 && (
          <NumericPasswordInput
            title="Confirm New Password"
            description="Re-enter your new password to confirm."
            onSubmit={handleConfirmPassword}
            isLoading={loading}
            onBack={() => { setStep(3); setNewPassword(""); }}
          />
        )}

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/login" style={{ color: "#2563eb", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
