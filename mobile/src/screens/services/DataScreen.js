import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { PhoneInput, detectNetwork } from "../../components/PhoneInput";
import { Card, SectionHeader } from "../../components/Card";
import { Header } from "../../components/Header";
import { TransactionPinModal } from "../../components/TransactionPinModal";
import { NetworkSelector } from "../../components/NetworkSelector";
import { ConfirmPurchaseModal } from "../../components/ConfirmPurchaseModal";
import { UssdEnquiryRow } from "../../components/UssdEnquiryRow";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import NetworkLogo from "../../components/NetworkLogo";
import { fetchWithCache, TTL } from "../../utils/cache";
import { useOverlay } from "../../context/OverlayContext";

const BAR_HEIGHT = 76;

function formatValidity(v) {
  if (!v) return "";
  const num = parseInt(v, 10);
  if (isNaN(num)) return v;
  return num === 1 ? "1 day" : `${num} days`;
}

// User-facing order for data types: SME first, then Corporate Gifting, then Gifting.
// "Cooperate Gifting" is the value actually stored on the plan rows.
const TYPE_ORDER = ["SME", "Cooperate Gifting", "Gifting"];
const orderTypes = (types) =>
  [...types].sort(
    (a, b) =>
      (TYPE_ORDER.indexOf(a) === -1 ? TYPE_ORDER.length : TYPE_ORDER.indexOf(a)) -
      (TYPE_ORDER.indexOf(b) === -1 ? TYPE_ORDER.length : TYPE_ORDER.indexOf(b)),
  );
const defaultTypeFor = (types) => TYPE_ORDER.find((t) => types.includes(t)) || types[0] || null;

export default function DataScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const { setBottomInset } = useOverlay();

  const [networks, setNetworks] = useState([]);
  const [loadingNets, setLoadingNets] = useState(true);
  const [network, setNetwork] = useState(null);
  const [dataType, setDataType] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinModal, setPinModal] = useState(false);

  useEffect(() => {
    fetchWithCache("data:networks", TTL.NETWORKS, () =>
      client.get("/data/networks").then((r) => r.data.data?.networks || []),
    )
      .then(setNetworks)
      .catch(() => {})
      .finally(() => setLoadingNets(false));
  }, []);

  useEffect(() => {
    if (!network) return;
    setDataType(null);
    setAvailableTypes([]);
    setPlans([]);
    setAllPlans([]);
    setPlan(null);
    setLoadingPlans(true);

    // Fetch plans for this network (no type filter) to discover available types
    fetchWithCache(`data:plans:${network}`, TTL.PLANS, () =>
      client.get(`/data/plans?network=${network}`).then((r) => r.data.data?.plans || []),
    )
      .then((fetched) => {
        setAllPlans(fetched);

        // The backend already filters plans by the network's status flags
        // (sme/gifting/corporate) — derive type chips from the response exactly
        // like the web app, so every returned type (e.g. "Cooperate Gifting") shows.
        const types = orderTypes([...new Set(fetched.map((p) => p.type).filter(Boolean))]);
        setAvailableTypes(types);
        // Preselect SME, else Corporate Gifting, else Gifting — whichever is available.
        setDataType(defaultTypeFor(types));
      })
      .catch(() => {
        setAllPlans([]);
        setAvailableTypes([]);
      })
      .finally(() => setLoadingPlans(false));
  }, [network]);

  useEffect(() => {
    if (!dataType || !allPlans.length) return;
    // Filter allPlans by selected type (case-insensitive)
    const filtered = allPlans.filter(
      (p) => p.type && p.type.toLowerCase() === dataType.toLowerCase(),
    );
    setPlans(filtered);
    setPlan(null);
  }, [dataType]);

  // Lift the floating WhatsApp button while the "Pay now" bar is on screen
  useEffect(() => {
    setBottomInset(plan ? BAR_HEIGHT : 0);
    return () => setBottomInset(0);
  }, [plan, setBottomInset]);

  // Typing a number auto-selects its network. Manual picking still wins until
  // the number changes again, so the user can always override detection.
  const handlePhoneChange = (value) => {
    setPhone(value);
    const detected = detectNetwork(value);
    if (!detected || !networks.length) return;
    const match = networks.find(
      (n) => (n.name || "").toUpperCase() === detected.toUpperCase(),
    );
    if (match) setNetwork((prev) => (prev === match.id ? prev : match.id));
  };

  const handlePayNow = () => {
    if (!phone.trim()) {
      Toast.show({ type: "error", text1: "Enter a phone number" });
      return;
    }
    if (!network) {
      Toast.show({ type: "error", text1: "Select a network" });
      return;
    }
    if (!plan) return;
    Keyboard.dismiss();
    setConfirmOpen(true);
  };

  const doSubmit = async (pin) => {
    setLoading(true);
    try {
      const r = await client.post("/data/purchase", {
        planId: plan.id,
        planSource: plan.source || "classic",
        phone,
        pin,
      });
      setPinModal(false);
      setConfirmOpen(false);
      const ref = r.data?.data?.ref || r.data?.ref;
      if (ref) return navigation.navigate("Receipt", { ref });
      Toast.show({ type: "success", text1: "Data purchased successfully!" });
      navigation.goBack();
    } catch (err) {
      setPinModal(false);
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Purchase failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedNetwork = networks.find((n) => n.id === network);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header
        title="Buy Data"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate("Transactions")}
            style={styles.historyBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={13} color={COLORS.primary} />
            <Text style={styles.historyText} numberOfLines={1}>History</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 56}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Buy Data</Text>
              <Text style={styles.heroSub}>
                Top up data bundles on any Nigerian network in seconds.
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="wifi" size={26} color="#fff" />
            </View>
          </View>

          {/* Phone number — first, and it picks the network while you type */}
          <Card>
            <View style={styles.phoneHead}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              {selectedNetwork ? (
                <View style={styles.netChip}>
                  <NetworkLogo name={selectedNetwork.name} size={16} />
                  <Text style={styles.netChipText}>{selectedNetwork.name}</Text>
                </View>
              ) : null}
            </View>
            <PhoneInput
              label={null}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="Enter phone number"
            />
          </Card>

          {/* Network picker */}
          <Card>
            <SectionHeader title="Select Network" />
            {loadingNets ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.body, fontSize: 13 }}>Loading networks…</Text>
              </View>
            ) : (
            <NetworkSelector networks={networks} value={network} onChange={setNetwork} />
            )}
          </Card>

          {/* Data type picker - dynamically from network settings */}
          {network && (
            <Card>
              <SectionHeader title="Data Type" />
              {loadingPlans ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ padding: 12 }}
                />
              ) : availableTypes.length === 0 ? (
                <Text style={styles.noPlans}>
                  No data types available for this network
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -4 }}
                >
                  <View style={styles.typeRow}>
                    {availableTypes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setDataType(t)}
                        style={[
                          styles.typePill,
                          dataType === t && styles.typePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeText,
                            dataType === t && styles.typeTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </Card>
          )}

          {/* Plan selector */}
          {network && dataType && (
            <Card>
              <SectionHeader title="Choose a Plan" />
              {plans.length === 0 ? (
                <Text style={styles.noPlans}>No plans available</Text>
              ) : (
                <View style={styles.plansGrid}>
                  {plans.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setPlan(p)}
                      style={[
                        styles.planCard,
                        plan?.id === p.id && styles.planCardActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.planSize,
                          plan?.id === p.id && { color: "#fff" },
                        ]}
                      >
                        {p.name}
                      </Text>
                      <Text
                        style={[
                          styles.planPrice,
                          plan?.id === p.id && {
                            color: "rgba(255,255,255,0.9)",
                          },
                        ]}
                      >
                        ₦{Number(p.userPrice).toLocaleString()}
                      </Text>
                      {p.validity && (
                        <Text
                          style={[
                            styles.planValidity,
                            plan?.id === p.id && {
                              color: "rgba(255,255,255,0.7)",
                            },
                          ]}
                        >
                          {formatValidity(p.validity)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* USSD enquiry */}
          <UssdEnquiryRow onPress={() => navigation.navigate("UssdCodes")} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pay now bar */}
      {plan && (
        <View style={[styles.bottomBar, { height: BAR_HEIGHT }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barPrice}>₦{Number(plan.userPrice).toLocaleString()}</Text>
            <Text style={styles.barPlan} numberOfLines={1}>
              {plan.name}
              {plan.validity ? ` · ${formatValidity(plan.validity)}` : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={handlePayNow}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>Pay now</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <ConfirmPurchaseModal
        visible={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setPinModal(true);
        }}
        plan={plan}
        phone={phone}
        networkName={selectedNetwork?.name}
        dataType={dataType}
        validityLabel={plan?.validity ? formatValidity(plan.validity) : ""}
        loading={loading}
      />
      <TransactionPinModal
        visible={pinModal}
        onSubmit={doSubmit}
        onCancel={() => setPinModal(false)}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.black,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 18,
    gap: 12,
    ...SHADOW.md,
    shadowColor: COLORS.black,
  },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 12.5, color: "#94a3b8", marginTop: 4, lineHeight: 17 },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  phoneLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.black,
    letterSpacing: 0.2,
  },
  netChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + "14",
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  netChipText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + "12",
  },
  historyText: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  typeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: { fontSize: 13, fontWeight: "700", color: COLORS.body },
  typeTextActive: { color: "#fff" },
  noPlans: {
    textAlign: "center",
    color: COLORS.subtle,
    padding: 16,
    fontSize: 13,
  },
  plansGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  planCard: {
    width: "30%",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 10,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  planCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planSize: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  planValidity: { fontSize: 10, color: COLORS.subtle },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    ...SHADOW.lg,
    shadowOffset: { width: 0, height: -4 },
  },
  barPrice: { fontSize: 20, fontWeight: "900", color: COLORS.black, letterSpacing: -0.5 },
  barPlan: { fontSize: 12, fontWeight: "600", color: COLORS.muted, marginTop: 2 },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    paddingHorizontal: 26,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
  },
  payBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
