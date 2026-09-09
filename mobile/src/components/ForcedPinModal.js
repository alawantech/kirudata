import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOW } from "../constants/theme";

const PIN_LEN = 4;
const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["0", "back"],
];

export function ForcedPinModal({
  visible,
  onSubmit,
  loading = false,
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(1); // 1: Enter, 2: Confirm
  const [error, setError] = useState("");

  // Reset on open
  useEffect(() => {
    if (visible) {
      setPin("");
      setConfirm("");
      setStep(1);
      setError("");
    }
  }, [visible]);

  useEffect(() => {
    if (step === 1 && pin.length === PIN_LEN) {
      setTimeout(() => setStep(2), 200);
    } else if (step === 2 && confirm.length === PIN_LEN) {
      if (pin === confirm) {
        onSubmit(pin);
      } else {
        setError("PINs do not match. Try again.");
        setTimeout(() => {
          setConfirm("");
          setPin("");
          setStep(1);
          setError("");
        }, 1500);
      }
    }
  }, [pin, confirm]);

  const handleKey = (key) => {
    if (loading || error) return;
    const current = step === 1 ? pin : confirm;
    const setter = step === 1 ? setPin : setConfirm;

    if (key === "back") {
      setter((p) => p.slice(0, -1));
    } else if (current.length < PIN_LEN) {
      setter((p) => p + key);
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
            <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>
            {step === 1 ? "Set Transaction PIN" : "Confirm Your PIN"}
          </Text>
          <Text style={styles.sub}>
            {step === 1 
              ? "Create a 4-digit PIN to secure your transactions." 
              : "Please re-enter your PIN to confirm it's correct."}
          </Text>

          {/* 4 PIN dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: PIN_LEN }).map((_, i) => {
              const current = step === 1 ? pin : confirm;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < current.length ? styles.dotFilled : styles.dotEmpty,
                    error ? { backgroundColor: COLORS.danger + "40" } : null
                  ]}
                />
              );
            })}
          </View>

          {error ? (
              <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Setting your PIN...</Text>
            </View>
          ) : (
            <View style={styles.keypadInner}>
              {ROWS.map((row, ri) => (
                <View key={ri} style={styles.keyRow}>
                  {row.map((key, ki) => {
                    const isBack = key === "back";
                    const isZero = key === "0";

                    return (
                      <TouchableOpacity
                        key={ki}
                        onPress={() => handleKey(key)}
                        style={[
                          styles.key,
                          isZero && styles.keyZero,
                        ]}
                        activeOpacity={0.45}
                      >
                        {isBack ? (
                          <Ionicons
                            name="backspace-outline"
                            size={24}
                            color={COLORS.danger}
                          />
                        ) : (
                          <Text style={styles.keyText}>{key}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    ...SHADOW.lg,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    alignItems: 'center',
    justifyContent: 'center',
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
      fontWeight: '600',
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
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.offWhite,
  },
  keyZero: {
    flex: 1,
    width: null,
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
  },
});
