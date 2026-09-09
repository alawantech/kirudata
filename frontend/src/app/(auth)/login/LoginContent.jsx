"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Wifi, Phone, Zap, Tv, Mail, ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import AppLogo from "@/components/AppLogo";
import NumericPasswordInput from "@/components/NumericPasswordInput";
import generateDeviceFingerprint from "@/lib/fingerprint";

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: Email/phone, 2: Numeric password, 3: OTP verification
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordResetKey, setPasswordResetKey] = useState(0);
  const { login, completeOtpLogin } = useAuth();
  const router = useRouter();

  // OTP state
  const [otpToken, setOtpToken] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);
  const otpVerifying = useRef(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleContinueToPassword = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }
    setStep(2);
  };

  const isSubmitting = useRef(false);

  const handlePasswordSubmit = async (password) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      let deviceFingerprint = null;
      try {
        deviceFingerprint = await generateDeviceFingerprint();
      } catch {}

      const result = await login(identifier, password, deviceFingerprint);

      if (result?.requiresOtp) {
        setOtpToken(result.otpToken);
        setOtpEmail(result.email);
        setStep(3);
        setResendCooldown(60);
        setLoading(false);
        toast("We sent a verification code to your email.");
        return;
      }

      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (err) {
      console.error("[Login] Error:", err);
      const msg = err?.response?.data?.msg || "Something went wrong. Please try again.";
      toast.error(msg);
      setPasswordResetKey((key) => key + 1);
      setLoading(false);
    } finally {
      isSubmitting.current = false;
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP keydown (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
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

  // Verify OTP
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
      let deviceFingerprint = null;
      try {
        deviceFingerprint = await generateDeviceFingerprint();
      } catch {}

      const r = await api.post("/auth/otp/verify", {
        otpToken,
        code,
        deviceFingerprint,
      });

      // Set user in AuthContext so dashboard auth guard passes
      const userData = r.data.data.user;
      completeOtpLogin(userData);

      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (err) {
      console.error("[OTP Verify] Error:", err);
      toast.error(err?.response?.data?.msg || "Invalid or expired code.");
      otpSubmitted.current = false;
      setOtpCode(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
      otpVerifying.current = false;
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const r = await api.post("/auth/otp/resend", { otpToken });
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

  // Auto-submit when all 6 digits entered
  const otpSubmitted = useRef(false);
  useEffect(() => {
    if (otpCode.every((c) => c !== "") && step === 3 && !otpLoading && !otpSubmitted.current) {
      otpSubmitted.current = true;
      handleVerifyOtp();
    }
  }, [otpCode, step]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          flex: 1,
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem 3rem",
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
        }}
        className="auth-left-panel"
      >
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(37,99,235,.2)",
            filter: "blur(80px)",
            bottom: "-10%",
            right: "-15%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(6,182,212,.15)",
            filter: "blur(60px)",
            top: "10%",
            left: "-10%",
          }}
        />

        <div style={{ position: "relative" }}>
          <Link
            href="/home"
            style={{
              textDecoration: "none",
              marginBottom: "3rem",
              display: "inline-flex",
            }}
          >
            <AppLogo showBrandName={false} logoHeight={90} dark={false} />
          </Link>

          <h2
            style={{
              fontSize: "2.25rem",
              fontWeight: 900,
              color: "white",
              lineHeight: 1.15,
              marginBottom: "1rem",
              letterSpacing: "-.03em",
            }}
          >
            Welcome
            <br />
            Back!
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.6)",
              fontSize: "1rem",
              marginBottom: "3rem",
              lineHeight: 1.6,
            }}
          >
            Sign in to access your wallet and continue buying affordable data,
            airtime & more.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {[
              { icon: Wifi, text: "Cheapest data plans in Nigeria" },
              { icon: Phone, text: "Instant airtime top-up, 24/7" },
              { icon: Zap, text: "Pay electricity & cable bills fast" },
              { icon: Tv, text: "All services in one dashboard" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".875rem",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} color="#7dd3fc" />
                </div>
                <span
                  style={{ color: "rgba(255,255,255,.75)", fontSize: ".9rem" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "3rem 2.5rem",
        }}
      >
        <div style={{ marginBottom: "2.5rem" }}>
          <div className="mobile-brand">
            <Link href="/home" style={{ textDecoration: "none" }}>
              <AppLogo showBrandName={false} logoHeight={64} dark={false} />
            </Link>
          </div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-.03em",
              lineHeight: 1.2,
            }}
          >
            {step === 3 ? "Verify your identity" : "Sign in to your account"}
          </h1>
          <p
            style={{ color: "#64748b", marginTop: ".5rem", fontSize: ".9rem" }}
          >
            {step === 3 ? (
              <>
                We sent a 6-digit code to <strong>{otpEmail}</strong>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  style={{
                    color: "#2563eb",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Register free
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Step 1: Email/Phone Number */}
        {step === 1 && (
          <form
            onSubmit={handleContinueToPassword}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: ".8rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: ".375rem",
                  letterSpacing: ".01em",
                }}
              >
                Email or Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                  style={{ background: "#f8fafc", paddingLeft: "2.75rem" }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                marginTop: ".25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
              }}
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <>
            <NumericPasswordInput
              key={passwordResetKey}
              title="Enter Your Password"
              description={`Enter your password for ${identifier}`}
              onSubmit={handlePasswordSubmit}
              isLoading={loading}
              onBack={() => {
                setStep(1);
                setIdentifier("");
              }}
              onForgotPassword={() => router.push("/forgot-password")}
              onRegister={() => router.push("/register")}
            />
          </>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* OTP Input */}
            <div
              style={{
                display: "flex",
                gap: ".75rem",
                justifyContent: "center",
              }}
            >
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
                    width: 48,
                    height: 56,
                    textAlign: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    border: "2px solid #e2e8f0",
                    borderRadius: 12,
                    outline: "none",
                    color: "#0f172a",
                    background: "#f8fafc",
                    transition: "border-color .2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpCode.some((c) => !c)}
              className="btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
                opacity: otpLoading || otpCode.some((c) => !c) ? 0.6 : 1,
              }}
            >
              {otpLoading ? "Verifying..." : "Verify Code"}
            </button>

            {/* Resend */}
            <div style={{ textAlign: "center" }}>
              {resendCooldown > 0 ? (
                <p style={{ color: "#94a3b8", fontSize: ".85rem" }}>
                  Resend code in {resendCooldown}s
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontWeight: 600,
                    fontSize: ".85rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".375rem",
                  }}
                >
                  <RotateCcw size={14} />
                  Resend code
                </button>
              )}
            </div>

            {/* Back to login */}
            <button
              onClick={() => {
                setStep(1);
                setIdentifier("");
                setOtpCode(["", "", "", "", "", ""]);
                setOtpToken(null);
                otpSubmitted.current = false;
              }}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: ".85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: ".375rem",
                alignSelf: "center",
              }}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontSize: ".8rem",
            marginTop: "2rem",
          }}
        >
          © {new Date().getFullYear()} Kiru Data — Secure & Encrypted
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}
