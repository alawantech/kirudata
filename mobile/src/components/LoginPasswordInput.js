import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";

const MIN_LENGTH = 8;

export function LoginPasswordInput({
  value = "",
  onChangeText,
  onAction,
  actionLabel = "Continue",
  actionLoading = false,
  placeholder = "Enter your password",
  autoFocus = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const isValid = value.length >= MIN_LENGTH;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputRow, focused && styles.inputRowActive]}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={focused ? COLORS.primary : COLORS.subtle}
          style={styles.icon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a1a1aa"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          minLength={MIN_LENGTH}
          autoFocus={autoFocus}
          keyboardType="default"
          textContentType="none"
          importantForAutofill="no"
          blurOnSubmit={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="done"
          onSubmitEditing={onAction}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.subtle}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {value.length === 0
          ? "Minimum 8 characters"
          : value.length < MIN_LENGTH
            ? `${value.length} / ${MIN_LENGTH} characters`
            : "\u2713 Password ready"}
      </Text>

      <TouchableOpacity
        onPress={onAction}
        disabled={actionLoading || !isValid}
        style={[
          styles.actionBtn,
          (actionLoading || !isValid) && styles.actionBtnDisabled,
        ]}
        activeOpacity={0.85}
      >
        {actionLoading ? (
          <View style={styles.loadingRow}>
            <View style={styles.spinner} />
            <Text style={styles.actionText}>Please wait...</Text>
          </View>
        ) : (
          <Text style={styles.actionText}>{actionLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff",
    ...SHADOW.sm,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.black,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  eyeBtn: { marginLeft: 8, padding: 4 },
  hint: {
    fontSize: 11,
    color: COLORS.subtle,
    marginTop: 6,
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  actionBtn: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spinner: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: 9,
  },
});
