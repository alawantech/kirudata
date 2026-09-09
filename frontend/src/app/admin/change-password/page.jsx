"use client";
import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const inputStyle = { width: "100%", padding: ".75rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: ".875rem", fontSize: ".9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

export default function ChangePasswordPage() {
  const { changePassword } = useAdmin();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    if (currentPassword === newPassword) return toast.error("New password must be different from current.");

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to change password.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: ".3rem", background: "none", border: "none", color: "#64748b", fontSize: ".85rem", cursor: "pointer", marginBottom: "1rem", fontFamily: "inherit" }}>
        <ArrowLeft size={14} /> Back
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: ".5rem" }}>Change Password</h1>
      <p style={{ color: "#64748b", fontSize: ".85rem", marginBottom: "1.5rem" }}>You must provide your current password to set a new one.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Current Password *</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Enter current password" style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "2.5rem" }} />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {showCurrent ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>New Password *</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min 8 characters" style={{ ...inputStyle, paddingLeft: "2.5rem", paddingRight: "2.5rem" }} />
            <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {showNew ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "#374151", marginBottom: ".375rem" }}>Confirm New Password *</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter new password" style={{ ...inputStyle, paddingLeft: "2.5rem" }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: "100%", padding: ".875rem", background: "linear-gradient(135deg,#2563eb,#0ea5e9)", color: "white", border: "none", borderRadius: ".875rem", fontFamily: "inherit", fontWeight: 700, fontSize: ".95rem", cursor: "pointer", marginTop: ".5rem" }}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
