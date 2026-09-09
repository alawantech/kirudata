import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "biometric_enabled";
const BIOMETRIC_CREDENTIALS_KEY = "biometric_credentials";

export function useBiometric() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(null); // "fingerprint" | "face" | "iris"

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible);
      setIsEnrolled(enrolled);

      if (compatible && enrolled) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        // Priority: fingerprint first, then face ID, then iris
        if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType("fingerprint");
        } else if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricType("face");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.IRIS)
        ) {
          setBiometricType("iris");
        }
      }

      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(enabled === "true");
    } catch {
      setIsSupported(false);
    }
  };

  /** Call this after a successful password login to save credentials */
  const saveCredentials = async (identifier, password) => {
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify({ identifier, password }),
      );
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setIsEnabled(true);
      return true;
    } catch {
      return false;
    }
  };

  /** Disable biometric login and clear stored credentials */
  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false");
      setIsEnabled(false);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Prompt the biometric scanner.
   * Returns { success: true, identifier, password } on success, or { success: false, error }
   */
  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity",
        fallbackLabel: "Enter app password",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!raw) {
        return {
          success: false,
          error: "no_credentials",
          message: "No saved credentials found. Please log in with password.",
        };
      }

      const { identifier, password } = JSON.parse(raw);
      return { success: true, identifier, password };
    } catch (err) {
      return { success: false, error: "unknown", message: err.message };
    }
  }, []);

  const iconName = biometricType === "face" ? "scan" : "finger-print";
  const label =
    biometricType === "face"
      ? "Face ID"
      : biometricType === "iris"
        ? "Iris Scan"
        : "Fingerprint";

  return {
    isSupported,
    isEnrolled,
    isEnabled,
    biometricType,
    iconName,
    label,
    checkAvailability,
    saveCredentials,
    disableBiometric,
    authenticate,
  };
}
