import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // primary | outline | ghost | danger
  size = "md", // sm | md | lg
  icon,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  const heights = { sm: 40, md: 52, lg: 58 };
  const fontSizes = { sm: 13, md: 15, lg: 16 };
  const h = heights[size];
  const fs = fontSizes[size];

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.base, { opacity: isDisabled ? 0.6 : 1 }, style]}
      >
        <LinearGradient
          colors={["#4f46e5", "#6366f1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { height: h, borderRadius: h / 2 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.row}>
              {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
              <Text style={[styles.primaryText, { fontSize: fs }, textStyle]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "danger") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.base,
          {
            backgroundColor: COLORS.danger,
            height: h,
            borderRadius: h / 2,
            opacity: isDisabled ? 0.6 : 1,
          },
          SHADOW.sm,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[styles.primaryText, { fontSize: fs }, textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === "outline") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.base,
          {
            height: h,
            borderRadius: h / 2,
            borderWidth: 1.5,
            borderColor: COLORS.primary,
            backgroundColor: "transparent",
            opacity: isDisabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
            <Text style={[styles.outlineText, { fontSize: fs }, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        {
          opacity: isDisabled ? 0.6 : 1,
          alignItems: "center",
          justifyContent: "center",
          height: h,
        },
        style,
      ]}
    >
      <Text
        style={[
          { color: COLORS.primary, fontWeight: "700", fontSize: fs },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradient: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  outlineText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
