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
import { PhoneInput } from "../../components/PhoneInput";
import { Button } from "../../components/Button";
import { Card, SectionHeader } from "../../components/Card";
import { Header } from "../../components/Header";
import { TransactionPinModal } from "../../components/TransactionPinModal";
import { COLORS, RADIUS } from "../../constants/theme";
import NetworkLogo from "../../components/NetworkLogo";
import { fetchWithCache, TTL } from "../../utils/cache";

export default function AirtimeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [networks, setNetworks] = useState([]);
  const [loadingNets, setLoadingNets] = useState(true);
  const [network, setNetwork] = useState(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [discount, setDiscount] = useState(0);

  const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

  useEffect(() => {
    fetchWithCache("airtime:networks", TTL.NETWORKS, () =>
      client.get("/airtime/networks").then((r) => r.data.data?.networks || []),
    )
      .then(setNetworks)
      .catch(() => {})
      .finally(() => setLoadingNets(false));
  }, []);

  // Fetch discount when selected network changes (mirrors web logic)
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

  const cost = amount ? parseFloat(amount) * (1 - discount / 100) : 0;

  const handleBuy = () => {
    if (!network || !phone || !amount) {
      Toast.show({ type: "error", text1: "Please fill in all fields" });
      return;
    }
    if (Number(amount) < 50) {
      Toast.show({ type: "error", text1: "Minimum airtime is ₦50" });
      return;
    }
    setConfirm(true);
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
      setConfirm(false);
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

  const selectedNetwork = networks.find((n) => n.id === network);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Buy Airtime" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 56}
        style={{ flex: 1 }}
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
          showsVerticalScrollIndicator={false}
        >
          {/* Network picker */}
          <Card>
            <SectionHeader title="Select Network" />
            {loadingNets ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.body, fontSize: 13 }}>Loading networks…</Text>
              </View>
            ) : (
            <View style={styles.networkRow}>
              {networks.map((n) => {
                const isActive = network === n.id;
                return (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => setNetwork(n.id)}
                    style={[
                      styles.networkPill,
                      {
                        backgroundColor: isActive ? COLORS.primary + "10" : COLORS.white,
                        borderColor: isActive ? COLORS.primary : COLORS.border,
                      },
                    ]}
                  >
                    <NetworkLogo name={n.name} size={36} />
                    <Text style={[styles.networkLabel, { color: isActive ? COLORS.primary : COLORS.body }]}>
                      {n.name}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            )}
          </Card>

          {network && (
            <>
              <Card>
                <PhoneInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={`Enter ${selectedNetwork?.name || ""} number`}
                />

                <SectionHeader title="Amount (₦)" />
                {/* Quick amount chips */}
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

                <Input
                  label="Or enter custom amount"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                  icon={
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color={COLORS.subtle}
                    />
                  }
                  style={{ marginTop: 8, marginBottom: 0 }}
                />

                {discount > 0 && (
                  <View style={styles.discountBanner}>
                    <Ionicons name="pricetag" size={14} color="#16a34a" />
                    <Text style={styles.discountText}>
                      {discount}% discount applied — pay ₦{cost.toLocaleString()}
                    </Text>
                  </View>
                )}
              </Card>

              {confirm && phone && amount && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Confirm Purchase</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Network</Text>
                    <Text style={styles.summaryVal}>
                      {selectedNetwork?.name}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Phone</Text>
                    <Text style={styles.summaryVal}>{phone}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Amount</Text>
                    <Text
                      style={[
                        styles.summaryVal,
                        { color: COLORS.primary, fontWeight: "900" },
                      ]}
                    >
                      ₦{Number(amount).toLocaleString()}
                    </Text>
                  </View>
                  {discount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>You pay (incl. discount)</Text>
                      <Text
                        style={[
                          styles.summaryVal,
                          { color: COLORS.success, fontWeight: "900" },
                        ]}
                      >
                        ₦{cost.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {amount && network && (
                <Button
                  title={confirm ? "Tap to Confirm & Pay" : "Continue"}
                  onPress={confirm ? () => setPinModal(true) : handleBuy}
                  loading={loading}
                  size="lg"
                />
              )}
              {confirm && (
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setConfirm(false)}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  networkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  networkPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    gap: 6,
  },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  networkLabel: { fontSize: 13, fontWeight: "800" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  quickChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickText: { fontSize: 13, fontWeight: "700", color: COLORS.body },
  quickTextActive: { color: "#fff" },
  discountBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
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
  summaryBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryKey: { fontSize: 13, color: COLORS.muted },
  summaryVal: { fontSize: 13, fontWeight: "700", color: COLORS.black },
});
