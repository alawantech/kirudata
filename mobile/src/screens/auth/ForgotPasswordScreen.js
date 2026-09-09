import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";

const OTP_LEN = 6;

export default function ForgotPasswordScreen({ navigation, route }) {
  const returnTo = route.params?.returnTo;
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(Array(OTP_LEN).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [passwordStep, setPasswordStep] = useState("new");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);
  const otpVerifying = useRef(false);
  const submittedRef = useRef(false);
  const newPasswordRef = useRef("");
  newPasswordRef.current = newPassword;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const r = await client.post("/auth/forgot/password/send", { email: email.trim() });
      setOtpToken(r.data.data.otpToken);
      setOtpEmail(r.data.data.email);
      setStep(2);
      setResendCooldown(r.data.data.cooldown || 60);
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Failed to send code." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpVerifying.current) return;
    const code = otpCode.join("");
    if (code.length !== OTP_LEN) return;
    otpVerifying.current = true;
    setOtpLoading(true);
    try {
      const r = await client.post("/auth/forgot/password/verify", { otpToken, code });
      setResetToken(r.data.data.resetToken);
      setStep(3);
      setPasswordStep("new");
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Invalid or expired code." });
      setOtpCode(Array(OTP_LEN).fill(""));
      otpVerifying.current = false;
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    if (otpCode.every((c) => c !== "") && step === 2 && !otpLoading) {
      handleVerifyOtp();
    }
  }, [otpCode, step]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const r = await client.post("/auth/forgot/password/resend", { otpToken });
      setOtpToken(r.data.data.otpToken);
      setResendCooldown(r.data.data.cooldown || 60);
      setOtpCode(Array(OTP_LEN).fill(""));
      otpVerifying.current = false;
      otpRefs.current[0]?.focus();
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Failed to resend." });
    }
  };

  // ── Password confirm → auto-submit when both fields filled and valid ──
  useEffect(() => {
    if (step !== 3 || passwordStep !== "confirm" || !confirmPassword || !newPassword || submittedRef.current) return;
    if (newPassword.length < 8 || newPassword !== confirmPassword) return;
    submittedRef.current = true;
    const np = newPassword;

    (async () => {
      setLoading(true);
      setError("");
      try {
        await client.post("/auth/forgot/password/reset", { resetToken, newPassword: np });
        Toast.show({ type: "success", text1: "Password reset successful!" });
        await logout();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } catch (err) {
        submittedRef.current = false;
        setError(err?.response?.data?.msg || "Failed to reset password");
        setTimeout(() => {
          setError("");
          setConfirmPassword("");
          setNewPassword("");
          setPasswordStep("new");
        }, 1500);
      } finally {
        setLoading(false);
      }
    })();
  }, [confirmPassword, newPassword, step, passwordStep]);

  const handleOtpInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleBack = useCallback(() => {
    if (step === 1) {
      navigation.goBack();
    } else if (step === 2) {
      setStep(1);
      setOtpCode(Array(OTP_LEN).fill(""));
      otpVerifying.current = false;
    } else if (step === 3 && passwordStep === "confirm") {
      setPasswordStep("new");
      setConfirmPassword("");
      submittedRef.current = false;
    } else if (step === 3 && passwordStep === "new") {
      setStep(2);
      setNewPassword("");
      setOtpCode(Array(OTP_LEN).fill(""));
      otpVerifying.current = false;
    }
  }, [step, passwordStep, navigation]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={insets.top + 56}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>

        {/* Step 1: Email */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: "#2563eb" }]}>
              <Ionicons name="mail" size={28} color="white" />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.desc}>Enter your registered email and we'll send you a verification code.</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Send Verification Code</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: "#2563eb" }]}>
              <Ionicons name="shield-checkmark" size={28} color="white" />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.desc}>We sent a 6-digit code to {otpEmail}</Text>
            <View style={styles.otpRow}>
              {otpCode.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(v) => handleOtpInput(i, v)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, (otpLoading || otpCode.some((c) => !c)) && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={otpLoading || otpCode.some((c) => !c)}
            >
              {otpLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Verify Code</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0} style={styles.resendBtn}>
              <Text style={[styles.resendText, resendCooldown > 0 && { color: "#94a3b8" }]}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: "#2563eb" }]}>
              <Ionicons name="lock-closed" size={28} color="white" />
            </View>
            <Text style={styles.title}>
              {passwordStep === "new" ? "Set New Password" : "Confirm Password"}
            </Text>
            <Text style={styles.desc}>
              {passwordStep === "new"
                ? "Enter a new password (minimum 8 characters)."
                : "Re-enter your new password to confirm."}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {passwordStep === "new" ? (
              <TextInput
                style={styles.pwdInput}
                placeholder="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                minLength={8}
              />
            ) : (
              <TextInput
                style={styles.pwdInput}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                minLength={8}
              />
            )}

            <Text style={styles.charCount}>
              {passwordStep === "new"
                ? newPassword.length === 0
                  ? "Minimum 8 characters"
                  : newPassword.length < 8
                    ? `${newPassword.length} / 8 characters`
                    : `\u2713 ${newPassword.length} characters`
                : confirmPassword.length === 0
                  ? "Minimum 8 characters"
                  : confirmPassword.length < 8
                    ? `${confirmPassword.length} / 8 characters`
                    : `\u2713 ${confirmPassword.length} characters`}
            </Text>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Resetting password...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.btn,
                  (passwordStep === "new" ? newPassword.length < 8 : confirmPassword.length < 8) && styles.btnDisabled,
                ]}
                disabled={passwordStep === "new" ? newPassword.length < 8 : confirmPassword.length < 8}
                onPress={() => {
                  if (passwordStep === "new") {
                    if (newPassword.length >= 8) setPasswordStep("confirm");
                  } else {
                    if (confirmPassword.length >= 8) {
                      submittedRef.current = false;
                      // Trigger the useEffect by setting confirmPassword
                    }
                  }
                }}
              >
                <Text style={styles.btnText}>
                  {passwordStep === "new" ? "Continue" : "Reset Password"}
                </Text>
              </TouchableOpacity>
            )}

            {passwordStep === "confirm" && !loading && (
              <TouchableOpacity
                onPress={() => {
                  setPasswordStep("new");
                  setConfirmPassword("");
                  submittedRef.current = false;
                }}
                style={styles.backBtnInner}
              >
                <Ionicons name="arrow-back" size={16} color="#2563eb" />
                <Text style={styles.backBtnInnerText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step !== 3 && (
          <TouchableOpacity onPress={handleBack} style={styles.linkBtn}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f7" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  backBtn: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  card: {
    backgroundColor: "white", borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 4, alignItems: "center",
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 6 },
  desc: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  input: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, fontSize: 15,
    marginBottom: 12, backgroundColor: "#f8fafc", width: "100%",
  },
  pwdInput: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, fontSize: 15,
    backgroundColor: "#f8fafc", width: "100%", marginBottom: 4,
  },
  charCount: {
    fontSize: 11, color: "#94a3b8", alignSelf: "flex-start", paddingHorizontal: 4,
    marginBottom: 12, marginTop: 2,
  },
  btn: {
    backgroundColor: "#2563eb", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 4, width: "100%",
  },
  btnDisabled: { backgroundColor: "#94a3b8" },
  btnText: { color: "white", fontWeight: "700", fontSize: 15 },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
  otpInput: {
    width: 48, height: 52, borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 10,
    textAlign: "center", fontSize: 20, fontWeight: "700", backgroundColor: "#f8fafc",
  },
  resendBtn: { alignItems: "center", marginTop: 12 },
  resendText: { color: "#2563eb", fontWeight: "600", fontSize: 14 },
  linkBtn: { alignItems: "center", marginTop: 20 },
  linkText: { color: "#2563eb", fontWeight: "600", fontSize: 14 },
  errorText: { color: "#ef4444", fontSize: 14, fontWeight: "600", marginBottom: 16 },
  loadingBox: { paddingVertical: 32, alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b", fontWeight: "600" },
  backBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingVertical: 8,
  },
  backBtnInnerText: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
});
