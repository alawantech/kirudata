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
import { Button } from "../../components/Button";
import { Card, SectionHeader } from "../../components/Card";
import { Header } from "../../components/Header";
import { TransactionPinModal } from "../../components/TransactionPinModal";
import { COLORS, RADIUS } from "../../constants/theme";
import ProviderLogo from "../../components/ProviderLogo";
import { fetchWithCache, TTL } from "../../utils/cache";

const EXAM_COLORS = [
  { color: "#059669", bg: "#ecfdf5" },
  { color: "#0284c7", bg: "#e0f2fe" },
  { color: "#7c3aed", bg: "#f5f3ff" },
  { color: "#d97706", bg: "#fffbeb" },
];

export default function ExamScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [providers, setProviders] = useState([]);
  const [loadingProvs, setLoadingProvs] = useState(true);
  const [examType, setExamType] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [pins, setPins] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pinModal, setPinModal] = useState(false);

  useEffect(() => {
    fetchWithCache("exam:providers", TTL.NETWORKS, () =>
      client.get("/exam/providers").then((r) => r.data.data?.providers || []),
    )
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoadingProvs(false));
  }, []);

  const handleBuy = () => {
    if (!examType || !quantity) {
      Toast.show({
        type: "error",
        text1: "Please select exam type and quantity",
      });
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10) {
      Toast.show({ type: "error", text1: "Quantity must be between 1 and 10" });
      return;
    }
    setConfirm(true);
  };

  const doSubmit = async (pin) => {
    const qty = parseInt(quantity);
    setLoading(true);
    try {
      const r = await client.post("/exam/purchase", {
        providerId: examType,
        quantity: qty,
        pin,
      });
      setPins(r.data.data?.pins || []);
      setPinModal(false);
      setConfirm(false);
      const ref = r.data?.data?.ref || r.data?.ref;
      if (ref) return navigation.navigate("Receipt", { ref });
      Toast.show({ type: "success", text1: "Exam pin(s) purchased! 🎉" });
    } catch (err) {
      setPinModal(false);
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Purchase failed",
      });
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const selected = providers.find((e) => e.id === examType);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Exam Pins" onBack={() => navigation.goBack()} />
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
          <Card>
            <SectionHeader title="Select Exam Type" />
            {loadingProvs ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.body, fontSize: 13 }}>Loading providers…</Text>
              </View>
            ) : (
            <View style={styles.grid}>
              {providers.map((e, i) => {
                const c = EXAM_COLORS[i % EXAM_COLORS.length];
                return (
                  <TouchableOpacity
                    key={e.id}
                    onPress={() => {
                      setExamType(e.id);
                      setPins(null);
                      setConfirm(false);
                    }}
                    style={[
                      styles.examCard,
                      examType === e.id && {
                        borderColor: c.color,
                        backgroundColor: c.color + "12",
                      },
                    ]}
                  >
                    <ProviderLogo name={e.name} size={44} style={{ marginBottom: 8 }} />
                    <Text
                      style={[
                        styles.examLabel,
                        examType === e.id && { color: c.color },
                      ]}
                    >
                      {e.name}
                    </Text>
                    <Text style={styles.examDesc}>
                      ₦{Number(e.price).toLocaleString()} / pin
                    </Text>
                    {examType === e.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={c.color}
                        style={styles.check}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            )}
          </Card>

          {examType && (
            <Card>
              <Input
                label="Quantity (1 - 10)"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Enter quantity"
                keyboardType="numeric"
                icon={
                  <Ionicons
                    name="layers-outline"
                    size={18}
                    color={COLORS.subtle}
                  />
                }
              />
            </Card>
          )}

          {confirm && examType && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Confirm Purchase</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Exam Type</Text>
                <Text style={styles.summaryVal}>{selected?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Quantity</Text>
                <Text style={styles.summaryVal}>{quantity} pin(s)</Text>
              </View>
            </View>
          )}

          {examType && !pins && (
            <Button
              title={confirm ? "Confirm & Pay" : "Continue"}
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

          {/* Display purchased pins */}
          {pins && pins.length > 0 && (
            <Card>
              <SectionHeader title={`Your ${selected?.name} Pin(s)`} />
              {pins.map((pin, i) => (
                <View key={i} style={styles.pinBox}>
                  <View>
                    <Text style={styles.pinSerial}>
                      Serial: {pin.serial || pin.serialNumber || "N/A"}
                    </Text>
                    <Text style={styles.pinCode}>{pin.pin}</Text>
                  </View>
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
              ))}
              <Text style={styles.pinNote}>
                📌 Save your pins carefully. They cannot be recovered once lost.
              </Text>
            </Card>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  examCard: {
    width: "47%",
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.surface,
    position: "relative",
  },
  examIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  examLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 2,
  },
  examDesc: { fontSize: 11, color: COLORS.muted },
  check: { position: "absolute", top: 8, right: 8 },
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
  pinBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pinSerial: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  pinCode: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: 2,
  },
  pinNote: { fontSize: 12, color: COLORS.muted, marginTop: 8, lineHeight: 18 },
});
