import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";

const NETWORK_PREFIXES = {
  MTN: ["0703", "0706", "0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916"],
  Airtel: ["0701", "0708", "0802", "0808", "0812", "0902", "0907", "0908", "0912"],
  Glo: ["0705", "0805", "0807", "0811", "0815", "0905", "0915"],
  "9mobile": ["0809", "0817", "0818", "0909", "0908"],
};

function detectNetwork(phone) {
  if (!phone || phone.length < 4) return null;
  const prefix = phone.slice(0, 4);
  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return network;
  }
  return null;
}

/**
 * Phone number input with a contact-picker button on the right.
 * Tapping the person-add icon shows a rationale dialog, then requests
 * contacts permission at runtime. If granted, opens the contact picker.
 * If denied, the user can still type the number manually.
 */
export function PhoneInput({
  label,
  value,
  onChangeText,
  placeholder,
  style,
  error,
}) {
  const [focused, setFocused] = useState(false);

  const pickContact = async () => {
    try {
      // On Android, request permission at runtime with a user-friendly rationale
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: "Contacts Access",
            message:
              "Kiru Data needs access to your contacts so you can pick a phone number directly. This is optional — you can type the number manually instead.",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return; // User denied — no alert, they can type manually
        }
      } else {
        // iOS: expo-contacts handles its own permission dialog
        const Contacts = require("expo-contacts");
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Contacts Access Needed",
            "Please enable contacts access in Settings to pick a phone number from your contacts.",
          );
          return;
        }
      }

      // Dynamically import expo-contacts only after permission is granted
      const Contacts = require("expo-contacts");
      const result = await Contacts.presentContactPickerAsync();
      if (!result || !result.phoneNumbers?.length) return;

      // Pick the first number; strip spaces, dashes, brackets
      const raw = result.phoneNumbers[0].number || "";
      const cleaned = raw.replace(/[\s\-().+]/g, "");
      // Normalise Nigerian numbers: +234XXXXXXXXXX → 0XXXXXXXXXX
      const normalised = cleaned.startsWith("234")
        ? "0" + cleaned.slice(3)
        : cleaned;

      onChangeText(normalised);
    } catch {
      // User dismissed picker — no action needed
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.container,
          focused && styles.focused,
          error && styles.errored,
        ]}
      >
        {/* Phone icon on the left */}
        <View style={styles.iconLeft}>
          <Ionicons name="call-outline" size={18} color={COLORS.subtle} />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || "Enter phone number"}
          placeholderTextColor={COLORS.subtle}
          keyboardType="phone-pad"
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          maxLength={11}
        />

        {/* Contact picker button on the right */}
        <TouchableOpacity
          onPress={pickContact}
          style={styles.iconRight}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {value && value.length >= 4 && !error && (
        <View style={styles.networkBadge}>
          {detectNetwork(value) ? (
            <Text style={styles.networkDetected}>
              Network detected: <Text style={{ fontWeight: "800" }}>{detectNetwork(value)}</Text>{' '}
              <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
            </Text>
          ) : (
            <Text style={styles.networkUnknown}>Network not recognized — ported number?</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 52,
  },
  focused: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff",
  },
  errored: {
    borderColor: COLORS.danger,
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
    paddingVertical: 0,
  },
  iconRight: {
    marginLeft: 8,
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
  networkBadge: {
    marginTop: 4,
  },
  networkDetected: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
  networkUnknown: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
  },
});
