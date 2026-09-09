import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import client from "../../api/client";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

function fmt(n) {
  if (n == null) return "₦0.00";
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

export default function ReferralScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [stats, setStats] = useState(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const [transferAmount, setTransferAmount] = useState("");

  const fetchStats = async () => {
    try {
      const res = await client.get("/user/referral");
      setStats(res.data.data?.referral || null);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load referral stats" });
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, []));

  const copyCode = async () => {
    if (!stats?.referralCode) return;
    await Clipboard.setStringAsync(stats.referralCode);
    Toast.show({ type: "success", text1: "Referral code copied!" });
  };

  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return Toast.show({ type: "error", text1: "Enter a valid amount" });
    if (stats && amt > stats.refWallet) return Toast.show({ type: "error", text1: "Insufficient referral balance" });

    setTransferring(true);
    try {
      await client.post("/user/referral/transfer", { amount: amt });
      Toast.show({ type: "success", text1: "Transfer successful!" });
      setTransferAmount("");
      fetchStats();
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Transfer failed" });
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0f172a", "#1e3a8a", "#4f46e5"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referrals</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.referralCount || 0}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{fmt(stats?.totalEarned || 0)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{fmt(stats?.refWallet || 0)}</Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchStats} tintColor={COLORS.primary} />}
      >
        {/* Referral Code Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Referral Code</Text>
          <Text style={styles.cardSubtitle}>Share your phone number with friends. When they register and fund their wallet, you earn {stats?.bonusPercent || 0}% of their first deposit.</Text>
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{stats?.referralCode || "N/A"}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transfer to Main Balance */}
        {stats?.refWallet > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transfer to Main Balance</Text>
            <Text style={styles.cardSubtitle}>Move your referral earnings to your main wallet.</Text>
            <View style={styles.transferRow}>
              <TextInput
                style={styles.transferInput}
                placeholder="Amount"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={transferAmount}
                onChangeText={setTransferAmount}
              />
              <TouchableOpacity
                style={[styles.transferBtn, (!transferAmount || transferring) && { opacity: 0.5 }]}
                onPress={handleTransfer}
                disabled={!transferAmount || transferring}
              >
                {transferring ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="swap-horizontal" size={16} color="#fff" />
                    <Text style={styles.transferBtnText}>Transfer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Referrals */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Referrals</Text>
          {stats?.recentReferrals?.length > 0 ? (
            stats.recentReferrals.map((ref, i) => (
              <View key={i} style={styles.referralRow}>
                <View style={styles.referralAvatar}>
                  <Text style={styles.referralInitial}>{(ref.firstname || "?")[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.referralName}>{ref.firstname} {ref.lastname}</Text>
                  <Text style={styles.referralDate}>{new Date(ref.regDate).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.referralWallet}>{fmt(ref.wallet || 0)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No referrals yet. Share your code!</Text>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 2 },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  card: { backgroundColor: "#fff", borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", ...SHADOW.sm },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.black, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: COLORS.subtle, marginBottom: 12, lineHeight: 17 },
  codeRow: { flexDirection: "row", gap: 8 },
  codeBox: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  codeText: { fontSize: 16, fontWeight: "900", color: COLORS.primary, letterSpacing: 1 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 12 },
  copyBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  transferRow: { flexDirection: "row", gap: 8 },
  transferInput: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: RADIUS.md, padding: 12, fontSize: 15, fontWeight: "600", borderWidth: 1, borderColor: "#e2e8f0", color: COLORS.black },
  transferBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16 },
  transferBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  referralRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  referralAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + "15", alignItems: "center", justifyContent: "center" },
  referralInitial: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  referralName: { fontSize: 13, fontWeight: "700", color: COLORS.black },
  referralDate: { fontSize: 11, color: COLORS.subtle },
  referralWallet: { fontSize: 13, fontWeight: "800", color: COLORS.success },
  emptyText: { fontSize: 13, color: COLORS.subtle, textAlign: "center", paddingVertical: 16 },
});
