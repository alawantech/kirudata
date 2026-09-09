"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, User, Mail, Phone, Gift, Lock, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import AppLogo from "@/components/AppLogo";

const PERKS = [
  "Free account — no monthly fees",
  "Instant wallet funding",
  "Best data & airtime rates",
  "Earn by referring friends",
];

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1); // 1: User details, 2: Password + Confirm
  const [userDetails, setUserDetails] = useState({
    fullname: "",
    email: "",
    phone: "",
    referral: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinueToPassword = async (e) => {
    if (e) e.preventDefault();
    if (loading || submittingRef.current) return;
    if (!userDetails.fullname.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!userDetails.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!userDetails.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const response = await api.post("/auth/check-account", {
        email: userDetails.email.trim().toLowerCase(),
        phone: userDetails.phone.trim(),
      });

      if (response.data.data?.exists) {
        const field = response.data.data.field;
        if (field === "both") {
          toast.error("Email and phone number are already registered. Please log in or use different credentials.");
        } else if (field === "email") {
          toast.error("This email is already registered. Please log in or use a different email.");
        } else if (field === "phone") {
          toast.error("This phone number is already registered. Please log in or use a different phone number.");
        }
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      setLoading(false);
      submittingRef.current = false;
      setStep(2);
    } catch (err) {
      toast.error("Error checking account. Please try again.");
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handlePasswordSubmit = (e) => {
    if (e) e.preventDefault();
    if (loading || submittingRef.current) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    doRegister();
  };

  const doRegister = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      await api.post("/auth/register", {
        fullname: userDetails.fullname.trim(),
        email: userDetails.email.trim().toLowerCase(),
        phone: userDetails.phone.trim(),
        password: password,
        referral: userDetails.referral.trim() || undefined,
      });
      await refreshUser();
      toast.success("Account created successfully!");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Registration failed");
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const labelStyle = {
    display: "block",
    fontSize: ".8rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: ".3rem",
  };

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
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "rgba(37,99,235,.2)",
            filter: "blur(80px)",
            bottom: 0,
            right: 0,
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
            Join Thousands of
            <br />
            Happy Users
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.6)",
              fontSize: "1rem",
              marginBottom: "2.5rem",
              lineHeight: 1.6,
            }}
          >
            Create your free account today and start saving on all your utility
            payments.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {PERKS.map((p) => (
              <div
                key={p}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".875rem",
                }}
              >
                <CheckCircle size={18} color="#34d399" />
                <span
                  style={{ color: "rgba(255,255,255,.75)", fontSize: ".9rem" }}
                >
                  {p}
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
          maxWidth: 520,
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem 2.5rem",
          overflowY: "auto",
        }}
      >
        {/* Mobile brand */}
        <div className="mobile-brand">
          <Link href="/home" style={{ textDecoration: "none" }}>
            <AppLogo showBrandName={false} logoHeight={64} dark={false} />
          </Link>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-.03em",
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              color: "#64748b",
              marginTop: ".375rem",
              fontSize: ".875rem",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Step 1: User Details */}
        {step === 1 && (
          <form
            onSubmit={handleContinueToPassword}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}
          >
            {/* Full Name Input */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User
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
                  placeholder="John Doe"
                  name="fullname"
                  value={userDetails.fullname}
                  onChange={handleUserDetailsChange}
                  required
                  style={{ paddingLeft: "2.75rem" }}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label style={labelStyle}>Email Address</label>
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
                  type="email"
                  placeholder="john@example.com"
                  name="email"
                  value={userDetails.email}
                  onChange={handleUserDetailsChange}
                  required
                  style={{ paddingLeft: "2.75rem" }}
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ position: "relative" }}>
                <Phone
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
                  type="tel"
                  placeholder="08012345678"
                  name="phone"
                  value={userDetails.phone}
                  onChange={handleUserDetailsChange}
                  required
                  maxLength={11}
                  style={{ paddingLeft: "2.75rem" }}
                />
              </div>
            </div>
            {/* Referral Code Input */}
            <div>
              <label style={labelStyle}>Referral Code (optional)</label>
              <div style={{ position: "relative" }}>
                <Gift
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
                  placeholder="Enter referral code (optional)"
                  name="referral"
                  value={userDetails.referral}
                  onChange={handleUserDetailsChange}
                  style={{ paddingLeft: "2.75rem" }}
                />
              </div>
            </div>
            <p style={{ fontSize: ".75rem", color: "#94a3b8", lineHeight: 1.5, marginTop: ".5rem" }}>
              By registering you agree to our{" "}
              <Link href="/privacy" style={{ color: "#2563eb" }}>
                Privacy Policy
              </Link>{" "}
              and Terms of Service.
            </p>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || submittingRef.current}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
                opacity: loading || submittingRef.current ? 0.6 : 1,
              }}
            >
              {loading ? "Checking..." : "Continue"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {/* Step 2: Password + Confirm Password */}
        {step === 2 && (
          <form onSubmit={handlePasswordSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8", display: "flex", alignItems: "center" }} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  className="form-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8", display: "flex", alignItems: "center" }} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: ".75rem", color: "#ef4444", marginTop: ".35rem" }}>Passwords do not match</p>
              )}
            </div>

            <p style={{ fontSize: ".75rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Minimum 8 characters — use letters, numbers, or symbols.
            </p>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !password || !confirmPassword}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
                opacity: loading || !password || !confirmPassword ? 0.5 : 1,
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <button type="button" onClick={() => { setStep(1); setPassword(""); setConfirmPassword(""); submittingRef.current = false; }} style={{ background: "none", border: "none", color: "#64748b", fontSize: ".8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: ".25rem", margin: "0 auto" }}>
              <ArrowRight size={15} style={{ transform: "rotate(180deg)" }} /> Back to details
            </button>
          </form>
        )}

      </div>

      <style>{`
        @media (max-width: 768px) { .auth-left-panel { display: none !important; } }
        @media (min-width: 769px) { .mobile-brand { display: none !important; } }
      `}</style>
    </div>
  );
}
