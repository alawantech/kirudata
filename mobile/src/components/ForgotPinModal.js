import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";
import client from "../api/client";

const PIN_LEN = 4;
const OTP_LEN = 6;

const PIN_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "back"],
];

export function ForgotPinModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState("otp"); // otp, pin, confirm, success
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(90);
  const [otpToken, setOtpToken] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    if (visible) {
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setNewPin("");
      setConfirmPin("");
      setError("");
      setResendTimer(90);
      setOtpToken(null);
      setOtpEmail("");
      setResetToken(null);
      sendOtp();
    }
  }, [visible]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const sendOtp = async () => {
    setSending(true);
    try {
      const r = await client.post("/auth/forgot/pin/send");
      if (r.data?.data?.otpToken) setOtpToken(r.data.data.otpToken);
      if (r.data?.data?.email) setOtpEmail(r.data.data.email);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(90);
    setError("");
    setOtp(["", "", "", "", "", ""]);
    await sendOtp();
  };

  const handleOtpInput = (text, index) => {
    if (!/^\d?$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < OTP_LEN - 1) {
      setTimeout(() => otpRefs.current[index + 1]?.focus(), 50);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      setTimeout(() => otpRefs.current[index - 1]?.focus(), 50);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LEN) {
      setError("Enter all 6 digits");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await client.post("/auth/forgot/pin/verify", { otpToken, code });
      if (r.data?.data?.resetToken) setResetToken(r.data.data.resetToken);
      setStep("pin");
    } catch (e) {
      setError(e.response?.data?.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handlePinKey = (key) => {
    const current = step === "pin" ? newPin : confirmPin;
    const setter = step === "pin" ? setNewPin : setConfirmPin;

    if (key === "back") {
      setter((p) => p.slice(0, -1));
    } else if (key !== null && current.length < PIN_LEN) {
      setter((p) => p + key);
    }
  };

  useEffect(() => {
    if (step === "pin" && newPin.length === PIN_LEN) {
      setTimeout(() => setStep("confirm"), 200);
    } else if (step === "confirm" && confirmPin.length === PIN_LEN) {
      if (newPin === confirmPin) {
        handleResetPin();
      } else {
        setError("PINs do not match. Try again.");
        setTimeout(() => {
          setConfirmPin("");
          setNewPin("");
          setStep("pin");
          setError("");
        }, 1500);
      }
    }
  }, [newPin, confirmPin]);

  const handleResetPin = async () => {
    setLoading(true);
    setError("");
    try {
      await client.post("/auth/forgot/pin/reset", { resetToken, newPin });
      setStep("success");
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1200);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reset PIN");
      setTimeout(() => {
        setConfirmPin("");
        setNewPin("");
        setStep("pin");
        setError("");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.iconBox}>
            <Ionicons name="lock-open" size={32} color={COLORS.primary} />
          </View>

          {step === "otp" && (
            <>
              <Text style={styles.title}>Reset Transaction PIN</Text>
              <Text style={styles.sub}>
                Enter the 6-digit code sent to{" "}
                <Text style={{ fontWeight: "700", color: COLORS.black }}>
                  {otpEmail || "your email"}
                </Text>
              </Text>

              {sending ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Sending code...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        style={[styles.otpInput, digit ? styles.otpFilled : null]}
                        value={digit}
                        onChangeText={(t) => handleOtpInput(t, i)}
                        onKeyPress={(e) => handleOtpKeyDown(e, i)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        autoFocus={i === 0}
                      />
                    ))}
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.verifyBtn, loading && { opacity: 0.5 }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.verifyBtnText}>Verify</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resendBtn, resendTimer > 0 && { opacity: 0.4 }]}
                    onPress={handleResend}
                    disabled={resendTimer > 0}
                  >
                    <Text style={styles.resendText}>
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend Code"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {(step === "pin" || step === "confirm") && (
            <>
              <Text style={styles.title}>
                {step === "pin" ? "Set New PIN" : "Confirm Your PIN"}
              </Text>
              <Text style={styles.sub}>
                {step === "pin"
                  ? "Create a 4-digit PIN to secure your transactions."
                  : "Please re-enter your PIN to confirm it's correct."}
              </Text>

              <View style={styles.dotsRow}>
                {Array.from({ length: PIN_LEN }).map((_, i) => {
                  const current = step === "pin" ? newPin : confirmPin;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < current.length ? styles.dotFilled : styles.dotEmpty,
                        error ? { backgroundColor: COLORS.danger + "40" } : null,
                      ]}
                    />
                  );
                })}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Resetting PIN...</Text>
                </View>
              ) : (
                <View style={styles.keypadInner}>
                  {PIN_ROWS.map((row, ri) => (
                    <View key={ri} style={styles.keyRow}>
                      {row.map((key, ki) => {
                        const isBack = key === "back";
                        const isHidden = key === null;
                        return (
                          <TouchableOpacity
                            key={ki}
                            onPress={() => handlePinKey(key)}
                            disabled={isHidden}
                            style={[
                              styles.key,
                              isHidden && styles.keyInvisible,
                            ]}
                            activeOpacity={0.45}
                          >
                            {isBack ? (
                              <Ionicons
                                name="backspace-outline"
                                size={24}
                                color={COLORS.danger}
                              />
                            ) : !isHidden ? (
                              <Text style={styles.keyText}>{key}</Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {step === "success" && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text style={styles.successText}>PIN Reset Successfully</Text>
            </View>
          )}

          {step !== "success" && (
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const otpRefs = { current: [] };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    ...SHADOW.lg,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    justifyContent: "center",
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.black,
  },
  otpFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  verifyBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    marginBottom: 12,
  },
  verifyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  resendBtn: {
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
    justifyContent: "center",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dotEmpty: {
    borderColor: COLORS.border,
    backgroundColor: "transparent",
  },
  dotFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "600",
  },
  keypadInner: {
    width: "100%",
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  key: {
    width: "30%",
    aspectRatio: 1.5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.offWhite,
  },
  keyInvisible: {
    backgroundColor: "transparent",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    width: "100%",
  },
  cancelText: { fontSize: 15, fontWeight: "700", color: COLORS.muted },
  successBox: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#10b981",
  },
});
