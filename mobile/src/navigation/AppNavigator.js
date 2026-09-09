import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

// Auth screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// App screens
import HomeScreen from "../screens/home/HomeScreen";
import ServicesScreen from "../screens/services/ServicesScreen";
import DataScreen from "../screens/services/DataScreen";
import AirtimeScreen from "../screens/services/AirtimeScreen";
import CableScreen from "../screens/services/CableScreen";
import ElectricityScreen from "../screens/services/ElectricityScreen";
import ExamScreen from "../screens/services/ExamScreen";
import Airtime2CashScreen from "../screens/services/Airtime2CashScreen";
import SmsScreen from "../screens/services/SmsScreen";
import DataCardScreen from "../screens/services/DataCardScreen";
import RechargeCardScreen from "../screens/services/RechargeCardScreen";
import FundWalletScreen from "../screens/wallet/FundWalletScreen";
import TransactionsScreen from "../screens/transactions/TransactionsScreen";
import TransactionReceiptScreen from "../screens/transactions/TransactionReceiptScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import ChangePasswordScreen from "../screens/profile/ChangePasswordScreen";
import ChangePinScreen from "../screens/profile/ChangePinScreen";
import ReferralScreen from "../screens/profile/ReferralScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ─── Auth Stack ─────────────────────────────────────────── */
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "fade" }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

/* ─── Tab icon helper ─────────────────────────────────────── */
function TabIcon({ name, focused, color, badge }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={name} size={22} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Services Stack (inside tabs) ───────────────────────── */
function ServicesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesList" component={ServicesScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Airtime" component={AirtimeScreen} />
      <Stack.Screen name="Cable" component={CableScreen} />
      <Stack.Screen name="Electricity" component={ElectricityScreen} />
      <Stack.Screen name="Exam" component={ExamScreen} />
      <Stack.Screen name="Airtime2Cash" component={Airtime2CashScreen} />
      <Stack.Screen name="Sms" component={SmsScreen} />
      <Stack.Screen name="DataCard" component={DataCardScreen} />
      <Stack.Screen name="RechargeCard" component={RechargeCardScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
    </Stack.Navigator>
  );
}

/* ─── Home Stack ──────────────────────────────────────────── */
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Airtime" component={AirtimeScreen} />
      <Stack.Screen name="Cable" component={CableScreen} />
      <Stack.Screen name="Electricity" component={ElectricityScreen} />
      <Stack.Screen name="Exam" component={ExamScreen} />
      <Stack.Screen name="Airtime2Cash" component={Airtime2CashScreen} />
      <Stack.Screen name="Sms" component={SmsScreen} />
      <Stack.Screen name="DataCard" component={DataCardScreen} />
      <Stack.Screen name="RechargeCard" component={RechargeCardScreen} />
      <Stack.Screen name="FundWallet" component={FundWalletScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
    </Stack.Navigator>
  );
}

/* ─── Profile Stack ───────────────────────────────────────── */
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ChangePin" component={ChangePinScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
    </Stack.Navigator>
  );
}

/* ─── App Root Stack (tabs + global Receipt) ──────────────── */
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={AppTabs} />
      <Stack.Screen name="Receipt" component={TransactionReceiptScreen} />
    </Stack.Navigator>
  );
}

/* ─── Bottom Tab Navigator ────────────────────────────────── */
function AppTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + 10;
  const tabBarHeight = 56 + bottomPad;
  const [whatsapp, setWhatsapp] = useState(null);

  useEffect(() => {
    client
      .get("/public/settings")
      .then((r) => {
        const s = r.data?.data?.settings;
        const num = s?.whatsapp || s?.phone;
        if (num) setWhatsapp(num);
      })
      .catch(() => {});
  }, []);

  const openWhatsApp = () => {
    if (!whatsapp) return;
    const num = whatsapp.replace(/\D/g, "");
    const fullNum = num.startsWith("234") ? num : "234" + num.replace(/^0/, "");
    Linking.openURL(`https://wa.me/${fullNum}`).catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomPad,
            paddingTop: 8,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtle,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home: focused ? "home" : "home-outline",
            Services: focused ? "grid" : "grid-outline",
            Wallet: focused ? "wallet" : "wallet-outline",
            Transactions: focused ? "receipt" : "receipt-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return (
            <TabIcon name={icons[route.name]} focused={focused} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Services" component={ServicesStack} />
      <Tab.Screen
        name="Wallet"
        component={FundWalletScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.walletTab, focused && styles.walletTabActive]}>
              <LinearGradient
                colors={
                  focused ? ["#4f46e5", "#6366f1"] : ["#e0e7ff", "#e0e7ff"]
                }
                style={styles.walletGradient}
              >
                <Ionicons
                  name="wallet"
                  size={22}
                  color={focused ? "#fff" : COLORS.primary}
                />
              </LinearGradient>
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.tabLabel,
                { color: focused ? COLORS.primary : COLORS.subtle },
              ]}
            >
              Fund
            </Text>
          ),
        }}
      />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>

    {/* Floating WhatsApp button */}
    {whatsapp ? (
      <TouchableOpacity
        onPress={openWhatsApp}
        activeOpacity={0.85}
        style={[styles.whatsappBtn, { bottom: tabBarHeight + 8 }]}
      >
        <Ionicons name="logo-whatsapp" size={26} color="#fff" />
      </TouchableOpacity>
    ) : null}
    </View>
  );
}

/* ─── Root Navigator (auth gate) ─────────────────────────── */
export { AuthStack, AppStack };

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    ...SHADOW.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  walletTab: {
    marginTop: -14,
    ...SHADOW.md,
  },
  walletTabActive: {},
  walletGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  whatsappBtn: {
    position: "absolute",
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.lg,
    shadowColor: "#25D366",
    zIndex: 10,
  },
});
