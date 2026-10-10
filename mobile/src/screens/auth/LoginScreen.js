import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  TextInput,
  Animated,
  Dimensions,
  Linking,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import client, { API_BASE } from "../../api/client";
import { PinInput } from "../../components/PinInput";
import { useBiometric } from "../../hooks/useBiometric";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import { getDeviceFingerprint } from "../../lib/fingerprint";

const { width: SW } = Dimensions.get("window");

function maskPhone(phone = "") {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return digits;
  return digits.slice(0, 4) + "***" + digits.slice(-4);
}

function maskEmail(email = "") {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 3) return email;
  return local.slice(0, 3) + "***" + local.slice(-1) + "@" + domain;
}

const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../../assets/logo-kiru.png");

export default function LoginScreen({ navigation }) {
  const { login, lastUser, clearLastUser, completeOtpLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const biometric = useBiometric();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [loginStep, setLoginStep] = useState("identifier");
  const [showWbPassword, setShowWbPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const passwordInputRef = useRef(null);

  const [otpStep, setOtpStep] = useState(false);
  const [otpToken, setOtpToken] = useState(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);
  const scrollRef = useRef(null);

  const isReturning = !!lastUser && !otpStep && !identifier;
  const firstName = lastUser?.name?.split(" ")[0] ?? "";

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStep = (direction) => {
    slideAnim.setValue(direction === "forward" ? 30 : -30);
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();
  };

  // Load logo
  useEffect(() => {
    const normaliseUrl = (url) => {
      if (!url) return null;
      try {
        const apiOrigin = new URL(API_BASE).origin;
        const parsed = new URL(url);
        if (parsed.origin !== apiOrigin) return apiOrigin + parsed.pathname + parsed.search;
        return url;
      } catch { return url; }
    };
    AsyncStorage.getItem(LOGO_CACHE_KEY).then((c) => { if (c) setLogoUrl(normaliseUrl(c)); });
    client.get("/public/settings").then((r) => {
      const s = r.data?.data?.settings;
      const url = normaliseUrl(s?.logoUrl);
      if (url) { setLogoUrl(url); AsyncStorage.setItem(LOGO_CACHE_KEY, url); }
      if (s?.whatsapp) setWhatsappNumber(s.whatsapp);
      else if (s?.phone) setWhatsappNumber(s.phone);
    }).catch(() => {});
  }, []);

  const handleLogin = async (id, pw) => {
    const loginId = id || isReturning ? lastUser.identifier : identifier.trim();
    const loginPw = pw || password;
    if (!loginId) { Toast.show({ type: "error", text1: "Please enter your email or phone" }); return; }
    if (loginPw.length !== 8) { Toast.show({ type: "error", text1: "Password must be exactly 8 digits" }); return; }
    setLoading(true);
    try {
      let deviceFingerprint = null;
      try { deviceFingerprint = await getDeviceFingerprint(); } catch {}
      const result = await login(loginId, loginPw, deviceFingerprint);
      if (result?.requiresOtp) {
        setOtpToken(result.otpToken); setOtpEmail(result.email);
        setOtpStep(true); setResendCooldown(60); setLoading(false);
        Toast.show({ type: "info", text1: "Verification code sent to your email" });
        return;
      }
      if (biometric.isSupported && biometric.isEnrolled) {
        await biometric.saveCredentials(loginId, loginPw);
      }
      Toast.show({ type: "success", text1: `Welcome back, ${firstName || loginId}! \uD83D\uDC4B` });
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Invalid credentials" });
    } finally { setLoading(false); }
  };

  const handleContinueIdentifier = () => {
    if (!identifier.trim()) { Toast.show({ type: "error", text1: "Please enter your email or phone" }); return; }
    animateStep("forward");
    setTimeout(() => setLoginStep("password"), 10);
  };

  const handleBackToIdentifier = () => {
    animateStep("back");
    setTimeout(() => { setLoginStep("identifier"); setPassword(""); }, 10);
  };

  // OTP handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode]; newCode[index] = value.slice(-1); setOtpCode(newCode);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyPress = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !otpCode[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
  };
  const handleVerifyOtp = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) { Toast.show({ type: "error", text1: "Please enter the full 6-digit code" }); return; }
    setOtpLoading(true);
    try {
      let deviceFingerprint = null;
      try { deviceFingerprint = await getDeviceFingerprint(); } catch {}
      const r = await client.post("/auth/otp/verify", { otpToken, code, deviceFingerprint });
      const { token: newToken } = r.data.data;
      if (newToken) await SecureStore.setItemAsync("auth_token", newToken);
      const me = await client.get("/auth/me");
      const user = me.data.data.user;
      // completeOtpLogin handles saving lastUser correctly with the NEW account
      await completeOtpLogin(user);
      Toast.show({ type: "success", text1: "Welcome! \uD83D\uDC4B" });
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Invalid or expired code" });
      setOtpCode(["", "", "", "", "", ""]); otpInputRefs.current[0]?.focus();
    } finally { setOtpLoading(false); }
  };
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const r = await client.post("/auth/otp/resend", { otpToken });
      setOtpToken(r.data.data.otpToken); setResendCooldown(r.data.data.cooldown || 60);
      setOtpCode(["", "", "", "", "", ""]); otpInputRefs.current[0]?.focus();
      Toast.show({ type: "success", text1: "New verification code sent!" });
    } catch (err) { Toast.show({ type: "error", text1: err?.response?.data?.msg || "Failed to resend code" }); }
  };
  useEffect(() => { if (resendCooldown <= 0) return; const t = setInterval(() => { setResendCooldown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }); }, 1000); return () => clearInterval(t); }, [resendCooldown]);
  useEffect(() => { if (otpCode.every((c) => c !== "") && otpStep && !otpLoading) handleVerifyOtp(); }, [otpCode]);

  const handleBiometricLogin = async () => {
    try {
      const result = await biometric.authenticate();
      if (!result.success) {
        if (result.error !== "user_cancel" && result.error !== "system_cancel") {
          Toast.show({ type: "error", text1: result.message || "Biometric failed. Enter your password." });
        }
        return;
      }
      // Always use lastUser.identifier on welcome-back screen, not the stored identifier
      // (stored credentials may be from a different/previous account)
      const id = isReturning ? lastUser?.identifier : result.identifier;
      let deviceFingerprint = null;
      try { deviceFingerprint = await getDeviceFingerprint(); } catch {}
      const loginResult = await login(id, result.password, deviceFingerprint);
      if (loginResult?.requiresOtp) {
        setOtpToken(loginResult.otpToken); setOtpEmail(loginResult.email);
        setOtpStep(true); setResendCooldown(60);
        Toast.show({ type: "info", text1: "Verification code sent to your email" });
        return;
      }
      Toast.show({ type: "success", text1: "Welcome back! \uD83D\uDC4B" });
    } catch (err) { Toast.show({ type: "error", text1: err?.response?.data?.msg || "Sign in failed" }); }
  };

  const handleNotYou = async () => {
    await clearLastUser(); setPassword(""); setIdentifier(""); setLoginStep("identifier");
    slideAnim.setValue(0); fadeAnim.setValue(1);
  };


  const renderBodyContent = () => (
    <>
      {otpStep ? (
        /* ─── OTP Verification ────────────────────────────────────────── */
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.bodyContent, { paddingTop: 28, paddingBottom: insets.bottom + 120 }]}
        >
          <TouchableOpacity onPress={() => { setOtpStep(false); setOtpCode(["", "", "", "", "", ""]); setOtpToken(null); setPassword(""); setIdentifier(""); setLoginStep("identifier"); fadeAnim.setValue(1); slideAnim.setValue(0); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Verification Code</Text>
          <Text style={styles.sub}>We sent a 6-digit code to{"\n"}<Text style={{ fontWeight: "700", color: COLORS.black }}>{otpEmail}</Text></Text>

          <View style={styles.otpContainer}>
            {otpCode.map((digit, i) => (
              <TextInput key={i} ref={(el) => (otpInputRefs.current[i] = el)} style={[styles.otpBox, digit ? styles.otpBoxFilled : null]} value={digit} onChangeText={(v) => handleOtpChange(i, v)} onKeyPress={(e) => handleOtpKeyPress(i, e)} keyboardType="numeric" maxLength={1} autoFocus={i === 0} selectionColor={COLORS.primary} />
            ))}
          </View>

          <TouchableOpacity style={[styles.continueBtn, { opacity: otpLoading || otpCode.some((c) => !c) ? 0.5 : 1 }]} onPress={handleVerifyOtp} disabled={otpLoading || otpCode.some((c) => !c)} activeOpacity={0.8}>
            <Text style={styles.continueBtnText}>{otpLoading ? "Verifying..." : "Verify Code"}</Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginTop: 20 }}>
            {resendCooldown > 0 ? (
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>Resend code in {resendCooldown}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp}>
                <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 13 }}>Resend code</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : loginStep === "password" ? (
        /* ─── Step 2: Password ──────────────────────────────────────── */
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.bodyContent, { paddingTop: 28, paddingBottom: insets.bottom + 120 }]}
        >
          <TouchableOpacity onPress={handleBackToIdentifier} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Enter your password</Text>
          <Text style={styles.sub}>for <Text style={{ fontWeight: "700", color: COLORS.black }}>{identifier.includes("@") ? maskEmail(identifier) : maskPhone(identifier)}</Text></Text>

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => passwordInputRef.current?.focus()}
            style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}
          >
            <View style={styles.inputIconWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? COLORS.primary : COLORS.subtle} />
            </View>
            <TextInput
              ref={passwordInputRef}
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.subtle}
              secureTextEntry={!showWbPassword}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              textContentType="none"
              importantForAutofill="no"
              blurOnSubmit={false}
              returnKeyType="done"
              onSubmitEditing={() => handleLogin()}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowWbPassword((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={showWbPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.subtle} />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueBtn, { opacity: password.trim().length >= 8 ? 1 : 0.5 }]}
            onPress={() => handleLogin()}
            disabled={password.trim().length < 8 || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={{ alignSelf: "center", marginTop: 8, paddingVertical: 8 }} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 13 }}>Forgot password?</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* ─── Step 1: Email / Phone ──────────────────────────────────── */
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 120 }}
        >
          {/* Sign-in Card */}
          <View style={styles.signinCard}>
            <View style={styles.cardDecoTop} />
            <View style={styles.cardDecoBottom} />

            <Text style={styles.heading}>Welcome</Text>
            <Text style={styles.sub}>Sign in to your account to continue</Text>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}
            >
              <View style={styles.inputIconWrap}>
                <Ionicons name="mail-outline" size={20} color={inputFocused ? COLORS.primary : COLORS.subtle} />
              </View>
              <TextInput
                style={styles.textInput}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Email or phone number"
                placeholderTextColor={COLORS.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              {identifier.length > 0 && (
                <TouchableOpacity onPress={() => setIdentifier("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={20} color={COLORS.subtle} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueBtn, { opacity: identifier.trim() ? 1 : 0.5 }]}
              onPress={handleContinueIdentifier}
              disabled={!identifier.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.createAccountBtn} onPress={() => navigation.navigate("Register")} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomDeco}>
            <View style={styles.bottomDecoOrb1} />
            <View style={styles.bottomDecoOrb2} />

            <View style={styles.bottomDecoRow}>
              <View style={styles.bottomDecoItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
                <Text style={styles.bottomDecoLabel}>Secured</Text>
              </View>
              <View style={styles.bottomDecoDot} />
              <View style={styles.bottomDecoItem}>
                <Ionicons name="flash-outline" size={14} color="#7c3aed" />
                <Text style={[styles.bottomDecoLabel, { color: "#7c3aed" }]}>Fast</Text>
              </View>
              <View style={styles.bottomDecoDot} />
              <View style={styles.bottomDecoItem}>
                <Ionicons name="lock-closed-outline" size={14} color="#0ea5e9" />
                <Text style={[styles.bottomDecoLabel, { color: "#0ea5e9" }]}>Private</Text>
              </View>
            </View>

            {whatsappNumber ? (
              <TouchableOpacity
                style={styles.supportBtn}
                onPress={() => {
                  const num = whatsappNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
                  Linking.openURL(`https://wa.me/234${num}`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.supportText}>Contact Support</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          </ScrollView>
        )}
    </>
  );

  const canShowBiometric = isReturning && biometric.isSupported && biometric.isEnrolled && biometric.isEnabled;

  const Logo = ({ size = 140, style }) => (
    <Image
      source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
      style={[{ width: size, height: size, borderRadius: size * 0.18 }, style]}
      resizeMode="contain"
      onError={() => setLogoUrl(null)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {isReturning ? (
        /* ─── Welcome-back: centered layout + card ─────────────────── */
        <LinearGradient
          colors={["#0f172a", "#1e3a8a", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            paddingTop: insets.top + 10,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, width: "100%" }}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
          >
            <ScrollView
              style={{ flex: 1 }}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingVertical: 24,
              }}
            >
              <Animated.View
                style={{
                  alignItems: "center",
                  opacity: fadeAnim,
                  transform: [{ scale: logoScale }],
                  marginBottom: 20,
                }}
              >
                <View style={styles.wbAvatar}>
                  <Text style={styles.wbAvatarText}>{(firstName || "U").charAt(0).toUpperCase()}</Text>
                </View>
              </Animated.View>

              <View style={styles.wbCard}>
                <Text style={styles.wbCardTitle}>Welcome Back</Text>
                {firstName ? <Text style={styles.wbCardName}>{firstName}</Text> : null}

                {/* Fingerprint */}
                {canShowBiometric ? (
                  <TouchableOpacity onPress={handleBiometricLogin} style={styles.wbFingerprintWrap} activeOpacity={0.7}>
                    <View style={styles.wbFingerprintCircle}>
                      <Ionicons name="finger-print" size={36} color="#1e293b" />
                    </View>
                    <Text style={styles.wbFingerprintLabel}>Scan Your Fingerprint</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.wbFingerprintWrap}>
                    <View style={[styles.wbFingerprintCircle, { backgroundColor: "#f1f5f9" }]}>
                      <Ionicons name="finger-print" size={36} color="#94a3b8" />
                    </View>
                    <Text style={styles.wbFingerprintLabel}>Enter your password below</Text>
                  </View>
                )}

                {/* Password Input */}
                <View style={styles.wbPasswordField}>
                  <TextInput
                    style={styles.wbPasswordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showWbPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => handleLogin(lastUser.identifier, password)}
                  />
                  <TouchableOpacity onPress={() => setShowWbPassword((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.wbShowToggle}>{showWbPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.wbLoginBtn, { opacity: password.length >= 8 ? 1 : 0.5 }]}
                  onPress={() => handleLogin(lastUser.identifier, password)}
                  disabled={password.length < 8 || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.wbLoadingRow}>
                      <View style={styles.wbSpinner} />
                      <Text style={styles.wbLoginBtnText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.wbLoginBtnText}>Login</Text>
                  )}
                </TouchableOpacity>

                {/* Not my account */}
                <TouchableOpacity onPress={handleNotYou} style={styles.wbLogoutRow} activeOpacity={0.7}>
                  <Text style={styles.wbLogoutText}>Not my Account? </Text>
                  <Text style={styles.wbLogoutAction}>Logout</Text>
                </TouchableOpacity>
              </View>

              {whatsappNumber ? (
                <TouchableOpacity
                  style={styles.wbSupportCard}
                  onPress={() => {
                    const num = whatsappNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
                    Linking.openURL(`https://wa.me/234${num}`);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.wbSupportIcon}>
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wbSupportTitle}>Contact Support</Text>
                    <Text style={styles.wbSupportSub}>Chat with us on WhatsApp</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      ) : (
        <View style={{ flex: 1 }}>
          {/* == Banner ======================================================= */}
          <LinearGradient
            colors={["#0f172a", "#1e3a8a", "#4f46e5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, { paddingTop: insets.top + 10 }]}
          >
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", top: insets.top + 10, left: 16, zIndex: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={26} color={COLORS.white} />
            </TouchableOpacity>

            {loginStep === "password" ? (
              <Animated.View style={{ alignItems: "center", opacity: fadeAnim, transform: [{ scale: logoScale }] }}>
                <Logo size={100} style={{ marginBottom: 10 }} />
                <Text style={styles.wbGreeting}>Sign in to</Text>
                <Text style={styles.wbName}>Kiru Data</Text>
              </Animated.View>
            ) : (
              <Animated.View style={{ alignItems: "center", opacity: fadeAnim, transform: [{ scale: logoScale }] }}>
                <Logo size={180} />
              </Animated.View>
            )}
          </LinearGradient>

          {/* == Body ========================================================= */}
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 1 }}
              keyboardVerticalOffset={insets.top + 56}
            >
              <Animated.View
                style={{
                  flex: 1,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                {renderBodyContent()}
              </Animated.View>
            </KeyboardAvoidingView>
          ) : (
            <Animated.View
              style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {renderBodyContent()}
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  /* ── Banner ─────────────────────────────────────────────── */
  banner: {
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    height: 200,
  },
  circle1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)", top: -80, right: -60,
  },
  circle2: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: -70, left: -40,
  },
  circle3: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.03)", top: 30, left: 60,
  },
  wbGreeting: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "500", marginBottom: 2 },
  wbNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  wbName: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  wbPhone: { fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: "500" },

  /* ── Welcome-back card ──────────────────────────────────── */
  wbAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.25)",
  },
  wbAvatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
  },
  wbTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  wbAppName: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  wbCardContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  wbCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 28,
    paddingTop: 32,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  wbFingerprintWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  wbFingerprintCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  wbFingerprintLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  wbPasswordField: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
  },
  wbPasswordInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#0f172a",
    paddingVertical: 0,
  },
  wbShowToggle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
    marginLeft: 8,
  },
  wbLoginBtn: {
    width: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  wbLoginBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  wbLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wbSpinner: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: 9,
  },
  wbLogoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
  },
  wbLogoutText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
  },
  wbLogoutAction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ef4444",
  },

  wbCardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  wbCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 24,
  },
  wbSupportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
    width: "100%",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  wbSupportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  wbSupportTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  wbSupportSub: { fontSize: 12, fontWeight: "500", color: "#64748b", marginTop: 1 },
  /* ── Body ───────────────────────────────────────────────── */
  bodyContent: { padding: 20 },
  heading: { fontSize: 22, fontWeight: "900", color: COLORS.black, letterSpacing: -0.8, marginBottom: 4 },
  sub: { fontSize: 13, color: COLORS.muted, marginBottom: 20, lineHeight: 18 },

  /* ── Sign-in Card ───────────────────────────────────────── */
  signinCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.6)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  cardDecoTop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(79,70,229,0.04)",
    transform: [{ translateX: 30 }, { translateY: -30 }],
  },
  cardDecoBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99,102,241,0.04)",
    transform: [{ translateX: -20 }, { translateY: 20 }],
  },

  /* ── Back button ────────────────────────────────────────── */
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },

  /* ── Custom Input ───────────────────────────────────────── */
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIconWrap: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: COLORS.black, paddingVertical: 0 },

  /* ── Continue Button ────────────────────────────────────── */
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },

  /* ── Divider ────────────────────────────────────────────── */
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.subtle, fontWeight: "600" },

  /* ── Create Account Button ──────────────────────────────── */
  createAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    height: 50,
    borderWidth: 1.5,
    borderColor: "rgba(79,70,229,0.12)",
  },
  createAccountText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },

  /* ── Bottom decoration ──────────────────────────────────── */
  bottomDeco: {
    marginTop: 24,
    marginHorizontal: 16,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(79,70,229,0.03)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.08)",
    position: "relative",
    overflow: "hidden",
  },
  bottomDecoOrb1: {
    position: "absolute", width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(79,70,229,0.05)", top: -20, right: -15,
  },
  bottomDecoOrb2: {
    position: "absolute", width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(14,165,233,0.05)", bottom: -12, left: -10,
  },
  bottomDecoRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12,
  },
  bottomDecoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  bottomDecoLabel: { fontSize: 11, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.2 },
  bottomDecoDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.border },
  supportBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "rgba(37,211,102,0.2)",
  },
  supportText: { fontSize: 12, fontWeight: "700", color: "#25D366" },

  /* ── "Not you?" pill ────────────────────────────────────── */
  notYouRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 16, gap: 8,
  },
  notYouPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  notYouText: { fontSize: 12, color: COLORS.muted },
  notYouAction: { color: COLORS.primary, fontWeight: "700" },
  forgotPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: RADIUS.full, backgroundColor: COLORS.primary + "10", borderWidth: 1, borderColor: COLORS.primary + "30",
  },
  forgotPillText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  /* ── OTP ────────────────────────────────────────────────── */
  otpContainer: { flexDirection: "row", justifyContent: "center", gap: 10, marginVertical: 24 },
  otpBox: {
    width: 50, height: 58, borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 14,
    textAlign: "center", fontSize: 24, fontWeight: "700", color: COLORS.black, backgroundColor: "#f8fafc",
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: "#eff6ff" },
});
