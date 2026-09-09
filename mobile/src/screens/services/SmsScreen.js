import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Card, SectionHeader } from "../../components/Card";
import { Header } from "../../components/Header";
import { TransactionPinModal } from "../../components/TransactionPinModal";
import { COLORS, RADIUS } from "../../constants/theme";

const MAX_CHARS = 160;

export default function SmsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [phones, setPhones] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [smsConfig, setSmsConfig] = useState({ price: 0, status: "Off" });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    client
      .get("/sms/config")
      .then((r) => setSmsConfig(r.data.data || { price: 0, status: "Off" }))
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const price = parseFloat(smsConfig.price || 0);
  const charsLeft = MAX_CHARS - message.length;

  const phoneList = phones
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  const phoneCount = phoneList.length;
  const totalCost = price * phoneCount;

  const handleContinue = () => {
    if (!phones.trim()) {
      Toast.show({ type: "error", text1: "Enter recipient phone number(s)" });
      return;
    }
    if (phoneCount > 10000) {
      Toast.show({ type: "error", text1: "Maximum 10,000 numbers per request" });
      return;
    }
    for (const num of phoneList) {
      if (!/^\d{10,14}$/.test(num)) {
        Toast.show({ type: "error", text1: `Invalid number: ${num}` });
        return;
      }
    }
    if (!message.trim()) {
      Toast.show({ type: "error", text1: "Enter your message" });
      return;
    }
    if (message.length > MAX_CHARS) {
      Toast.show({
        type: "error",
        text1: `Message cannot exceed ${MAX_CHARS} characters`,
      });
      return;
    }
    if (smsConfig.status !== "On") {
      Toast.show({
        type: "error",
        text1: "Bulk SMS service is currently unavailable",
      });
      return;
    }
    setConfirm(true);
  };

  const doSubmit = async (pin) => {
    setLoading(true);
    try {
      const r = await client.post("/sms/send", {
        phone: phones.trim(),
        message,
        senderName: senderName.trim(),
        pin,
      });
      setPinModal(false);
      setConfirm(false);
      setSent(true);
      const ref = r?.data?.data?.ref || r?.data?.ref;
      if (ref) return navigation.navigate("Receipt", { ref });
      Toast.show({ type: "success", text1: "SMS sent successfully! 🎉" });
    } catch (err) {
      setPinModal(false);
      Toast.show({
        type: "error",
        text1: err?.response?.data?.msg || "Failed to send SMS",
      });
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhones("");
    setSenderName("");
    setMessage("");
    setConfirm(false);
    setSent(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="Bulk SMS" onBack={() => navigation.goBack()} />
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
          {/* Price badge */}
          {!loadingConfig && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>
                {smsConfig.status === "On"
                  ? `₦${price.toLocaleString()} per SMS`
                  : "Service currently unavailable"}
              </Text>
            </View>
          )}

          {sent ? (
            <Card>
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <Text style={styles.successEmoji}>✅</Text>
                </View>
                <Text style={styles.successTitle}>SMS Sent!</Text>
                <Text style={styles.successSub}>
                  Your message was delivered to {phoneCount} recipient{phoneCount !== 1 ? "s" : ""}
                </Text>
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Recipients</Text>
                    <Text style={styles.detailVal}>
                      {phoneCount === 1 ? phones : `${phoneCount} numbers`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Sender</Text>
                    <Text style={styles.detailVal}>{senderName || "API"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Total cost</Text>
                    <Text style={styles.detailVal}>
                      ₦{totalCost.toLocaleString()}
                    </Text>
                  </View>
                  <View
                    style={[styles.detailRow, { alignItems: "flex-start" }]}
                  >
                    <Text style={styles.detailKey}>Message</Text>
                    <Text
                      style={[
                        styles.detailVal,
                        { flex: 1, textAlign: "right" },
                      ]}
                    >
                      {message}
                    </Text>
                  </View>
                </View>
                <Button
                  title="Send Another SMS"
                  onPress={handleReset}
                  size="lg"
                />
              </View>
            </Card>
          ) : (
            <>
              {/* Phone Numbers */}
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.black }}>
                    Phone Numbers
                  </Text>
                  {phoneCount > 0 && (
                    <View style={{ backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.sms }}>
                        {phoneCount} number{phoneCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                </View>
                <TextInput
                  placeholder="08012345678,08098765432"
                  value={phones}
                  onChangeText={setPhones}
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1.5,
                    borderColor: COLORS.border,
                    borderRadius: RADIUS.md,
                    padding: 12,
                    fontSize: 14,
                    color: COLORS.black,
                    minHeight: 70,
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  }}
                  textAlignVertical="top"
                />
                <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
                  Separate numbers with commas (no spaces). Max 10,000.
                </Text>
              </Card>

              {/* Sender Name */}
              <Card>
                <Input
                  label="Sender Name"
                  value={senderName}
                  onChangeText={setSenderName}
                  placeholder="e.g. KiruData (optional)"
                  maxLength={11}
                />
                <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
                  Max 11 characters. Leave empty for default.
                </Text>
              </Card>

              {/* Message Input */}
              <Card>
                <View style={styles.msgHeader}>
                  <SectionHeader title="Message" />
                  <Text
                    style={[
                      styles.charCount,
                      charsLeft < 20 && styles.charCountWarning,
                    ]}
                  >
                    {charsLeft}/{MAX_CHARS}
                  </Text>
                </View>
                <TextInput
                  placeholder="Type your message here..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  maxLength={MAX_CHARS}
                  style={styles.messageInput}
                  textAlignVertical="top"
                />
              </Card>

              {/* Confirm summary */}
              {confirm && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Confirm SMS</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Recipients</Text>
                    <Text style={styles.summaryVal}>
                      {phoneCount === 1 ? phones : `${phoneCount} numbers`}
                    </Text>
                  </View>
                  <View
                    style={[styles.summaryRow, { alignItems: "flex-start" }]}
                  >
                    <Text style={styles.summaryKey}>Message</Text>
                    <Text
                      style={[
                        styles.summaryVal,
                        { flex: 1, textAlign: "right" },
                      ]}
                    >
                      {message}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Total</Text>
                    <Text
                      style={[
                        styles.summaryVal,
                        { color: COLORS.sms, fontWeight: "900" },
                      ]}
                    >
                      ₦{totalCost.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {!sent && (
                <Button
                  title={confirm ? "Confirm & Pay" : "Continue"}
                  onPress={confirm ? () => setPinModal(true) : handleContinue}
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
  priceBadge: {
    backgroundColor: "#e0f2fe",
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: "center",
  },
  priceBadgeText: {
    color: "#0369a1",
    fontWeight: "700",
    fontSize: 14,
  },
  msgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },
  charCountWarning: {
    color: COLORS.danger,
  },
  messageInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.black,
    minHeight: 100,
    fontFamily: undefined,
  },
  summaryBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryKey: {
    fontSize: 13,
    color: COLORS.muted,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.black,
  },
  successBox: {
    alignItems: "center",
    padding: 8,
    gap: 8,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successEmoji: {
    fontSize: 28,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.black,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 8,
  },
  detailsBox: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailKey: {
    fontSize: 12,
    color: COLORS.muted,
    flexShrink: 0,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.black,
  },
});
