"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import NumericPasswordInput from "@/components/NumericPasswordInput";
import ForgotPasswordOverlay from "@/components/ForgotPasswordOverlay";
import { useAuth } from "@/context/AuthContext";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleCurrentPassword = (val) => {
    setCurrentPassword(val);
    setStep(2);
  };

  const handleNewPassword = (val) => {
    setNewPassword(val);
    setStep(3);
  };

  const handleConfirmPassword = async (val) => {
    if (newPassword !== val) {
      toast.error("Passwords do not match");
      setStep(2);
      setNewPassword("");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      toast.success("Password changed successfully");
      router.back();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)",
          padding: "3rem 1.25rem 2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: ".875rem" }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,.2)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} color="white" />
          </button>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>
            Change Password
          </h1>
        </div>
      </div>

      <div style={{ padding: "1.5rem 1.25rem" }}>
        {showForgot && (
          <ForgotPasswordOverlay
            email={user?.email}
            onClose={() => setShowForgot(false)}
            onSuccess={() => router.back()}
          />
        )}

        {step === 1 && !showForgot && (
          <NumericPasswordInput
            title="Enter Current Password"
            description="Enter your current password to continue."
            onSubmit={handleCurrentPassword}
            isLoading={loading}
            onBack={() => router.back()}
            onForgotPassword={() => setShowForgot(true)}
          />
        )}
        {step === 2 && (
          <NumericPasswordInput
            title="Set New Password"
            description="Create a new password for your account. Minimum 8 characters."
            onSubmit={handleNewPassword}
            isLoading={loading}
            onBack={() => {
              setStep(1);
              setCurrentPassword("");
            }}
          />
        )}
        {step === 3 && (
          <NumericPasswordInput
            title="Confirm New Password"
            description="Re-enter your new password to confirm."
            onSubmit={handleConfirmPassword}
            isLoading={loading}
            onBack={() => {
              setStep(2);
              setNewPassword("");
            }}
          />
        )}
      </div>
    </div>
  );
}
