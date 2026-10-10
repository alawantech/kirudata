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
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";
import NetworkLogo from "../../components/NetworkLogo";
import { fetchWithCache, TTL } from "../../utils/cache";

function formatValidity(v) {
  if (!v) return "";
  const num = parseInt(v, 10);
  if (isNaN(num)) return v;
  return num === 1 ? "1 day" : `${num} days`;
}

export default function DataScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

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
  const [confirm, setConfirm] = useState(false);
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
        const types = [...new Set(fetched.map((p) => p.type).filter(Boolean))];
        setAvailableTypes(types);
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

  const handleBuy = () => {
    if (!network || !plan || !phone) {
      Toast.show({ type: "error", text1: "Please complete all fields" });
      return;
    }
    setConfirm(true);
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
      setConfirm(false);
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
      <Header title="Buy Data" onBack={() => navigation.goBack()} />
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
              <SectionHeader title="Choose Plan" />
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

          {/* Phone number */}
          {plan && (
            <Card>
              <PhoneInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder={`Enter ${selectedNetwork?.name || ""} number`}
              />
            </Card>
          )}

          {/* Confirm summary */}
          {confirm && plan && phone && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Confirm Purchase</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Network</Text>
                <Text style={styles.summaryVal}>{selectedNetwork?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Plan</Text>
                <Text style={styles.summaryVal}>{plan.name}</Text>
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
                  ₦{Number(plan.userPrice).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {plan && (
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
              size="md"
            />
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
