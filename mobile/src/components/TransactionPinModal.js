import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";
import { ForgotPinModal } from "./ForgotPinModal";

const PIN_LEN = 4;
const TX_PIN_KEY = "tx_pin";

const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["bio", "0", "back"],
];

function useTxBiometric() {
  const [ready, setReady] = useState(false); // device supports biometrics
  const [icon, setIcon] = useState("finger-print");

  useEffect(() => {
    (async () => {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hw || !enrolled) return;

        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (!types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
          return; // device has no fingerprint — don't show bio button
        setIcon("finger-print");

        setReady(true);
      } catch {}
    })();
  }, []);

  const triggerBio = useCallback(async () => {
    try {
      // If no PIN has been saved yet, guide the user
      const stored = await SecureStore.getItemAsync(TX_PIN_KEY);
      if (!stored) {
        const { Alert } = require("react-native");
        Alert.alert(
          "Set up biometric shortcut",
          "Enter your PIN once manually and it will be saved for future biometric logins.",
        );
        return null;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify to pay",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });
      if (!result.success) return null;
      return stored;
    } catch {
      return null;
    }
  }, []);

  return { ready, icon, triggerBio };
}

/**
 * Bottom-sheet modal for transaction PIN entry.
 * 4-dot display + custom keypad.
 * The slot left of 0 shows a biometric button (fingerprint/face) once the user
 * has completed one manual PIN entry — no typing needed after that.
 */
export function TransactionPinModal({
  visible,
  onSubmit,
  onCancel,
  loading = false,
  title = "Enter Transaction PIN",
}) {
  const [pin, setPin] = useState("");
  const [showForgotPin, setShowForgotPin] = useState(false);
  const bio = useTxBiometric();

  // Reset on open
  useEffect(() => {
    if (visible) setPin("");
  }, [visible]);

  // Auto-submit on 4th digit + save pin for future biometric use
  useEffect(() => {
    if (pin.length === PIN_LEN && !loading) {
      // Save provisionally so biometric works next time
      SecureStore.setItemAsync(TX_PIN_KEY, pin).catch(() => {});
      onSubmit(pin);
    }
  }, [pin]);

  const handleKey = async (key) => {
    if (loading) return;
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
    } else if (key === "bio") {
      const storedPin = await bio.triggerBio();
      if (storedPin) {
        setPin(storedPin); // triggers the auto-submit effect above
      }
    } else if (key && pin.length < PIN_LEN) {
      setPin((p) => p + key);
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          Enter your 4-digit transaction PIN to confirm
        </Text>

        {/* 4 PIN dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        ) : (
          <View style={styles.keypadInner}>
            {ROWS.map((row, ri) => (
              <View key={ri} style={styles.keyRow}>
                {row.map((key, ki) => {
                  const isBio = key === "bio";
                  const isBack = key === "back";
                  const isHidden = isBio && !bio.ready;

                  return (
                    <TouchableOpacity
                      key={ki}
                      onPress={() => handleKey(key)}
                      disabled={isHidden}
                      style={[
                        styles.key,
                        isHidden && styles.keyInvisible,
                        isBack && styles.keyBack,
                        isBio && bio.ready && styles.keyBio,
                      ]}
                      activeOpacity={isHidden ? 1 : 0.45}
                    >
                      {isBack ? (
                        <Ionicons
                          name="backspace-outline"
                          size={24}
                          color={COLORS.danger}
                        />
                      ) : isBio && bio.ready ? (
                        <Ionicons
                          name={bio.icon}
                          size={28}
                          color={COLORS.primary}
                        />
                      ) : !isBio ? (
                        <Text style={styles.keyText}>{key}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowForgotPin(true)}
          style={styles.forgotPinBtn}
          disabled={loading}
        >
          <Text style={styles.forgotPinText}>Forgot PIN?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelBtn}
          disabled={loading}
        >
          <Text style={[styles.cancelText, loading && { opacity: 0.4 }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>

    <ForgotPinModal
      visible={showForgotPin}
      onClose={() => setShowForgotPin(false)}
      onSuccess={() => {
        // PIN was reset, user can now use the new PIN
        setPin("");
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    ...SHADOW.md,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 28,
  },
  dot: { width: 24, height: 24, borderRadius: 12 },
  dotEmpty: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: COLORS.primary },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 14,
  },
  loadingText: { fontSize: 14, color: COLORS.muted },
  keypadInner: {},
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  key: {
    flex: 1,
    height: 58,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keyInvisible: { backgroundColor: "transparent", borderWidth: 0 },
  keyBack: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  keyBio: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "700", color: COLORS.muted },
  forgotPinBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  forgotPinText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
