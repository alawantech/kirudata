"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import NumericPinInput from "@/components/NumericPinInput";
import ForgotPinOverlay from "@/components/ForgotPinOverlay";

export default function ChangePinPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const hasPin = user?.pinEnabled;

  const [step, setStep] = useState(hasPin ? 1 : 2);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showForgotPin, setShowForgotPin] = useState(false);

  const handleCurrentPin = (val) => {
    setCurrentPin(val);
    setStep(2);
  };

  const handleNewPin = (val) => {
    setNewPin(val);
    setStep(3);
  };

  const handleConfirmPin = async (val) => {
    if (newPin !== val) {
      toast.error("PINs do not match");
      setStep(2);
      setNewPin("");
      setConfirmPin("");
      return;
    }
    setLoading(true);
    try {
      await api.post("/user/pin", {
        newPin: newPin,
        ...(hasPin ? { currentPin } : {}),
      });
      toast.success(hasPin ? "Transaction PIN changed successfully" : "Transaction PIN set successfully");
      await refreshUser();
      router.back();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to update PIN");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7" }}>
      <div className="grad-bg" style={{ padding: "3rem 1.25rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".875rem" }}>
          <button className="back-btn" onClick={() => router.back()}>
            <ChevronLeft size={20} color="white" />
          </button>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>
            {hasPin ? "Change Transaction PIN" : "Set Transaction PIN"}
          </h1>
        </div>
      </div>

      <div style={{ padding: "1.5rem 1.25rem" }}>
        {showForgotPin && (
          <ForgotPinOverlay
            onClose={() => setShowForgotPin(false)}
            onSuccess={() => { refreshUser(); setStep(2); setCurrentPin(""); }}
          />
        )}
        {!hasPin && step === 2 && (
          <NumericPinInput
            title="Set Your Transaction PIN"
            description="Create a 4-digit PIN to authorize all transactions."
            onSubmit={handleNewPin}
            isLoading={loading}
            onBack={() => router.back()}
          />
        )}
        {!hasPin && step === 3 && (
          <NumericPinInput
            title="Confirm Your Transaction PIN"
            description="Re-enter your 4-digit PIN to confirm."
            onSubmit={handleConfirmPin}
            isLoading={loading}
            onBack={() => {
              setStep(2);
              setNewPin("");
            }}
          />
        )}
        {hasPin && step === 1 && !showForgotPin && (
          <NumericPinInput
            title="Enter Current PIN"
            description="Enter your current 4-digit transaction PIN."
            onSubmit={handleCurrentPin}
            isLoading={loading}
            onBack={() => router.back()}
            onForgotPin={() => setShowForgotPin(true)}
          />
        )}
        {hasPin && step === 2 && (
          <NumericPinInput
            title="Set New Transaction PIN"
            description="Create a new 4-digit PIN to authorize all transactions."
            onSubmit={handleNewPin}
            isLoading={loading}
            onBack={() => {
              setStep(1);
              setCurrentPin("");
            }}
          />
        )}
        {hasPin && step === 3 && (
          <NumericPinInput
            title="Confirm New Transaction PIN"
            description="Re-enter your new 4-digit PIN to confirm."
            onSubmit={handleConfirmPin}
            isLoading={loading}
            onBack={() => {
              setStep(2);
              setNewPin("");
            }}
          />
        )}
      </div>
    </div>
  );
}
