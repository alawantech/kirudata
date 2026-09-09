import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
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
import Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { Button } from "../../components/Button";
import { Card, SectionHeader } from "../../components/Card";
import { Header } from "../../components/Header";
import { TransactionPinModal } from "../../components/TransactionPinModal";
import { COLORS, RADIUS } from "../../constants/theme";

const NET_COLORS = { 1: "#f59e0b", 2: "#dc2626", 3: "#16a34a", 4: "#0d9488" };
import NetworkLogo from "../../components/NetworkLogo";
import { fetchWithCache, TTL } from "../../utils/cache";

export default function RechargeCardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [networks, setNetworks] = useState([]);
  const [loadingNets, setLoadingNets] = useState(true);
  const [selectedNet, setSelectedNet] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [cardName, setCardName] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchWithCache("recharge-card:networks", TTL.NETWORKS, () =>
      client.get("/recharge-card/networks").then((r) =>
        (r.data.data?.networks || []).map((n) => ({
          ...n,
          color: NET_COLORS[n.id] || "#6366f1",
        })),
      ),
    )
      .then(setNetworks)
      .catch(() => {})
      .finally(() => setLoadingNets(false));
  }, []);

  useEffect(() => {
    if (!selectedNet) return;
    setLoadingPlans(true);
    setSelectedPlan(null);
    setConfirm(false);
    fetchWithCache(`recharge-card:plans:${selectedNet}`, TTL.PLANS, () =>
      client.get(`/recharge-card/plans?network=${selectedNet}`).then((r) => r.data.data?.plans || []),
    )
      .then((ps) => {
        setPlans(ps);
        if (ps.length > 0) setSelectedPlan(ps[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, [selectedNet]);

  const netInfo = networks.find((n) => n.id === selectedNet);
  const planObj = plans.find((p) => p.id === selectedPlan);
  const qty = parseInt(quantity) || 1;
  const total = planObj ? parseFloat(planObj.userPrice) * qty : 0;

  const handleContinue = () => {
    if (!selectedNet || !selectedPlan) {
      Toast.show({ type: "error", text1: "Select a network and plan" });
      return;
    }
    if (!cardName.trim()) {
      Toast.show({ type: "error", text1: "Enter a card name" });
      return;
    }
    const q = parseInt(quantity);
    if (isNaN(q) || q < 1 || q > 10) {
      Toast.show({ type: "error", text1: "Quantity must be between 1 and 10" });
      return;
    }
    setConfirm(true);
  };

  const doSubmit = async (pin) => {
    setLoading(true);
    try {
      const r = await client.post("/recharge-card/purchase", {
        planId: selectedPlan,
        quantity: qty,
        cardName: cardName.trim(),
        pin,
      });
      const data = r.data.data;
      if (data?.status === "fail" || data?.status === "error") {
        Toast.show({ type: "error", text1: data?.message || data?.msg || "Purchase failed" });
        setPinModal(false);
        setConfirm(false);
        return;
      }
      setResult(data);
      setPinModal(false);
      setConfirm(false);
      if (data?.ref) return navigation.navigate("Receipt", { ref: data.ref });
      Toast.show({ type: "success", text1: "Recharge cards purchased! 🎉" });
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

  const copyPin = (pin) => {
    Clipboard.setString(pin);
    Toast.show({ type: "success", text1: "PIN copied!" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Recharge Card" onBack={() => navigation.goBack()} />
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
          {/* Network Selection */}
          <Card>
            <SectionHeader title="Select Network" />
            {loadingNets ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.body, fontSize: 13 }}>Loading networks…</Text>
              </View>
            ) : (
            <View style={styles.netGrid}>
              {networks.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => {
                    setSelectedNet(n.id);
                    setResult(null);
                    setConfirm(false);
                  }}
                  style={[
                    styles.netCard,
                    selectedNet === n.id && {
                      borderColor: n.color,
                      backgroundColor: n.color + "12",
                    },
                  ]}
                >
                  <NetworkLogo name={n.name} size={40} />
                  <Text
                    style={[
                      styles.netLabel,
                      { marginTop: 6 },
                      selectedNet === n.id && { color: n.color },
                    ]}
                  >
                    {n.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            )}
          </Card>

          {/* Plans */}
          {selectedNet && (
            <Card>
              <SectionHeader title="Select Plan" />
              {loadingPlans ? (
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                  Loading plans...
                </Text>
              ) : plans.length === 0 ? (
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  No plans available for this network
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {plans.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setSelectedPlan(p.id);
                        setConfirm(false);
                        setResult(null);
                      }}
                      style={[
                        styles.planRow,
                        selectedPlan === p.id && {
                          borderColor: netInfo?.color || COLORS.rechargecard,
                          backgroundColor:
                            (netInfo?.color || COLORS.rechargecard) + "10",
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.planName,
                            selectedPlan === p.id && {
                              color: netInfo?.color || COLORS.rechargecard,
                            },
                          ]}
                        >
                          {p.name}
                        </Text>
                        {p.loadPin ? (
                          <Text style={styles.planSub}>Load: {p.loadPin}</Text>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.planPrice,
                          selectedPlan === p.id && {
                            color: netInfo?.color || COLORS.rechargecard,
                          },
                        ]}
                      >
                        ₦{Number(p.userPrice).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* Quantity */}
          {selectedPlan && !result && (
            <Card>
              <SectionHeader title="Quantity (1 – 10)" />
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  onPress={() => {
                    const q = Math.max(1, parseInt(quantity) - 1);
                    setQuantity(String(q));
                    setConfirm(false);
                  }}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const q = Math.min(10, parseInt(quantity) + 1);
                    setQuantity(String(q));
                    setConfirm(false);
                  }}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Card Name */}
          {selectedPlan && !result && (
            <Card>
              <SectionHeader title="Card Name" />
              <Text style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>
                Name to appear on the card
              </Text>
              <TextInput
                value={cardName}
                onChangeText={(t) => {
                  setCardName(t);
                  setConfirm(false);
                }}
                placeholder="e.g. My Business"
                maxLength={50}
                style={styles.cardNameInput}
              />
            </Card>
          )}

          {/* Confirm summary */}
          {confirm && planObj && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Confirm Purchase</Text>
              {[
                ["Plan", planObj.name],
                ["Card Name", cardName.trim()],
                ["Quantity", `${qty} card${qty > 1 ? "s" : ""}`],
                ["Total", `₦${total.toLocaleString()}`],
              ].map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>{k}</Text>
                  <Text style={styles.summaryVal}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          {selectedPlan && !result && (
            <Button
              title={confirm ? "Confirm & Pay" : "Continue"}
              onPress={confirm ? () => setPinModal(true) : handleContinue}
              loading={loading}
              size="lg"
            />
          )}
          {confirm && !result && (
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setConfirm(false)}
            />
          )}

          {/* Result — show purchased cards */}
          {result && (result.cards || []).length > 0 && (
            <Card>
              <SectionHeader
                title={`Your Recharge Cards (${result.cards.length})`}
              />
              {result.cards.map((card, i) => (
                <View key={i} style={styles.cardBox}>
                  <View style={{ flex: 1 }}>
                    {card.serial ? (
                      <Text style={styles.cardSerial}>
                        Serial: {card.serial}
                      </Text>
                    ) : null}
                    <Text style={styles.cardPin}>{card.pin}</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyPin(card.pin)}>
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={COLORS.rechargecard}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              {(result.loadPin || result.checkBalance) && (
                <View style={styles.ussdBox}>
                  {result.loadPin && (
                    <Text style={styles.ussdText}>
                      Load PIN:{" "}
                      <Text style={{ fontWeight: "700" }}>
                        {result.loadPin}
                      </Text>
                    </Text>
                  )}
                  {result.checkBalance && (
                    <Text style={styles.ussdText}>
                      Check Balance:{" "}
                      <Text style={{ fontWeight: "700" }}>
                        {result.checkBalance}
                      </Text>
                    </Text>
                  )}
                </View>
              )}
              <Text style={styles.noteText}>
                📌 Save your PINs carefully — they cannot be recovered once
                lost.
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
  netGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  netCard: {
    width: "47%",
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  netLabel: {
    fontWeight: "900",
    fontSize: 14,
    color: COLORS.black,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  planName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 2,
  },
  planSub: {
    fontSize: 11,
    color: COLORS.muted,
  },
  planPrice: {
    fontWeight: "900",
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.black,
    lineHeight: 22,
  },
  qtyValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.black,
  },
  cardNameInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.surface,
  },
  summaryBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryTitle: {
    fontWeight: "800",
    fontSize: 13,
    color: COLORS.dark,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryKey: {
    fontSize: 13,
    color: COLORS.muted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.dark,
  },
  cardBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#86efac",
    marginBottom: 10,
  },
  cardSerial: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
  },
  cardPin: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2,
    color: "#14532d",
  },
  ussdBox: {
    backgroundColor: "#dcfce7",
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 10,
  },
  ussdText: {
    fontSize: 12,
    color: "#166534",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 16,
  },
});
