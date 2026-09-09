import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
import ProviderLogo from "../../components/ProviderLogo";
import { fetchWithCache, TTL } from "../../utils/cache";

export default function CableScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [providers, setProviders] = useState([]);
  const [loadingProvs, setLoadingProvs] = useState(true);
  const [provider, setProvider] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [smartCardNo, setSmartCardNo] = useState("");
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [cableFee, setCableFee] = useState(0);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchWithCache("cable:settings", TTL.SETTINGS, () =>
      client.get("/public/settings").then((r) => r.data.data?.settings),
    )
      .then((s) => {
        if (s?.cableFee) setCableFee(parseFloat(s.cableFee));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWithCache("cable:providers", TTL.NETWORKS, () =>
      client.get("/cable/providers").then((r) => r.data.data?.providers || []),
    )
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoadingProvs(false));
  }, []);

  useEffect(() => {
    if (provider) fetchPlans();
  }, [provider]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setSelectedPlan(null);
    setPlans([]);
    try {
      const ps = await fetchWithCache(`cable:plans:${provider}`, TTL.PLANS, () =>
        client.get(`/cable/plans?provider=${provider}`).then((r) => r.data.data?.plans || []),
      );
      setPlans(ps);
    } catch {
      Toast.show({ type: "error", text1: "Failed to load plans" });
    } finally {
      setLoadingPlans(false);
    }
  };

  const verifySmartCard = async () => {
    if (!smartCardNo || !provider) return;
    setVerifying(true);
    setCustomer(null);
    try {
      const r = await client.post("/cable/verify", {
        iuc: smartCardNo,
        provider,
      });
      setCustomer(r.data.data);
      Toast.show({
        type: "success",
        text1: `Smart card verified ✓ (${r.data.data?.customerName || ""})`,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Verification failed",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handlePay = () => {
    if (!selectedPlan) return Toast.show({ type: "error", text1: "Select a plan" });
    if (!phone || phone.length < 10)
      return Toast.show({ type: "error", text1: "Enter a valid phone number" });
    setConfirm(true);
  };

  const doSubmit = async (pin) => {
    setLoading(true);
    try {
      const r = await client.post("/cable/purchase", {
        providerId: provider,
        planId: selectedPlan.id,
        iuc: smartCardNo,
        phone,
        pin,
      });
      const result = r.data.data;
      if (result?.status === "fail") {
        setPinModal(false);
        Toast.show({
          type: "error",
          text1: result?.message || result?.msg || "Purchase failed. Please try again.",
        });
        setConfirm(false);
        return;
      }
      setPinModal(false);
      setConfirm(false);
      const ref = result?.ref;
      if (ref) return navigation.navigate("Receipt", { ref });
      const providerName = providers.find((p) => p.id === provider)?.name || provider;
      setSuccess({
        customer,
        plan: selectedPlan,
        provider: providerName,
        smartcard: smartCardNo,
      });
    } catch (err) {
      setPinModal(false);
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Payment failed",
      });
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <Header title="Cable TV" onBack={() => navigation.goBack()} />
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Subscription Active!</Text>
            <Text style={styles.successSubtitle}>Cable TV subscription was successful</Text>

            <View style={styles.detailsBox}>
              {[
                ["Provider", success.provider],
                ["Plan", success.plan?.plan || success.plan?.name],
                ["Smartcard", success.smartcard],
                ["Customer", success.customer?.customerName || success.customer?.name || "—"],
                ["Paid", `₦${Number(success.plan?.buyingPrice || success.plan?.price || 0).toLocaleString()}`],
              ].map(([k, v]) => (
                <View key={k} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{k}</Text>
                  <Text style={styles.detailVal}>{v}</Text>
                </View>
              ))}
            </View>

            <Button
              title="New Subscription"
              onPress={() => {
                setSuccess(null);
                setSmartCardNo("");
                setCustomer(null);
                setSelectedPlan(null);
                setPhone("");
                setConfirm(false);
              }}
              size="lg"
            />
            <Button
              title="View Transactions"
              variant="outline"
              onPress={() => navigation.navigate("Transactions")}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Cable TV" onBack={() => navigation.goBack()} />
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
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* Provider */}
          <Card>
            <SectionHeader title="Select Provider" />
            {loadingProvs ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.body, fontSize: 13 }}>Loading providers…</Text>
              </View>
            ) : (
            <View style={styles.row}>
              {providers.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setProvider(p.id)}
                  style={[
                    styles.providerBtn,
                    provider === p.id && styles.providerBtnActive,
                  ]}
                >
                  <ProviderLogo name={p.name} size={26} />
                  <Text
                    style={[
                      styles.providerText,
                      provider === p.id && styles.providerTextActive,
                    ]}
                  >
                    {p.name || p.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            )}
          </Card>

          {provider && (
            <>
              {/* Smart card */}
              <Card>
                <Input
                  label="Smart Card / IUC Number"
                  value={smartCardNo}
                  onChangeText={(v) => {
                    setSmartCardNo(v);
                    setCustomer(null);
                    setConfirm(false);
                  }}
                  placeholder="Enter smart card number"
                  keyboardType="numeric"
                  icon={
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={COLORS.subtle}
                    />
                  }
                />
                <Button
                  title={verifying ? "Verifying..." : "Verify Smart Card"}
                  variant="outline"
                  onPress={verifySmartCard}
                  loading={verifying}
                  disabled={!smartCardNo}
                />
                {customer && (
                  <View style={styles.customerBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.success}
                    />
                    <Text style={styles.customerName}>
                      {customer.customerName || customer.name}
                    </Text>
                  </View>
                )}
                {customer && (
                  <PhoneInput
                    label="Phone Number (for notification)"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>

              {/* Plans */}
              {customer && (
                <Card>
                  <SectionHeader title="Choose Package" />
                  {loadingPlans ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <View style={styles.plansGrid}>
                      {plans.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => setSelectedPlan(p)}
                          style={[
                            styles.planCard,
                            selectedPlan?.id === p.id && styles.planCardActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.planName,
                              selectedPlan?.id === p.id && { color: "#fff" },
                            ]}
                          >
                            {p.name}
                          </Text>
                          <Text
                            style={[
                              styles.planPrice,
                              selectedPlan?.id === p.id && {
                                color: "rgba(255,255,255,0.9)",
                              },
                            ]}
                          >
                            ₦{Number(p.buyingPrice).toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Card>
              )}

              {confirm && selectedPlan && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Confirm Subscription</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Provider</Text>
                    <Text style={styles.summaryVal}>
                      {providers.find((p) => p.id === provider)?.name || provider}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Package</Text>
                    <Text style={styles.summaryVal}>{selectedPlan.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Smart Card</Text>
                    <Text style={styles.summaryVal}>{smartCardNo}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Customer</Text>
                    <Text style={styles.summaryVal}>
                      {customer?.customerName || customer?.name}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Plan Price</Text>
                    <Text style={styles.summaryVal}>
                      ₦{Number(selectedPlan.buyingPrice).toLocaleString()}
                    </Text>
                  </View>
                  {cableFee > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Platform Fee</Text>
                      <Text style={styles.summaryVal}>
                        ₦{cableFee.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 }]}>
                    <Text style={[styles.summaryKey, { fontWeight: "800" }]}>Total</Text>
                    <Text
                      style={[
                        styles.summaryVal,
                        { color: COLORS.primary, fontWeight: "900" },
                      ]}
                    >
                      ₦{(Number(selectedPlan.buyingPrice) + cableFee).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {selectedPlan && customer && (
                <Button
                  title={confirm ? "Confirm & Pay" : "Continue"}
                  onPress={confirm ? () => setPinModal(true) : handlePay}
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  providerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  providerBtnActive: {
    backgroundColor: COLORS.cable,
    borderColor: COLORS.cable,
  },
  providerText: { fontSize: 13, fontWeight: "700", color: COLORS.body },
  providerTextActive: { color: "#fff" },
  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: COLORS.success + "15",
    padding: 10,
    borderRadius: RADIUS.md,
  },
  customerName: { fontSize: 14, fontWeight: "700", color: COLORS.success },
  plansGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  planCard: {
    width: "48%",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.surface,
  },
  planCardActive: { backgroundColor: COLORS.cable, borderColor: COLORS.cable },
  planName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 4,
  },
  planPrice: { fontSize: 14, fontWeight: "900", color: COLORS.cable },
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
  successContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 20,
  },
  detailsBox: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailKey: { fontSize: 13, color: COLORS.muted },
  detailVal: { fontSize: 13, fontWeight: "700", color: COLORS.black },
});
