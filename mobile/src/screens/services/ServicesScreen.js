import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import client from "../../api/client";

const SERVICES = [
  {
    key: "Data",
    icon: "wifi",
    color: COLORS.data,
    label: "Data Bundle",
    desc: "Buy internet data for all networks",
    gradient: ["#eef2ff", "#e0e7ff"],
  },
  {
    key: "Airtime",
    icon: "call",
    color: COLORS.airtime,
    label: "Airtime",
    desc: "Recharge any network instantly",
    gradient: ["#fff7ed", "#ffedd5"],
  },
  {
    key: "Cable",
    icon: "tv",
    color: COLORS.cable,
    label: "Cable TV",
    desc: "DSTV, GOTV, StarTimes subscriptions",
    gradient: ["#f5f3ff", "#ede9fe"],
  },
  {
    key: "Electricity",
    icon: "flash",
    color: COLORS.electricity,
    label: "Electricity",
    desc: "Pay prepaid & postpaid electricity bills",
    gradient: ["#fffbeb", "#fef3c7"],
  },
  {
    key: "Exam",
    icon: "document-text",
    color: COLORS.exam,
    label: "Exam Pins",
    desc: "WAEC, NECO, JAMB, NABTEB result checkers",
    gradient: ["#ecfdf5", "#d1fae5"],
  },
  {
    key: "Airtime2Cash",
    icon: "swap-horizontal",
    color: COLORS.airtime2cash,
    label: "Airtime to Cash",
    desc: "Convert airtime to cash instantly",
    gradient: ["#ecfeff", "#cffafe"],
  },
  {
    key: "Sms",
    icon: "chatbubble-ellipses",
    color: COLORS.sms,
    label: "Bulk SMS",
    desc: "Send SMS to any number instantly",
    gradient: ["#f0f9ff", "#e0f2fe"],
  },
  {
    key: "DataCard",
    icon: "card",
    color: COLORS.datacard,
    label: "Data Card",
    desc: "KiruData scratch card pins",
    gradient: ["#f5f3ff", "#ede9fe"],
  },
  {
    key: "RechargeCard",
    icon: "phone-portrait",
    color: COLORS.rechargecard,
    label: "Recharge Card",
    desc: "KiruData airtime scratch cards",
    gradient: ["#f0fdf4", "#dcfce7"],
  },
];

export default function ServicesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bonusPercent, setBonusPercent] = useState(0);
  const pulse = new Animated.Value(1);

  useEffect(() => {
    client
      .get("/public/settings")
      .then((r) => {
        const pct = parseFloat(r.data?.data?.settings?.referralBonusPercent);
        if (!isNaN(pct)) setBonusPercent(pct);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.sub}>What would you like to do?</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral Promo Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate("Referral")}
          style={styles.promoWrap}
        >
          <LinearGradient
            colors={["#4f46e5", "#6366f1", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promo}
          >
            {/* Decorative blurred circles */}
            <View style={[styles.blob, { top: -30, right: -20, backgroundColor: "rgba(255,255,255,0.12)" }]} />
            <View style={[styles.blob, { bottom: -40, left: -20, backgroundColor: "rgba(255,255,255,0.08)" }]} />

            <View style={styles.promoContent}>
              {/* Gift icon badge */}
              <Animated.View style={[styles.giftBadge, { transform: [{ scale: pulse }] }]}>
                <Ionicons name="gift" size={30} color="#ffffff" />
              </Animated.View>

              <View style={styles.promoText}>
                <View style={styles.promoPercentRow}>
                  <Text style={styles.promoPercent}>{bonusPercent > 0 ? bonusPercent : "—"}</Text>
                  <Text style={styles.promoPercentSign}>%</Text>
                  <View style={styles.promoTag}>
                    <Text style={styles.promoTagText}>COMMISSION</Text>
                  </View>
                </View>
                <Text style={styles.promoTitle}>Refer & Earn</Text>
                <Text style={styles.promoDesc}>
                  Invite friends with your phone number. When they fund their wallet for the first time, you earn {bonusPercent > 0 ? bonusPercent : "0"}% commission instantly.
                </Text>
              </View>

              <View style={styles.promoArrow}>
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
              </View>
            </View>

            <View style={styles.promoFooter}>
              <Ionicons name="people" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.promoFooterText}>Share your code · Earn on every referral</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {SERVICES.map((svc, idx) => (
          <TouchableOpacity
            key={svc.key}
            onPress={() => navigation.navigate(svc.key)}
            activeOpacity={0.85}
            style={[styles.card, { marginTop: idx === 0 ? 4 : 0 }]}
          >
            <View style={styles.cardInner}>
              {/* Left color accent */}
              <View style={[styles.accentBar, { backgroundColor: svc.color }]} />

              {/* Icon container */}
              <View style={[styles.iconWrap, { backgroundColor: svc.gradient[0] }]}>
                <View style={[styles.iconInner, { backgroundColor: svc.color + "15" }]}>
                  <Ionicons name={svc.icon} size={26} color={svc.color} />
                </View>
              </View>

              {/* Text */}
              <View style={styles.textWrap}>
                <Text style={styles.label}>{svc.label}</Text>
                <Text style={styles.desc}>{svc.desc}</Text>
              </View>

              {/* Arrow */}
              <View style={[styles.arrowWrap, { backgroundColor: svc.color + "10" }]}>
                <Ionicons name="chevron-forward" size={16} color={svc.color} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  card: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    ...SHADOW.sm,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  iconInner: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  label: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 3,
  },
  desc: { fontSize: 12, color: COLORS.muted, lineHeight: 16 },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Referral Promo Card */
  promoWrap: {
    borderRadius: RADIUS.lg,
    ...SHADOW.md,
    marginTop: 4,
    overflow: "hidden",
  },
  promo: {
    padding: 18,
    borderRadius: RADIUS.lg,
  },
  blob: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  giftBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  promoText: { flex: 1 },
  promoPercentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  promoPercent: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 38,
  },
  promoPercentSign: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 6,
  },
  promoTag: {
    marginLeft: 8,
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  promoTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 2,
  },
  promoDesc: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    lineHeight: 16,
  },
  promoArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  promoFooterText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
});
