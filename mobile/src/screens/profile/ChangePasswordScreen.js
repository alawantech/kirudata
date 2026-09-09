import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Header } from "../../components/Header";
import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function ChangePasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleChange = async () => {
    const { oldPassword, newPassword, confirmPassword } = form;
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "All fields are required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      Toast.show({
        type: "error",
        text1: "Password must be at least 8 characters",
      });
      return;
    }
    setLoading(true);
    try {
      await client.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      Toast.show({
        type: "success",
        text1: "Password changed successfully!",
      });
      await logout();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Change Password" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 120,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.tipBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={COLORS.info}
            />
            <Text style={styles.tipText}>
              Use a strong password with letters, numbers, and symbols for
              better security.
            </Text>
          </View>
          <Card>
            <Input
              label="Current Password"
              value={form.oldPassword}
              onChangeText={set("oldPassword")}
              placeholder="Enter current password"
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={COLORS.subtle}
                />
              }
            />
            <Input
              label="New Password"
              value={form.newPassword}
              onChangeText={set("newPassword")}
              placeholder="Enter new password"
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-open-outline"
                  size={18}
                  color={COLORS.subtle}
                />
              }
            />
            <Input
              label="Confirm New Password"
              value={form.confirmPassword}
              onChangeText={set("confirmPassword")}
              placeholder="Repeat new password"
              secureTextEntry
              icon={
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={COLORS.subtle}
                />
              }
              style={{ marginBottom: 0 }}
            />
          </Card>
          <Button
            title="Change Password"
            onPress={handleChange}
            loading={loading}
            size="lg"
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword", { returnTo: "profile" })}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.info + "15",
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.info + "30",
  },
  tipText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 18 },
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
