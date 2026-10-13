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
import { Input } from "../../components/Input";
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
const MIN_AMOUNT = 50;
const QUICK_AMOUNTS = [100, 200, 500, 1000];

export default function AirtimeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const { setBottomInset } = useOverlay();

  const [networks, setNetworks] = useState([]);
  const [loadingNets, setLoadingNets] = useState(true);
  const [network, setNetwork] = useState(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchWithCache("airtime:networks", TTL.NETWORKS, () =>
      client.get("/airtime/networks").then((r) => r.data.data?.networks || []),
    )
      .then(setNetworks)
      .catch(() => {})
      .finally(() => setLoadingNets(false));
  }, []);

  // Discount follows the selected network (mirrors the web logic)
  useEffect(() => {
    if (!network) {
      setDiscount(0);
      return;
    }
    fetchWithCache(`airtime:discount:${network}`, TTL.DISCOUNT, () =>
      client.get(`/airtime/discount?network=${network}&type=VTU`).then((r) => {
        const discounts = r.data.data?.discounts || [];
        const d = discounts[0];
        if (!d) return 0;
        const costPct = parseFloat(d.userDiscount || 100);
        return parseFloat((100 - costPct).toFixed(2));
      }),
    )
      .then(setDiscount)
      .catch(() => setDiscount(0));
  }, [network]);

  const amt = amount ? parseFloat(amount) : 0;
  const cost = amt ? amt * (1 - discount / 100) : 0;
  const selectedNetwork = networks.find((n) => n.id === network);
  const canPay =
    !!phone.trim() && !!network && amt >= MIN_AMOUNT;

  // Lift the floating WhatsApp button while the "Pay now" bar is on screen
  useEffect(() => {
    setBottomInset(canPay ? BAR_HEIGHT : 0);
    return () => setBottomInset(0);
  }, [canPay, setBottomInset]);

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
    if (!amt) {
      Toast.show({ type: "error", text1: "Enter an amount" });
      return;
    }
    if (amt < MIN_AMOUNT) {
      Toast.show({ type: "error", text1: `Minimum airtime is ₦${MIN_AMOUNT}` });
      return;
    }
    Keyboard.dismiss();
    setConfirmOpen(true);
  };

  const doSubmit = async (pin) => {
    setLoading(true);
    try {
      const r = await client.post("/airtime/purchase", {
        networkId: network,
        phone,
        amount: Number(amount),
        airtimeType: "VTU",
        pin,
      });
      setPinModal(false);
      setConfirmOpen(false);
      const ref = r.data?.data?.ref || r.data?.ref;
      if (ref) return navigation.navigate("Receipt", { ref });
      Toast.show({ type: "success", text1: "Airtime sent successfully! 🎉" });
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header
        title="Buy Airtime"
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
              <Text style={styles.heroTitle}>Buy Airtime</Text>
              <Text style={styles.heroSub}>
                Top up any Nigerian line instantly — for you or a friend.
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="call" size={26} color="#fff" />
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
                <Text style={{ marginTop: 8, color: COLORS.body, fontSize: 13 }}>
                  Loading networks…
                </Text>
              </View>
            ) : (
              <NetworkSelector
                networks={networks}
                value={network}
                onChange={setNetwork}
              />
            )}
          </Card>

          {/* Amount */}
          {network && (
            <Card>
              <SectionHeader title="Quick Amount" />
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => setAmount(String(q))}
                    style={[
                      styles.quickChip,
                      amount === String(q) && styles.quickChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickText,
                        amount === String(q) && styles.quickTextActive,
                      ]}
                    >
                      ₦{q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: 4 }}>
                <Input
                  label="Or enter amount"
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                  icon={<Text style={styles.naira}>₦</Text>}
                />
              </View>

              {discount > 0 && amt ? (
                <View style={styles.discountBanner}>
                  <Ionicons name="pricetag" size={14} color="#16a34a" />
                  <Text style={styles.discountText}>
                    {discount}% discount applied — you pay ₦
                    {cost.toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </Card>
          )}

          {/* USSD enquiry */}
          <UssdEnquiryRow onPress={() => navigation.navigate("UssdCodes")} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pay now bar */}
      {canPay ? (
        <View style={[styles.bottomBar, { height: BAR_HEIGHT }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barPrice}>₦{cost.toLocaleString()}</Text>
            <Text style={styles.barPlan} numberOfLines={1}>
              ₦{amt.toLocaleString()} airtime
              {selectedNetwork?.name ? ` · ${selectedNetwork.name}` : ""}
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
      ) : null}

      <ConfirmPurchaseModal
        visible={confirmOpen}
        service="airtime"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setPinModal(true);
        }}
        phone={phone}
        networkName={selectedNetwork?.name}
        airtimeAmount={amt}
        cost={cost}
        discountPct={discount}
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
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  quickChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  quickChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickText: { fontSize: 13.5, fontWeight: "800", color: COLORS.body },
  quickTextActive: { color: "#fff" },
  naira: { fontSize: 16, fontWeight: "800", color: COLORS.black },
  discountBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  discountText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#16a34a",
    flex: 1,
  },
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
  barPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: -0.5,
  },
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
