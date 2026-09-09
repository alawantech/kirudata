import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import { useBiometric } from "../../hooks/useBiometric";
import { Card } from "../../components/Card";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import client from "../../api/client";

function MenuItem({ icon, label, sub, onPress, danger = false, badge }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.menuItem}
    >
      <View
        style={[
          styles.menuIcon,
          {
            backgroundColor: danger
              ? COLORS.danger + "15"
              : COLORS.primary + "15",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? COLORS.danger : COLORS.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>
          {label}
        </Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const biometric = useBiometric();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [bioToggling, setBioToggling] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    client
      .get("/public/settings")
      .then((r) => {
        const s = r.data?.data?.settings;
        setWhatsappNumber(s?.whatsapp || s?.phone || "");
      })
      .catch(() => {});
  }, []);

  const handleBiometricToggle = async (value) => {
    if (value) {
      Alert.alert(
        `Enable ${biometric.label} Login`,
        `Sign out and sign back in — you'll be offered to enable ${biometric.label} after logging in with your password.`,
        [{ text: "Got it" }],
      );
    } else {
      Alert.alert(
        `Disable ${biometric.label} Login`,
        "You'll need to use your password to sign in.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              setBioToggling(true);
              try {
                await biometric.disableBiometric();
                Toast.show({
                  type: "success",
                  text1: `${biometric.label} login disabled`,
                });
              } finally {
                setBioToggling(false);
              }
            },
          },
        ],
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLogoutLoading(true);
          try {
            await logout();
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") || "User";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accountAge = user?.memberSince
    ? `Member since ${new Date(user.memberSince).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}`
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#0f172a", "#1e3a8a", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.circle1} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
          {accountAge ? <Text style={styles.age}>{accountAge}</Text> : null}

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Ionicons
                name="call-outline"
                size={14}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.statText}>{user?.phone || "N/A"}</Text>
            </View>
            {user?.accountReference && (
              <View style={styles.stat}>
                <Ionicons
                  name="card-outline"
                  size={14}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.statText}>
                  Ref: {user.accountReference}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 12 }}>
          {/* Security section */}
          {biometric.isSupported && biometric.isEnrolled && (
            <Card>
              <Text style={styles.sectionLabel}>SECURITY</Text>
              <View style={styles.menuItem}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: COLORS.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name={biometric.iconName}
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{biometric.label} Login</Text>
                  <Text style={styles.menuSub}>
                    {biometric.isEnabled
                      ? `Sign in with your ${biometric.label}`
                      : `Use ${biometric.label} instead of password`}
                  </Text>
                </View>
                <Switch
                  value={biometric.isEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={bioToggling}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.primary + "80",
                  }}
                  thumbColor={biometric.isEnabled ? COLORS.primary : "#f4f3f4"}
                />
              </View>
            </Card>
          )}

          {/* Account section */}
          <Card>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              sub="Update your personal info"
              onPress={() => Toast.show({ type: "info", text1: "Coming soon" })}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="lock-closed-outline"
              label="Change Password"
              sub="Keep your account secure"
              onPress={() => navigation.navigate("ChangePassword")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="finger-print-outline"
              label="Change Transaction PIN"
              sub="Update your PIN"
              onPress={() => navigation.navigate("ChangePin")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="people-outline"
              label="Referrals"
              sub="Invite friends & earn rewards"
              onPress={() => navigation.navigate("Referral")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              sub="Manage your alerts"
              onPress={() => navigation.navigate("Notifications")}
            />
          </Card>

          {/* Wallet section */}
          <Card>
            <Text style={styles.sectionLabel}>WALLET</Text>
            <MenuItem
              icon="wallet-outline"
              label="Fund Wallet"
              sub="Add money to your balance"
              onPress={() => navigation.navigate("FundWallet")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="receipt-outline"
              label="Transactions"
              sub="View your transaction history"
              onPress={() => navigation.getParent()?.navigate("Transactions")}
            />
          </Card>

          {/* Support section */}
          <Card>
            <Text style={styles.sectionLabel}>SUPPORT</Text>
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              sub="Chat with us on WhatsApp"
              onPress={() => {
                if (whatsappNumber) {
                  const num = whatsappNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
                  Linking.openURL(`https://wa.me/234${num}`);
                } else {
                  Toast.show({ type: "info", text1: "Support not available yet" });
                }
              }}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="document-text-outline"
              label="Terms & Conditions"
              onPress={() => Linking.openURL("https://kirudata.com/terms")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL("https://kirudata.com/privacy")}
            />
          </Card>

          {/* Logout */}
          <Card>
            {logoutLoading ? (
              <ActivityIndicator
                color={COLORS.danger}
                style={{ padding: 16 }}
              />
            ) : (
              <MenuItem
                icon="log-out-outline"
                label="Sign Out"
                danger
                onPress={handleLogout}
              />
            )}
          </Card>

          {/* Version */}
          <Text style={styles.version}>Kiru Data v1.0.0</Text>
          <Text style={styles.credit}>
            Developed by{" "}
            <Text
              style={styles.creditLink}
              onPress={() => Linking.openURL("https://zedrotech.com")}
            >
              ZEDROTECH
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
  },
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -60,
    right: -60,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  email: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  age: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 12 },
  statRow: { flexDirection: "row", gap: 16 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.subtle,
    letterSpacing: 1,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 1,
  },
  menuSub: { fontSize: 12, color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.border },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.subtle,
    marginTop: 4,
  },
  credit: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.subtle,
    marginTop: 2,
  },
  creditLink: {
    color: COLORS.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
