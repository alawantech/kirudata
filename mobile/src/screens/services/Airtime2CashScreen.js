import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Header } from "../../components/Header";
import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const MTN_PREFIXES = ["0803","0806","0816","0903","0906","0810","0813","0908","0916","0814","0703","0706","0913"];
const AIRTEL_PREFIXES = ["0802","0808","0812","0708","0701","0907","0901"];
const GLO_PREFIXES = ["0805","0807","0811","0815","0905","0705","0819"];
const NINE_MOBILE_PREFIXES = ["0809","0817","0818","0909"];

function detectNetwork(phone) {
  const prefix = phone.substring(0, 4);
  if (MTN_PREFIXES.includes(prefix)) return "MTN";
  if (AIRTEL_PREFIXES.includes(prefix)) return "AIRTEL";
  if (GLO_PREFIXES.includes(prefix)) return "GLO";
  if (NINE_MOBILE_PREFIXES.includes(prefix)) return "9MOBILE";
  return null;
}

export default function Airtime2CashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("new");

  // Form
  const [network, setNetwork] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [detectedNetwork, setDetectedNetwork] = useState(null);
  const [networkError, setNetworkError] = useState("");
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([
      client.get("/airtime-to-cash/config").catch(() => ({ data: { data: {} } })),
      client.get("/airtime-to-cash/history").catch(() => ({ data: { data: { requests: [] } } })),
    ]).then(([c, h]) => {
      setConfig(c.data.data || {});
      setHistory(h.data.data?.requests || []);
    }).finally(() => setLoading(false));
  }, []);

  const selectedNet = config?.networks?.find((n) => n.id === network);
  const receiveAmount = amount ? (parseFloat(amount) * (config?.rate || 80)) / 100 : 0;

  const handleNumberChange = (val) => {
    const digits = val.replace(/\D/g, "").substring(0, 11);
    setSenderNumber(digits);
    setNetworkError("");
    setDetectedNetwork(null);
    if (digits.length === 11) {
      const detected = detectNetwork(digits);
      setDetectedNetwork(detected);
      if (!detected) {
        setNetworkError("Invalid phone number. Enter a valid Nigerian number.");
      } else if (detected !== "MTN" && detected !== "AIRTEL") {
        setNetworkError(`This number is ${detected}. We only accept MTN and Airtel airtime.`);
      } else if (detected !== network) {
        setNetworkError(`This number is ${detected}, not ${network}. Change network to ${detected}.`);
      }
    } else {
      setDetectedNetwork(null);
    }
  };

  const canProceedStep2 = senderNumber.length === 11 && !networkError && detectedNetwork && (detectedNetwork === "MTN" || detectedNetwork === "AIRTEL") && detectedNetwork === network;
  const canProceedStep3 = !!amount && parseFloat(amount) >= (config?.minAmount || 100) && !!payoutMethod;
  const canSubmit = canProceedStep3;

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await client.post("/airtime-to-cash/submit", {
        network,
        senderNumber,
        amount: parseFloat(amount),
        payoutMethod,
        bankName: payoutMethod === "bank" ? bankName : undefined,
        bankAccount: payoutMethod === "bank" ? bankAccount : undefined,
        bankAccountName: payoutMethod === "bank" ? bankAccountName : undefined,
      });
      setResult(res.data.data);
      await refreshUser();
      const h = await client.get("/airtime-to-cash/history");
      setHistory(h.data.data?.requests || []);
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.msg || "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setNetwork("");
    setSenderNumber("");
    setDetectedNetwork(null);
    setNetworkError("");
    setAmount("");
    setPayoutMethod("");
    setBankName("");
    setBankAccount("");
    setBankAccountName("");
    setResult(null);
  };

  const statusBadge = (s) => {
    const map = {
      pending: { label: "Pending", bg: "#fef9c3", color: "#a16207" },
      completed: { label: "Completed", bg: "#dcfce7", color: "#15803d" },
      rejected: { label: "Rejected", bg: "#fee2e2", color: "#dc2626" },
    };
    const m = map[s] || map.pending;
    return (
      <View style={{ backgroundColor: m.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: m.color }}>{m.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <Header title="Airtime to Cash" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: COLORS.muted }}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!config?.enabled) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <Header title="Airtime to Cash" onBack={() => navigation.goBack()} />
        <View style={{ padding: 24, alignItems: "center", marginTop: 60 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#f59e0b" />
          <Text style={{ fontSize: 16, fontWeight: "700", marginTop: 16, textAlign: "center" }}>Service Unavailable</Text>
          <Text style={{ color: COLORS.muted, marginTop: 8, textAlign: "center" }}>Airtime to Cash is currently disabled.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Airtime to Cash" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 56}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Tabs */}
          <View style={styles.tabs}>
            {[{ key: "new", label: "New Request" }, { key: "history", label: "History" }].map((t) => (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "history" ? (
            history.length === 0 ? (
              <Card style={{ padding: 32, alignItems: "center" }}>
                <Ionicons name="time-outline" size={32} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, marginTop: 8 }}>No requests yet</Text>
              </Card>
            ) : (
              history.map((r) => (
                <Card key={r.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontWeight: "700", fontSize: 14 }}>₦{r.amount.toLocaleString()} → ₦{r.receiveAmount.toLocaleString()}</Text>
                    {statusBadge(r.status)}
                  </View>
                  <Text style={{ fontSize: 12, color: COLORS.muted }}>
                    {r.network} · {r.senderNumber} · {new Date(r.createdAt).toLocaleDateString()}
                  </Text>
                </Card>
              ))
            )
          ) : (
            <>
              {/* Step indicator */}
              {step <= 4 && (
                <View style={styles.steps}>
                  {["Network", "Phone", "Amount", "Transfer"].map((label, i) => (
                    <View key={label} style={styles.stepItem}>
                      <View style={[styles.stepCircle, step > i + 1 && styles.stepDone, step === i + 1 && styles.stepCurrent]}>
                        <Text style={[styles.stepNum, (step > i + 1 || step === i + 1) && { color: "white" }]}>{step > i + 1 ? "✓" : i + 1}</Text>
                      </View>
                      <Text style={[styles.stepLabel, step === i + 1 && { fontWeight: "700", color: COLORS.primary }]}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Step 1: Network */}
              {step === 1 && (
                <Card>
                  <Text style={styles.sectionTitle}>Select Network</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {config?.networks?.map((n) => {
                      const netStyle = n.id === "MTN"
                        ? { bg: "#fffde7", border: "#fbc02d", color: "#000000" }
                        : { bg: "#fff0f0", border: "#e53935", color: "#e53935" };
                      const isSelected = network === n.id;
                      return (
                        <TouchableOpacity key={n.id} onPress={() => { setNetwork(n.id); setNetworkError(""); }} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.full, borderWidth: 2.5, borderColor: isSelected ? netStyle.border : "#e2e8f0", backgroundColor: isSelected ? netStyle.bg : "white", elevation: isSelected ? 3 : 0 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: netStyle.border, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: "white", fontWeight: "900", fontSize: 7 }}>{n.id === "MTN" ? "MTN" : "Airtel"}</Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: netStyle.color }}>{n.label}</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={14} color={netStyle.border} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Button title="Next" onPress={() => setStep(2)} disabled={!network} size="lg" style={{ marginTop: 16 }} />
                </Card>
              )}

              {/* Step 2: Phone */}
              {step === 2 && (
                <Card>
                  <Text style={styles.sectionTitle}>Enter Your Phone Number</Text>
                  <Text style={styles.label}>Sender Phone Number</Text>
                  <TextInput placeholder="e.g. 08012345678" value={senderNumber} onChangeText={handleNumberChange} keyboardType="phone-pad" maxLength={11} style={[styles.input, networkError && { borderColor: "#dc2626" }]} />
                  {detectedNetwork && !networkError && (
                    <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "600", marginTop: 4 }}>✓ Network is: {detectedNetwork}</Text>
                  )}
                  {networkError ? (
                    <View style={{ backgroundColor: "#fef2f2", borderRadius: 8, padding: 8, marginTop: 6, borderWidth: 1, borderColor: "#fecaca" }}>
                      <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600" }}>⚠ {networkError}</Text>
                    </View>
                  ) : null}
                  <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, fontStyle: "italic" }}>NB: Ignore this warning for Ported Numbers</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                    <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 0 }} />
                    <Button title="Next" onPress={() => setStep(3)} disabled={!canProceedStep2} size="lg" style={{ flex: 1 }} />
                  </View>
                </Card>
              )}

              {/* Step 3: Amount + Payout */}
              {step === 3 && (
                <Card>
                  <Text style={styles.sectionTitle}>Enter Details</Text>
                  <View style={styles.rateBox}>
                    <Text style={{ fontSize: 13, color: "#374151" }}>Rate</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.primary }}>{config?.rate || 80}%</Text>
                  </View>

                  <Text style={styles.label}>Amount to Convert (₦)</Text>
                  <TextInput placeholder={`Min ₦${config?.minAmount || 100}`} value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} />

                  {amount ? (
                    <View style={styles.receiveBox}>
                      <Text style={{ fontSize: 13, color: "#374151" }}>You will receive</Text>
                      <Text style={{ fontSize: 16, fontWeight: "900", color: COLORS.primary }}>₦{receiveAmount.toLocaleString()}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.label}>How do you want to receive the money?</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                    {[{ key: "wallet", label: "Wallet", icon: "💰" }, { key: "bank", label: "Bank", icon: "🏦" }].map((m) => (
                      <TouchableOpacity key={m.key} onPress={() => setPayoutMethod(m.key)} style={[styles.payoutBtn, payoutMethod === m.key && styles.payoutBtnActive]}>
                        <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                        <Text style={[styles.payoutBtnText, payoutMethod === m.key && { color: COLORS.primary, fontWeight: "700" }]}>{m.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {payoutMethod === "bank" && (
                    <View style={{ gap: 10, marginBottom: 16 }}>
                      <TextInput placeholder="Bank Name" value={bankName} onChangeText={setBankName} style={styles.input} />
                      <TextInput placeholder="Account Number" value={bankAccount} onChangeText={(v) => setBankAccount(v.replace(/\D/g, "").substring(0, 10))} keyboardType="numeric" maxLength={10} style={styles.input} />
                      <TextInput placeholder="Account Name" value={bankAccountName} onChangeText={setBankAccountName} style={styles.input} />
                    </View>
                  )}

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Button title="Back" variant="outline" onPress={() => setStep(2)} style={{ flex: 0 }} />
                    <Button title="Next" onPress={() => setStep(4)} disabled={!canProceedStep3} size="lg" style={{ flex: 1 }} />
                  </View>
                </Card>
              )}

              {/* Step 4: Transfer Instructions */}
              {step === 4 && !result && (
                <Card>
                  <Text style={styles.sectionTitle}>Transfer Airtime</Text>

                  {/* Step-by-step guide */}
                  <View style={{ backgroundColor: "#eff6ff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1.5, borderColor: "#bfdbfe" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e40af", marginBottom: 8 }}>How to complete this transfer:</Text>
                    {[
                      { step: "1", text: "Tap the copy button below to copy the number" },
                      { step: "2", text: `Dial *499*₦${parseFloat(amount).toLocaleString()}*${selectedNet?.receiveNumber}# to transfer airtime` },
                      { step: "3", text: "Come back and tap \"Mark as Transferred\"" },
                      { step: "4", text: "Tap \"Contact Admin\" on WhatsApp to confirm" },
                    ].map((s, i) => (
                      <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: "white" }}>{s.step}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: "#374151", flex: 1, lineHeight: 18 }}>{s.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Number to transfer to */}
                  <View style={styles.transferBox}>
                    <Text style={{ fontSize: 13, color: "#c2410c", fontWeight: "600", marginBottom: 8 }}>Transfer ₦{parseFloat(amount).toLocaleString()} airtime to:</Text>
                    <View style={styles.numberBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: COLORS.muted }}>{network} Number</Text>
                        <Text style={{ fontSize: 16, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>{selectedNet?.receiveNumber}</Text>
                      </View>
                      <TouchableOpacity onPress={() => { Clipboard.setString(selectedNet?.receiveNumber || ""); Toast.show({ type: "success", text1: "Number copied!" }); }} style={styles.copyBtn}>
                        <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Summary */}
                  <View style={styles.summaryBox}>
                    {[
                      ["Network", network],
                      ["Your Number", senderNumber],
                      ["Amount", `₦${parseFloat(amount).toLocaleString()}`],
                      ["You Receive", `₦${receiveAmount.toLocaleString()}`],
                      ["Payout", payoutMethod === "wallet" ? "Wallet Balance" : `${bankName} - ${bankAccount}`],
                    ].map(([k, v]) => (
                      <View key={k} style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>{k}</Text>
                        <Text style={styles.summaryVal}>{v}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Warning */}
                  <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#fefce8", borderRadius: 10, padding: 10, marginTop: 12, marginBottom: 12, borderWidth: 1, borderColor: "#fde68a", alignItems: "flex-start" }}>
                    <Ionicons name="warning" size={14} color="#ca8a04" style={{ marginTop: 1 }} />
                    <Text style={{ fontSize: 12, color: "#854d0e", flex: 1, lineHeight: 18 }}>Only transfer from a {network} number. Wrong network may result in loss of funds.</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                    <Button title="Back" variant="outline" onPress={() => setStep(3)} style={{ flex: 0 }} />
                    <Button title={submitting ? "Processing..." : "✓ Mark as Transferred"} onPress={doSubmit} disabled={submitting} size="lg" style={{ flex: 1 }} />
                  </View>
                </Card>
              )}

              {/* Step 4b: After marking — WhatsApp guidance */}
              {step === 4 && result && (
                <Card style={{ padding: 24, alignItems: "center" }}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={36} color={COLORS.primary} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 4 }}>Transfer Noted!</Text>
                  <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", marginBottom: 16, lineHeight: 18 }}>
                    Please contact admin on WhatsApp to confirm you've transferred the airtime. Include your transfer screenshot as proof.
                  </Text>

                  <View style={styles.summaryBox}>
                    {[
                      ["Amount to Send", `₦${parseFloat(amount).toLocaleString()}`],
                      ["Send To", `${network}: ${selectedNet?.receiveNumber}`],
                      ["You Receive", `₦${receiveAmount.toLocaleString()}`],
                      ["Ref", result.request?.ref],
                    ].map(([k, v]) => (
                      <View key={k} style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>{k}</Text>
                        <Text style={[styles.summaryVal, { maxWidth: "60%", textAlign: "right" }]}>{v}</Text>
                      </View>
                    ))}
                  </View>

                  {(() => {
                    const msg = encodeURIComponent(
                      `Hello, I've completed an airtime transfer for Airtime to Cash.\n\nAmount: ₦${parseFloat(amount).toLocaleString()}\nName: ${(user?.firstname || "")} ${(user?.lastname || "")}\nEmail: ${user?.email || ""}\nPhone: ${senderNumber}\n\nPlease verify and credit my account.`
                    );
                    const num = (config?.whatsapp || "").replace(/[^0-9]/g, "").replace(/^0+/, "");
                    if (!num) {
                      Toast.show({ type: "info", text1: "WhatsApp contact not available" });
                      return;
                    }
                    return (
                      <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/234${num}?text=${msg}`)} style={styles.whatsappBtn}>
                        <Ionicons name="logo-whatsapp" size={16} color="white" />
                        <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Contact Admin (WhatsApp)</Text>
                      </TouchableOpacity>
                    );
                  })()}

                  <Button title="View History" variant="outline" onPress={() => { resetForm(); setTab("history"); }} size="lg" />
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: "white", borderRadius: RADIUS.lg, padding: 4, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  tabTextActive: { color: "white" },
  steps: { flexDirection: "row", justifyContent: "space-between" },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  stepDone: { backgroundColor: COLORS.primary },
  stepCurrent: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 12, fontWeight: "700", color: COLORS.muted },
  stepLabel: { fontSize: 10, color: COLORS.muted },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.black, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.black, backgroundColor: "white" },
  networkBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, borderWidth: 2, borderColor: "transparent", backgroundColor: "#f1f5f9" },
  networkBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  networkBtnText: { fontSize: 13, fontWeight: "800", color: "#374151" },
  rateBox: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f0fdf4", borderRadius: RADIUS.md, padding: 12, marginBottom: 12 },
  receiveBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f0fdf4", borderRadius: RADIUS.md, padding: 12, marginBottom: 12 },
  payoutBtn: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: "transparent", backgroundColor: "#f1f5f9", gap: 4 },
  payoutBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  payoutBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  transferBox: { backgroundColor: "#fff7ed", borderRadius: RADIUS.md, padding: 12, marginBottom: 12 },
  numberBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderRadius: RADIUS.md, padding: 12 },
  copyBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  summaryBox: { backgroundColor: "#f9f9fb", borderRadius: RADIUS.md, padding: 12, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryKey: { fontSize: 12, color: COLORS.muted },
  summaryVal: { fontSize: 12, fontWeight: "700", color: COLORS.black },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  whatsappBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg, backgroundColor: "#25D366", marginBottom: 12, width: "100%" },
});
