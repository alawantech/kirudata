import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
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
  placeholder = "Enter password",
  autoFocus = false,
  forceOpenKey = 0,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const isValid = value.length >= MIN_LENGTH;

  useEffect(() => {
    if (autoFocus || forceOpenKey > 0) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [autoFocus, forceOpenKey]);

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.primary],
  });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.surface, "#fff"],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.inputRow,
          { borderColor, backgroundColor: bgColor },
          focused && styles.inputRowActive,
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrapper,
            { backgroundColor: focused ? "#eff6ff" : COLORS.surface },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={focused ? COLORS.primary : COLORS.subtle}
            style={styles.icon}
          />
        </Animated.View>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.subtle}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          keyboardType="default"
          textContentType="newPassword"
          importantForAutofill="no"
          blurOnSubmit={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="done"
          onSubmitEditing={onAction}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={focused ? COLORS.primary : COLORS.subtle}
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.hint,
          { opacity: value.length > 0 ? 1 : 0.6 },
        ]}
      >
        <Text style={styles.hintText}>
          {value.length === 0
            ? "Minimum 8 digits"
            : value.length < MIN_LENGTH
            ? `${value.length} / ${MIN_LENGTH} digits`
            : "\u2713 Password ready"}
        </Text>
      </Animated.View>

      <TouchableOpacity
        onPress={onAction}
        disabled={actionLoading || !isValid}
        style={[
          styles.actionBtn,
          (actionLoading || !isValid) && styles.actionBtnDisabled,
          isValid && styles.actionBtnReady,
        ]}
        activeOpacity={0.9}
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
    paddingHorizontal: 4,
    height: 58,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  inputRowActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  icon: { marginRight: 0 },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.black,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  eyeBtn: { marginLeft: 8, padding: 8 },
  hint: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.subtle,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.subtle,
  },
  actionBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  actionBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnReady: {
    backgroundColor: "#0ea5e9",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  spinner: {
    width: 20,
    height: 20,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: 10,
  },
});