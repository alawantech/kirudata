import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";
import { Header } from "../../components/Header";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import { ForgotPinModal } from "../../components/ForgotPinModal";

const PIN_LEN = 4;
const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "back"],
];

export default function ChangePinScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const hasPin = user?.pinEnabled;

  // Steps: "current" → "new" → "confirm" (if hasPin)
  // Steps: "new" → "confirm" (if no pin)
  const [step, setStep] = useState(hasPin ? "current" : "new");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPin, setShowForgotPin] = useState(false);

  const submittedRef = useRef(false);
  const newPinRef = useRef("");
  const currentPinRef = useRef("");

  // Keep refs in sync
  useEffect(() => { newPinRef.current = newPin; }, [newPin]);
  useEffect(() => { currentPinRef.current = currentPin; }, [currentPin]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  // ── Step: "current" — verify PIN, then advance to new PIN step ──
  useEffect(() => {
    if (step !== "current" || currentPin.length !== PIN_LEN || submittedRef.current) return;
    submittedRef.current = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await client.post("/user/pin/verify", { currentPin: currentPinRef.current });
        setStep("new");
        submittedRef.current = false;
      } catch (err) {
        submittedRef.current = false;
        const msg = err?.response?.data?.msg || "Current PIN is incorrect.";
        setError(msg);
        setTimeout(() => {
          setCurrentPin("");
          setError("");
        }, 1500);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPin, step]);

  // ── Step: "new" — auto-advance to confirm when 4 digits entered ──
  useEffect(() => {
    if (step === "new" && newPin.length === PIN_LEN) {
      setTimeout(() => setStep("confirm"), 200);
    }
  }, [newPin, step]);

  // ── Step: "confirm" — auto-submit when 4 digits entered ──
  useEffect(() => {
    if (step !== "confirm" || confirmPin.length !== PIN_LEN || submittedRef.current) return;
    submittedRef.current = true;
    const np = newPinRef.current;
    const cp = confirmPin;

    if (np !== cp) {
      setError("PINs do not match. Try again.");
      submittedRef.current = false;
      setTimeout(() => {
        setConfirmPin("");
        setNewPin("");
        setStep("new");
        setError("");
      }, 1500);
      return;
    }

    (async () => {
      setLoading(true);
      setError("");
      try {
        await client.post("/user/pin", {
          newPin: np,
          ...(hasPin ? { currentPin: currentPinRef.current } : {}),
        });
        await refreshUser();
        goBack();
      } catch (err) {
        submittedRef.current = false;
        setError(err?.response?.data?.msg || "Failed to update PIN");
        setTimeout(() => {
          setError("");
          setConfirmPin("");
          setNewPin("");
          setStep(hasPin ? "current" : "new");
        }, 1500);
      } finally {
        setLoading(false);
      }
    })();
  }, [confirmPin, step]);

  const handleKey = useCallback((key) => {
    if (loading || error) return;
    const setter =
      step === "current" ? setCurrentPin :
      step === "new" ? setNewPin :
      setConfirmPin;
    const val =
      step === "current" ? currentPin :
      step === "new" ? newPin :
      confirmPin;

    if (key === "back") {
      setter((p) => p.slice(0, -1));
    } else if (key !== null && val.length < PIN_LEN) {
      setter((p) => p + key);
    }
  }, [step, currentPin, newPin, confirmPin, loading, error]);

  const handleGoBack = useCallback(() => {
    if (step === "confirm") {
      setStep("new");
      setNewPin("");
      setConfirmPin("");
      submittedRef.current = false;
    } else if (step === "new" && hasPin) {
      setStep("current");
      setCurrentPin("");
      setNewPin("");
      submittedRef.current = false;
    } else {
      goBack();
    }
  }, [step, hasPin, goBack]);

  const stepTitle = () => {
    if (step === "current") return "Enter Current PIN";
    if (step === "new" && hasPin) return "Set New PIN";
    if (step === "new" && !hasPin) return "Set Your PIN";
    if (step === "confirm" && hasPin) return "Confirm New PIN";
    return "Confirm Your PIN";
  };

  const stepDesc = () => {
    if (step === "current") return "Enter your current 4-digit transaction PIN.";
    if (step === "new") return "Create a 4-digit PIN to authorize all transactions.";
    return "Re-enter your 4-digit PIN to confirm.";
  };

  const currentInput =
    step === "current" ? currentPin :
    step === "new" ? newPin :
    confirmPin;

  const showKeypad = !loading;
  const showBack = (step === "confirm" || (step === "new" && hasPin)) && !loading;
  const showForgot = step === "current" && hasPin && !loading;

  // After forgot PIN success, go back to profile
  const handleForgotPinSuccess = useCallback(() => {
    setShowForgotPin(false);
    goBack();
  }, [goBack]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header
        title={hasPin ? "Change Transaction PIN" : "Set Transaction PIN"}
        onBack={handleGoBack}
      />

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>{stepTitle()}</Text>
          <Text style={styles.desc}>{stepDesc()}</Text>

          <View style={styles.dotsRow}>
            {Array.from({ length: PIN_LEN }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentInput.length ? styles.dotFilled : styles.dotEmpty,
                  error ? { backgroundColor: COLORS.danger + "40" } : null,
                ]}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>
                {step === "current" ? "Verifying PIN..." : "Setting PIN..."}
              </Text>
            </View>
          ) : (
            <View style={styles.keypadInner}>
              {ROWS.map((row, ri) => (
                <View key={ri} style={styles.keyRow}>
                  {row.map((key, ki) => {
                    const isBack = key === "back";
                    const isHidden = key === null;
                    return (
                      <TouchableOpacity
                        key={ki}
                        onPress={() => handleKey(key)}
                        disabled={isHidden}
                        style={[styles.key, isHidden && styles.keyInvisible]}
                        activeOpacity={0.45}
                      >
                        {isBack ? (
                          <Ionicons name="backspace-outline" size={24} color={COLORS.danger} />
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

          {showBack && (
            <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {showForgot && (
            <TouchableOpacity
              onPress={() => setShowForgotPin(true)}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotBtnText}>Forgot PIN?</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ForgotPinModal
        visible={showForgotPin}
        onClose={() => setShowForgotPin(false)}
        onSuccess={handleForgotPinSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
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
  desc: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  forgotBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
