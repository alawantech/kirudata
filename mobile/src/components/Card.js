import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";

export function Card({ children, style, padded = true }) {
  return (
    <View style={[styles.card, padded && styles.padded, SHADOW.sm, style]}>
      {children}
    </View>
  );
}

export function SectionHeader({ title, action, actionLabel }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && actionLabel ? (
        <Text onPress={action} style={styles.sectionAction}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

export function Badge({ label, color = COLORS.primary }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  padded: { padding: 16 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.black,
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
});
