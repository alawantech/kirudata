import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";

/**
 * "USSD Enquiry" call-to-action card — reuse anywhere users may want the
 * USSD codes list. Navigates to the `UssdCodes` screen.
 */
export function UssdEnquiryRow({
  onPress,
  title = "USSD Enquiry",
  subtitle = "Check data balance and more",
}) {
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name="keypad" size={20} color={COLORS.primary} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...SHADOW.sm,
  },
  text: { flex: 1 },
  title: {
    fontSize: 14.5,
    fontWeight: "800",
    color: COLORS.black,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },
});
