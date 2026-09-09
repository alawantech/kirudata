"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";
import { Lock, Mail, ShieldCheck, ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";

const RESEND_SECONDS = 90;

export default function AdminLoginPage() {
  const { adminLogin, adminVerifyOtp } = useAdmin();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const timerRef = useRef(null);

  const startCooldown = useCallback((seconds = RESEND_SECONDS) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const maskEmail = (e) => {
    const [user, domain] = e.split("@");
    if (!domain) return e;
    const masked = user.length > 3
      ? user.substring(0, 3) + "***" + user.substring(user.length - 2)
      : user.substring(0, 1) + "***";
    return `${masked}@${domain}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      if (res.requiresOtp) {
        setAdminId(res.data.adminId);
        setMaskedEmail(maskEmail(res.data.email));
        setStep(2);
        setOtp("");
        startCooldown(RESEND_SECONDS);
        toast.success("OTP sent to your email!");
      } else {
        toast.success("Welcome back!");
        router.replace("/admin/dashboard");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminVerifyOtp(adminId, otp);
      toast.success("Welcome back!");
      router.replace("/admin/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await adminApi.post("/admin/auth/resend-otp", { adminId });
      if (res.data.cooldown) startCooldown(res.data.cooldown);
      else startCooldown(RESEND_SECONDS);
      setOtp("");
      toast.success("OTP resent to your email!");
    } catch (err) {
      if (err?.response?.data?.cooldown) {
        startCooldown(err.response.data.cooldown);
        toast.error(`Please wait ${err.response.data.cooldown} seconds.`);
      } else {
        toast.error(err?.response?.data?.msg || "Failed to resend OTP.");
      }
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg,#2563eb,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontWeight: 900, color: "white", fontSize: 26 }}>G</div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-.03em" }}>Admin Panel</h1>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".875rem", marginTop: ".375rem" }}>KIRU DATA Management</p>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "1.5rem", padding: "2rem", border: "1px solid rgba(255,255,255,.06)" }}>
          {step === 1 ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: ".5rem" }}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" style={{ width: "100%", padding: ".75rem .875rem .75rem 2.5rem", background: "#0f172a", border: "1px solid rgba(255,255,255,.1)", borderRadius: ".875rem", color: "white", fontFamily: "inherit", fontSize: ".9rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: ".5rem" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", padding: ".75rem 2.75rem .75rem 2.5rem", background: "#0f172a", border: "1px solid rgba(255,255,255,.1)", borderRadius: ".875rem", color: "white", fontFamily: "inherit", fontSize: ".9rem", outline: "none", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                    {showPassword ? <EyeOff size={16} color="rgba(255,255,255,.35)" /> : <Eye size={16} color="rgba(255,255,255,.35)" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", padding: ".875rem", background: "linear-gradient(135deg,#2563eb,#0ea5e9)", color: "white", border: "none", borderRadius: ".875rem", fontFamily: "inherit", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: ".375rem" }}>
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <div style={{ textAlign: "center", marginBottom: ".5rem" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(37,99,235,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .75rem" }}>
                  <ShieldCheck size={24} color="#60a5fa" />
                </div>
                <p style={{ color: "rgba(255,255,255,.7)", fontSize: ".85rem", lineHeight: 1.5 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: "white" }}>{maskedEmail}</strong>
                </p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: ".5rem" }}>Enter OTP</label>
                <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))} required placeholder="000000" maxLength={6} style={{ width: "100%", padding: ".875rem", background: "#0f172a", border: "1px solid rgba(255,255,255,.1)", borderRadius: ".875rem", color: "white", fontFamily: "monospace", fontSize: "1.5rem", letterSpacing: ".3em", textAlign: "center", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} style={{ width: "100%", padding: ".875rem", background: otp.length === 6 ? "linear-gradient(135deg,#2563eb,#0ea5e9)" : "rgba(255,255,255,.06)", color: "white", border: "none", borderRadius: ".875rem", fontFamily: "inherit", fontWeight: 700, fontSize: "1rem", cursor: otp.length === 6 ? "pointer" : "not-allowed" }}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              {cooldown > 0 ? (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.4)", fontSize: ".8rem" }}>
                  Resend OTP in <strong style={{ color: "#60a5fa" }}>{formatTime(cooldown)}</strong>
                </div>
              ) : (
                <button type="button" onClick={handleResend} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: ".8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: ".3rem", fontFamily: "inherit", fontWeight: 600 }}>
                  <RefreshCw size={13} /> Resend OTP
                </button>
              )}
              <button type="button" onClick={() => { setStep(1); setOtp(""); if (timerRef.current) clearInterval(timerRef.current); setCooldown(0); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: ".8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: ".3rem", fontFamily: "inherit" }}>
                <ArrowLeft size={14} /> Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
