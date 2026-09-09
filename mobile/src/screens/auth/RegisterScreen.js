import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  TextInput,
  Linking,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import { LoginPasswordInput } from "../../components/LoginPasswordInput";
import client, { API_BASE } from "../../api/client";

const { width: SW } = Dimensions.get("window");

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    referral: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const [forceOpenKey, setForceOpenKey] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);

  useEffect(() => {
    Animated.spring(logoAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    client
      .get("/public/settings")
      .then((r) => {
        const s = r.data?.data?.settings;
        setWhatsappNumber(s?.whatsapp || s?.phone || "");
      })
      .catch(() => {});
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const animateStep = (cb) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      cb();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setForceOpenKey((k) => k + 1);
      });
    });
  };

  const handleCheckAccount = async () => {
    const { fullname, email, phone } = form;
    if (!fullname.trim()) {
      Toast.show({ type: "error", text1: "Please enter your full name" });
      return;
    }
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Please enter your email address" });
      return;
    }
    if (!phone.trim()) {
      Toast.show({ type: "error", text1: "Please enter your phone number" });
      return;
    }
    if (!tosAccepted) {
      Toast.show({ type: "error", text1: "Please accept the Terms & Conditions" });
      return;
    }

    setLoading(true);
    try {
      const res = await client.post("/auth/check-account", {
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      const data = res.data.data;

      if (data.exists) {
        const field = data.field;
        if (field === "email") {
          Toast.show({
            type: "error",
            text1: "Email already registered",
            text2: "Please use a different email or log in.",
          });
        } else if (field === "phone") {
          Toast.show({
            type: "error",
            text1: "Phone number already registered",
            text2: "Please use a different phone number or log in.",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Account already exists",
            text2: "Please log in with your existing account.",
          });
        }
        setLoading(false);
        return;
      }
      setLoading(false);
      animateStep(() => setStep(1));
    } catch (err) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Could not verify account",
        text2: "Please try again.",
      });
    }
  };

  const handlePasswordSubmit = () => {
    setConfirmPassword("");
    animateStep(() => setStep(2));
  };

  const handleConfirmSubmit = async () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
        text2: "Please re-enter your password.",
      });
      animateStep(() => {
        setPassword("");
        setConfirmPassword("");
        setStep(1);
      });
      return;
    }

    setLoading(true);
    try {
      await register({
        fullname: form.fullname.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password,
        referral: form.referral.trim() || undefined,
      });
      Toast.show({ type: "success", text1: "Account created!", text2: "Welcome to Kiru Data" });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Registration failed",
        text2: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 0) {
      animateStep(() => setStep(step - 1));
    } else {
      navigation.goBack();
    }
  };

  const stepLabels = ["Your Details", "Set Password", "Confirm Password"];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Banner ── */}
      <LinearGradient
        colors={["#0f172a", "#1e3a8a", "#4f46e5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <TouchableOpacity onPress={goBack} style={styles.backBtnWrap}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          style={{
            transform: [{ scale: logoAnim }, { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            opacity: logoAnim,
            alignItems: "center",
          }}
        >
          <View style={styles.logoWrap}>
            <Ionicons name="person-add-outline" size={36} color="#fff" />
          </View>
          <Text style={styles.bannerTitle}>Create Account</Text>
          <Text style={styles.bannerSub}>Join thousands of happy users</Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 56}
      >
        {/* ── Step Indicator ── */}
        <View style={styles.stepRow}>
          {stepLabels.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  i <= step && styles.stepDotActive,
                  i < step && styles.stepDotDone,
                ]}
              >
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Content ── */}
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          {step === 0 && (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 120 }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Form Card ── */}
              <View style={styles.card}>
                <View style={styles.cardDecoTop} />
                <View style={styles.cardDecoBottom} />

                <Text style={styles.heading}>Get started</Text>
                <Text style={styles.sub}>Fill in your details to create your account</Text>

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="person-outline" size={18} color={COLORS.subtle} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={form.fullname}
                      onChangeText={set("fullname")}
                      placeholder="John Doe"
                      placeholderTextColor={COLORS.subtle}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.subtle} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={form.email}
                      onChangeText={set("email")}
                      placeholder="john@example.com"
                      placeholderTextColor={COLORS.subtle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="call-outline" size={18} color={COLORS.subtle} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={form.phone}
                      onChangeText={set("phone")}
                      placeholder="08012345678"
                      placeholderTextColor={COLORS.subtle}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>
                </View>

                {/* Referral Code */}
                <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                  <Text style={styles.fieldLabel}>Referral Code <Text style={{ color: COLORS.subtle, fontWeight: "400" }}>(optional)</Text></Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="gift-outline" size={18} color={COLORS.subtle} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={form.referral}
                      onChangeText={set("referral")}
                      placeholder="Enter referral code"
                      placeholderTextColor={COLORS.subtle}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>

              {/* ── Terms & Conditions ── */}
              <TouchableOpacity
                style={styles.tosRow}
                onPress={() => setTosAccepted(!tosAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.tosCheckbox, tosAccepted && styles.tosCheckboxActive]}>
                  {tosAccepted && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.tosText}>
                  I agree to the{" "}
                  <Text style={styles.tosLink} onPress={() => Linking.openURL("https://kirudata.com/terms")}>Terms & Conditions</Text>
                  {" "}and{" "}
                  <Text style={styles.tosLink} onPress={() => Linking.openURL("https://kirudata.com/privacy")}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* ── Submit Button ── */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleCheckAccount}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>
                    {loading ? "Checking..." : "Continue"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Divider ── */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ── Sign In Button ── */}
              <TouchableOpacity
                style={styles.signinBtn}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={18} color={COLORS.primary} />
                <Text style={styles.signinBtnText}>Already have an account? Sign In</Text>
              </TouchableOpacity>

              {/* ── Bottom Decoration ── */}
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

          {step === 1 && (
            <View style={styles.keyboardStep}>
              <View style={styles.keyboardHeader}>
                <Text style={styles.heading}>Set Your Password</Text>
                <Text style={styles.sub}>
                  Create an 8-digit numeric password for your account
                </Text>
              </View>
            <LoginPasswordInput
              value={password}
              onChangeText={setPassword}
              onAction={handlePasswordSubmit}
              actionLabel="Continue"
              actionLoading={loading}
              autoOpen
              forceOpen={forceOpenKey}
            />
            </View>
          )}

          {step === 2 && (
            <View style={styles.keyboardStep}>
              <View style={styles.keyboardHeader}>
                <Text style={styles.heading}>Confirm Your Password</Text>
                <Text style={styles.sub}>
                  Re-enter your 8-digit password to confirm
                </Text>
              </View>
            <LoginPasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onAction={handleConfirmSubmit}
              actionLabel="Create Account"
              actionLoading={loading}
              autoOpen
              forceOpen={forceOpenKey}
            />
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
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
  backBtnWrap: {
    position: "absolute",
    top: 50,
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },

  /* ── Step Indicator ─────────────────────────────────────── */
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 16,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  stepDotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepDotDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepNum: { fontSize: 12, fontWeight: "700", color: COLORS.subtle },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 10, color: COLORS.muted, fontWeight: "600" },
  stepLabelActive: { color: COLORS.primary },

  /* ── Body ───────────────────────────────────────────────── */
  body: { paddingHorizontal: 20, paddingTop: 4 },
  heading: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 20,
    lineHeight: 18,
  },

  /* ── Card ───────────────────────────────────────────────── */
  card: {
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
    marginBottom: 16,
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

  /* ── Fields ─────────────────────────────────────────────── */
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.body,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIconWrap: { marginRight: 12 },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
    paddingVertical: 0,
  },

  /* ── Submit ─────────────────────────────────────────────── */
  submitBtn: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  /* ── Divider ────────────────────────────────────────────── */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.subtle, fontWeight: "600" },

  /* ── Sign In Button ─────────────────────────────────────── */
  signinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    height: 52,
    borderWidth: 1.5,
    borderColor: "rgba(79,70,229,0.12)",
    marginBottom: 20,
  },
  signinBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  /* ── Bottom Decoration ──────────────────────────────────── */
  bottomDeco: {
    marginHorizontal: 0,
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

  /* ── Terms & Conditions ────────────────────────────────── */
  tosRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tosCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tosCheckboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tosText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
  tosLink: {
    color: COLORS.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  /* ── Keyboard Step ──────────────────────────────────────── */
  keyboardStep: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: "center",
  },
  keyboardHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
});
