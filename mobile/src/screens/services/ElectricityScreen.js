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

const METER_TYPES = [
  { id: "prepaid", label: "Prepaid" },
  { id: "postpaid", label: "Postpaid" },
];
const AMOUNTS = [1000, 2000, 5000, 10000, 20000];

export default function ElectricityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [providers, setProviders] = useState([]);
  const [loadingProvs, setLoadingProvs] = useState(true);
  const [provider, setProvider] = useState(null);
  const [meterType, setMeterType] = useState("prepaid");
  const [meterNo, setMeterNo] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [customer, setCustomer] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [electricityFee, setElectricityFee] = useState(0);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchWithCache("electricity:settings", TTL.SETTINGS, () =>
      client.get("/public/settings").then((r) => r.data.data?.settings),
    )
      .then((s) => {
        if (s?.electricityFee) setElectricityFee(parseFloat(s.electricityFee));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchWithCache("electricity:providers", TTL.NETWORKS, () =>
      client.get("/electricity/providers").then((r) => r.data.data?.providers || []),
    )
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoadingProvs(false));
  }, []);

  const verifyMeter = async () => {
    if (!meterNo || !provider || !meterType) return;
    setVerifying(true);
    setCustomer(null);
    try {
      const r = await client.post("/electricity/verify", {
        meter: meterNo,
        provider,
        meterType,
      });
      setCustomer(r.data.data);
      Toast.show({ type: "success", text1: "Meter verified ✓" });
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
    if (!amount || Number(amount) < 1000) {
      Toast.show({ type: "error", text1: "Minimum amount is ₦1,000" });
      return;
    }
    if (!phone || phone.length < 10) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }
    setConfirm(true);
  };

  const doSubmit = async (pin) => {
    setLoading(true);
    try {
      const r = await client.post("/electricity/purchase", {
        providerId: provider,
        meter: meterNo,
        meterType,
        amount: Number(amount),
        phone,
        pin,
        customerName: customer?.customerName || customer?.name || null,
        address: customer?.address || null,
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
        amount,
        provider: providerName,
        meter: meterNo,
        token: result?.token,
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
        <Header title="Electricity" onBack={() => navigation.goBack()} />
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#d97706" />
            </View>
            <Text style={styles.successTitle}>Electricity Purchased!</Text>

            {success.token && (
              <View style={styles.tokenBox}>
                <Text style={styles.tokenLabel}>Token</Text>
                <Text style={styles.tokenValue}>{success.token}</Text>
              </View>
            )}

            <View style={styles.detailsBox}>
              {[
                ["Provider", success.provider],
                ["Meter", success.meter],
                ["Customer", success.customer?.name || success.customer?.customerName || "—"],
                ["Amount", `₦${Number(success.amount).toLocaleString()}`],
              ].map(([k, v]) => (
                <View key={k} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{k}</Text>
                  <Text style={styles.detailVal}>{v}</Text>
                </View>
              ))}
            </View>

            <Button
              title="New Purchase"
              onPress={() => {
                setSuccess(null);
                setMeterNo("");
                setCustomer(null);
                setAmount("");
                setPhone("");
                setConfirm(false);
              }}
              size="lg"
              style={{ backgroundColor: "#d97706" }}
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
      <Header title="Electricity Bill" onBack={() => navigation.goBack()} />
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
          <Card>
            <SectionHeader title="Select Provider (DISCO)" />
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
                  style={[styles.chip, provider === p.id && styles.chipActive]}
                >
                  <ProviderLogo name={p.name} size={24} />
                  <Text
                    style={[
                      styles.chipText,
                      provider === p.id && styles.chipTextActive,
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
              <Card>
                <SectionHeader title="Meter Type" />
                <View style={styles.typeRow}>
                  {METER_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setMeterType(t.id)}
                      style={[
                        styles.chip,
                        meterType === t.id && styles.chipActive,
                        { flex: 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          meterType === t.id && styles.chipTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>

              <Card>
                <Input
                  label="Meter Number"
                  value={meterNo}
                  onChangeText={(v) => {
                    setMeterNo(v);
                    setCustomer(null);
                    setConfirm(false);
                  }}
                  placeholder="Enter meter number"
                  keyboardType="numeric"
                  icon={
                    <Ionicons
                      name="speedometer-outline"
                      size={18}
                      color={COLORS.subtle}
                    />
                  }
                />
                <Button
                  title={verifying ? "Verifying..." : "Verify Meter"}
                  variant="outline"
                  onPress={verifyMeter}
                  loading={verifying}
                  disabled={!meterNo}
                />
                {customer && (
                  <View style={styles.customerBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.success}
                    />
                    <View>
                      <Text style={styles.customerName}>
                        {customer.customerName || customer.name}
                      </Text>
                      {customer.address && (
                        <Text style={styles.customerAddr} numberOfLines={1}>
                          {customer.address}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {customer && (
                  <PhoneInput
                    label="Phone Number (for token delivery)"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>

              {customer && (
                <Card>
                  <SectionHeader title="Amount (₦)" />
                  <View style={styles.quickRow}>
                    {AMOUNTS.map((q) => (
                      <TouchableOpacity
                        key={q}
                        onPress={() => setAmount(String(q))}
                        style={[
                          styles.chip,
                          amount === String(q) && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            amount === String(q) && styles.chipTextActive,
                          ]}
                        >
                          ₦{q.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Input
                    label="Or enter amount"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Minimum ₦1,000"
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
                </Card>
              )}

              {confirm && amount && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Confirm Payment</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Provider</Text>
                    <Text style={styles.summaryVal}>
                      {providers.find((p) => p.id === provider)?.name || provider}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Meter No.</Text>
                    <Text style={styles.summaryVal}>{meterNo}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Customer</Text>
                    <Text style={styles.summaryVal}>
                      {customer?.customerName || customer?.name}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Amount</Text>
                    <Text style={styles.summaryVal}>
                      ₦{Number(amount).toLocaleString()}
                    </Text>
                  </View>
                  {electricityFee > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Platform Fee</Text>
                      <Text style={styles.summaryVal}>
                        ₦{electricityFee.toLocaleString()}
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
                      ₦{(Number(amount) + electricityFee).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {amount && customer && (
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
  typeRow: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: COLORS.electricity,
    borderColor: COLORS.electricity,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.body },
  chipTextActive: { color: "#fff" },
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
  customerAddr: { fontSize: 11, color: COLORS.muted },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
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
    backgroundColor: "#fef9c3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 12,
  },
  tokenBox: {
    width: "100%",
    backgroundColor: "#fefce8",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#d97706",
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#d97706",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tokenValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#92400e",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
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
