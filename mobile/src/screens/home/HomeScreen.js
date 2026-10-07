import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
  Linking,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useAuth } from "../../context/AuthContext";
import client, { API_BASE } from "../../api/client";
import { useExitConfirm } from "../../hooks/useExitConfirm";

const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../../assets/logo-gsub.png");
import { Badge } from "../../components/Card";
import { ForcedPinModal } from "../../components/ForcedPinModal";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import * as Clipboard from "expo-clipboard";

const { width: SW } = Dimensions.get("window");
// 2 cards side by side, fill full width with small gap
const ACC_CARD_W = Math.floor((SW - 32 - 8) / 2);

const SERVICES = [
  {
    key: "Data",
    icon: "globe-outline",
    color: "#4f46e5",
    label: "Data",
    gradient: ["#eef2ff", "#e0e7ff"],
  },
  {
    key: "Airtime",
    icon: "phone-portrait-outline",
    color: "#f97316",
    label: "Airtime",
    gradient: ["#fff7ed", "#ffedd5"],
  },
  {
    key: "Cable",
    icon: "tv-outline",
    color: "#8b5cf6",
    label: "Cable TV",
    gradient: ["#f5f3ff", "#ede9fe"],
  },
  {
    key: "Electricity",
    icon: "bulb-outline",
    color: "#d97706",
    label: "Electricity",
    gradient: ["#fffbeb", "#fef3c7"],
  },
  {
    key: "Exam",
    icon: "school-outline",
    color: "#059669",
    label: "Exam Pin",
    gradient: ["#ecfdf5", "#d1fae5"],
  },
  {
    key: "DataCard",
    icon: "barcode-outline",
    color: "#e11d48",
    label: "Data Card",
    gradient: ["#fff1f2", "#ffe4e6"],
  },
  {
    key: "RechargeCard",
    icon: "card-outline",
    color: "#16a34a",
    label: "Airtime Card",
    gradient: ["#f0fdf4", "#dcfce7"],
  },
  {
    key: "Sms",
    icon: "chatbubbles-outline",
    color: "#0891b2",
    label: "Bulk SMS",
    gradient: ["#ecfeff", "#cffafe"],
  },
  {
    key: "Airtime2Cash",
    icon: "repeat-outline",
    color: "#dc2626",
    label: "Airtime to Cash",
    gradient: ["#fef2f2", "#fecaca"],
  },
  {
    key: "FundWallet",
    icon: "wallet-outline",
    color: "#4f46e5",
    label: "Add Funds",
    gradient: ["#eef2ff", "#e0e7ff"],
    navigateTo: "FundWallet",
  },
  {
    key: "Transactions",
    icon: "receipt-outline",
    color: "#6366f1",
    label: "History",
    gradient: ["#eef2ff", "#e0e7ff"],
    tab: "Transactions",
  },
];

function fmt(n) {
  if (n == null) return "₦0.00";
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function statusColor(status) {
  if (status == null) return COLORS.subtle;
  if (status === 1) return COLORS.success;
  if (status === 2) return COLORS.warning;
  return COLORS.danger;
}
function statusLabel(status) {
  if (status === 1) return "Success";
  if (status === 2) return "Processing";
  if (status === 0) return "Failed";
  return String(status ?? "N/A");
}

function TransactionItem({ item }) {
  const color = statusColor(item.status);
  const icon =
    item.status === 1
      ? "checkmark-circle"
      : item.status === 2
        ? "time"
        : "close-circle";
  return (
    <View style={txStyles.row}>
      <View style={[txStyles.iconBox, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={txStyles.desc} numberOfLines={1}>
          {item.servicedesc || item.servicename || "Transaction"}
        </Text>
        <Text style={txStyles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[txStyles.amount, { color: COLORS.text }]}>
          {fmt(Math.abs(Number(item.amount)))}
        </Text>
        <Badge
          label={statusLabel(item.status)}
          color={statusColor(item.status)}
        />
      </View>
    </View>
  );
}

const txStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  desc: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 2,
  },
  date: { fontSize: 11, color: COLORS.subtle },
  amount: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
});

export default function HomeScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  useExitConfirm(); // Show "Exit app?" when back is pressed from here

  const [wallet, setWallet] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [banners, setBanners] = useState([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [bonusPercent, setBonusPercent] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const bannerRef = useRef(null);
  const bannerTimerRef = useRef(null);
  const accPollTimerRef = useRef(null);
  const accPollCountRef = useRef(0);

  // Load logo — read from cache first, then refresh from server
  useFocusEffect(
    useCallback(() => {
      const normaliseUrl = (url) => {
        if (!url) return null;
        try {
          const apiOrigin = new URL(API_BASE).origin;
          const parsed = new URL(url);
          if (parsed.origin !== apiOrigin) {
            return apiOrigin + parsed.pathname + parsed.search;
          }
          return url;
        } catch {
          return url;
        }
      };

      AsyncStorage.getItem(LOGO_CACHE_KEY).then((cached) => {
        if (cached) setLogoUrl(normaliseUrl(cached));
      });
      client
        .get("/public/settings")
        .then((r) => {
          const settings = r.data?.data?.settings;
          const raw = settings?.logoUrl;
          const url = normaliseUrl(raw);
          if (url) {
            setLogoUrl(url);
            AsyncStorage.setItem(LOGO_CACHE_KEY, url);
          }
          const pct = parseFloat(settings?.referralBonusPercent);
          if (!isNaN(pct)) setBonusPercent(pct);
        })
        .catch(() => {});
    }, []),
  );

  // Continuous pulsing animation for the referral promo gift badge
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const fetchDashboard = async () => {
    try {
      const [walletRes, txRes, accRes, bannerRes] = await Promise.all([
        client.get("/user/wallet"),
        client.get("/user/transactions?page=1"),
        client.get("/user/virtual-accounts").catch(() => ({ data: {} })),
        client.get("/public/banners").catch(() => ({ data: {} })),
      ]);
      setWallet(walletRes.data.data.wallet ?? 0);
      setRecentTx(txRes.data.data?.transactions || []);
      const accData = accRes.data.data || {};
      setAccounts(accData.accounts || []);
      setBanners(bannerRes.data.data?.banners || []);
      // Auto-refetch while dedicated accounts are still being generated
      if (accData.pending && accPollCountRef.current < 8) {
        accPollCountRef.current += 1;
        clearTimeout(accPollTimerRef.current);
        accPollTimerRef.current = setTimeout(fetchDashboard, 3000);
      } else if (!accData.pending) {
        accPollCountRef.current = 0;
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load dashboard" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      return () => clearTimeout(accPollTimerRef.current);
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
    refreshUser().catch(() => {});
  };

  // Auto-scroll banners every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    bannerTimerRef.current = setInterval(() => {
      setActiveBannerIdx((prev) => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToOffset({ offset: next * SW, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(bannerTimerRef.current);
  }, [banners.length]);

  const onBannerScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setActiveBannerIdx(idx);
  };

  const goService = (svc) => {
    if (svc.navigateTo) {
      navigation.navigate(svc.navigateTo);
      return;
    }
    if (svc.tab) {
      navigation.navigate(svc.tab);
      return;
    }
    navigation.navigate(svc.key);
  };

  const handleSetPin = async (newPin) => {
    setPinLoading(true);
    try {
      await client.post("/user/pin", { newPin });
      await refreshUser();
      Toast.show({ type: "success", text1: "Transaction PIN set successfully!" });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Failed to set PIN",
      });
    } finally {
      setPinLoading(false);
    }
  };

  const userName = user?.firstname || "User";
  const notifCount = 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ─── Header Gradient ─────────────────────────────── */}
        <LinearGradient
          colors={["#0f172a", "#1e3a8a", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          {/* Top row */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.homeLogoCont}>
                <Image
                  source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
                  style={styles.homeLogo}
                  resizeMode="contain"
                  onError={() => setLogoUrl(null)}
                />
              </View>
              <View>
                <Text style={styles.greet}>Good day, 👋</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
                style={styles.iconBtn}
              >
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {notifCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {notifCount > 9 ? "9+" : notifCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletTop}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <TouchableOpacity
                onPress={() => setBalanceHidden((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={balanceHidden ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.balance}>
                {balanceHidden ? "₦ ****" : fmt(wallet ?? 0)}
              </Text>
            )}
            <View style={styles.walletBottom}>
              <View style={styles.walletStat}>
                <Ionicons
                  name="trending-up-outline"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.walletStatText}>
                  Ref Bonus: {fmt(user?.refWallet ?? 0)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.fundBtn}
                onPress={() => navigation.navigate("FundWallet")}
              >
                <Ionicons name="add" size={14} color={COLORS.primary} />
                <Text style={styles.fundBtnText}>Fund</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Virtual Account Numbers – compact strip inside header */}
          {accounts.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <View style={styles.accHeaderRow}>
                <Text style={styles.accHeaderLabel}>Virtual Accounts</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("FundWallet")}
                >
                  <Text style={styles.accHeaderAction}>Fund wallet →</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {accounts.map((acc, i) => (
                  <View key={i} style={styles.accCard}>
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.18)",
                        "rgba(255,255,255,0.08)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.accGrad}
                    >
                      <View style={styles.accTop}>
                        <Ionicons
                          name="business"
                          size={12}
                          color="rgba(255,255,255,0.8)"
                        />
                        <Text style={styles.accBankName} numberOfLines={1}>
                          {acc.bankName}
                        </Text>
                      </View>
                      <Text style={styles.accNumber} numberOfLines={1}>
                        {acc.accountNumber || acc.number || ""}
                      </Text>
                      <View style={styles.accBottom}>
                        <Text style={styles.accName} numberOfLines={1}>
                          {acc.accountName || acc.name || "Virtual Account"}
                        </Text>
                        <TouchableOpacity
                          style={styles.accCopyBtn}
                          onPress={async () => {
                            await Clipboard.setStringAsync(
                              acc.accountNumber || acc.number || "",
                            );
                            Toast.show({ type: "success", text1: "Copied!" });
                          }}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={11}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.accOrb1} />
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </View>
          )}
        </LinearGradient>

        {/* ── Promotional Banners ────────────────────────────────────────── */}
        {banners.length > 0 && (
          <View style={{ paddingTop: 14 }}>
            <FlatList
              ref={bannerRef}
              data={banners}
              keyExtractor={(item) => String(item.id)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onBannerScroll}
              getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={item.link ? 0.8 : 1}
                  onPress={() => {
                    if (item.link) {
                      try { Linking.openURL(item.link); } catch {}
                    }
                  }}
                  style={{ width: SW, paddingHorizontal: 16 }}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{
                      width: SW - 32,
                      height: 140,
                      borderRadius: RADIUS.lg,
                      backgroundColor: "#e2e8f0",
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
            {banners.length > 1 && (
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
                {banners.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === activeBannerIdx ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === activeBannerIdx ? COLORS.primary : "#cbd5e1",
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Services")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesGrid}>
            {SERVICES.map((svc) => (
              <TouchableOpacity
                key={svc.key}
                onPress={() => goService(svc)}
                activeOpacity={0.7}
                style={styles.serviceCard}
              >
                <View
                  style={[
                    styles.serviceIconWrap,
                    { backgroundColor: svc.gradient[0] },
                  ]}
                >
                  <View
                    style={[
                      styles.serviceIconInner,
                      { backgroundColor: svc.color + "12" },
                    ]}
                  >
                    <Ionicons name={svc.icon} size={26} color={svc.color} />
                  </View>
                </View>
                <Text style={styles.serviceLabel} numberOfLines={1}>
                  {svc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
              <View style={[styles.promoBlob, { top: -30, right: -20, backgroundColor: "rgba(255,255,255,0.12)" }]} />
              <View style={[styles.promoBlob, { bottom: -40, left: -20, backgroundColor: "rgba(255,255,255,0.08)" }]} />

              <View style={styles.promoContent}>
                <Animated.View style={[styles.promoGift, { transform: [{ scale: pulse }] }]}>
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
                  <Text style={styles.promoTitle}>Refer &amp; Earn</Text>
                  <Text style={styles.promoDesc}>
                    Share your phone number. When friends fund their wallet for the first time, you earn {bonusPercent > 0 ? bonusPercent : "0"}% instantly.
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
        </View>
      </ScrollView>

      <ForcedPinModal
        visible={!!(user && !user.pinEnabled)}
        onSubmit={handleSetPin}
        loading={pinLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
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
  circle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -40,
    left: -30,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greet: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  userName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  homeLogoCont: {
    width: 110,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  homeLogo: {
    width: '100%',
    height: '100%',
  },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: "center",
  },
  notifBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  // Wallet
  walletCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  balance: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 8,
  },
  walletBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  walletStatText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  fundBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
  },
  fundBtnText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },

  // Layout
  section: { paddingHorizontal: 16, marginTop: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.black,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Services - 4 column compact grid
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceCard: {
    width: (SW - 32 - 24) / 4,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    ...SHADOW.sm,
  },
  serviceIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  serviceIconInner: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.dark,
    textAlign: "center",
    letterSpacing: -0.1,
  },

  // Referral Promo Card
  promoWrap: {
    marginTop: 14,
    borderRadius: RADIUS.lg,
    ...SHADOW.md,
    overflow: "hidden",
  },
  promo: {
    padding: 18,
    borderRadius: RADIUS.lg,
  },
  promoBlob: {
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
  promoGift: {
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

  // Empty state
  empty: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13, color: COLORS.subtle, fontWeight: "500" },

  // Virtual account cards
  accHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  accHeaderAction: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  accCard: {
    width: ACC_CARD_W,
    borderRadius: 10,
    overflow: "hidden",
  },
  accGrad: {
    padding: 10,
    gap: 5,
    position: "relative",
    overflow: "hidden",
  },
  accTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  accBankIcon: {},
  accBankName: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    flex: 1,
  },
  accNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.8,
  },
  accBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accName: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    flex: 1,
  },
  accCopyBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 5,
    padding: 4,
  },
  accCopyText: {},
  accOrb1: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -12,
    right: -12,
  },
  accOrb2: {},
});
