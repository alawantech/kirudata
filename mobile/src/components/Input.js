import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  icon,
  style,
  inputStyle,
  editable = true,
  multiline = false,
  numberOfLines,
  compact = false,
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isSecret = secureTextEntry;

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact, style]}>
      {label ? (
        <Text style={[styles.label, compact && styles.labelCompact]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          compact && styles.containerCompact,
          focused && styles.focused,
          error && styles.errored,
          !editable && styles.disabled,
        ]}
      >
        {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.subtle}
          secureTextEntry={isSecret && !showPw}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            compact && styles.inputCompact,
            icon ? { paddingLeft: 40 } : {},
            isSecret ? { paddingRight: 44 } : {},
            inputStyle,
          ]}
        />
        {isSecret ? (
          <TouchableOpacity
            onPress={() => setShowPw((v) => !v)}
            style={styles.iconRight}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPw ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.subtle}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  wrapperCompact: { marginBottom: 7 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.body,
    marginBottom: 5,
  },
  labelCompact: { fontSize: 11, marginBottom: 3 },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    minHeight: 52,
    position: "relative",
  },
  containerCompact: { minHeight: 42 },
  focused: { borderColor: COLORS.primary, backgroundColor: "#fff" },
  errored: { borderColor: COLORS.danger },
  disabled: { opacity: 0.6 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.black,
  },
  inputCompact: { paddingVertical: 8, fontSize: 13 },
  iconLeft: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  iconRight: {
    position: "absolute",
    right: 12,
    zIndex: 1,
  },
  error: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 2,
  },
});
