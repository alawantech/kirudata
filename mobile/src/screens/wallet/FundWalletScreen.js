import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import DateTimePicker from "@react-native-community/datetimepicker";
import client from "../../api/client";
import { Card, SectionHeader } from "../../components/Card";
import { Header } from "../../components/Header";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

function fmt(n) {
  if (n == null) return "₦0.00";
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

export default function FundWalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState("auto");
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [manualBank, setManualBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsKyc, setNeedsKyc] = useState(false);
  const [kycPending, setKycPending] = useState(false);
  const [kycType, setKycType] = useState("bvn"); // "bvn" or "nin"
  const [kycValue, setKycValue] = useState("");
  const [kycDob, setKycDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [dynamicAmount, setDynamicAmount] = useState("");
  const [dynamicLoading, setDynamicLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [accRes, walletRes, settingsRes] = await Promise.all([
        client.get("/user/virtual-accounts"),
        client.get("/user/wallet"),
        client
          .get("/public/settings")
          .catch(() => ({ data: { data: { settings: {} } } })),
      ]);
      setAccounts(accRes.data.data?.accounts || []);
      setNeedsKyc(accRes.data.data?.needsKyc || false);
      setKycPending(accRes.data.data?.kycPending || false);
      setBalance(walletRes.data.data?.wallet);
      const s = settingsRes.data.data?.settings || {};
      if (s.bankName || s.accountName || s.accountNo) {
        setManualBank({
          bankName: s.bankName,
          accountName: s.accountName,
          accountNo: s.accountNo,
        });
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to load wallet info" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setStringAsync(text);
      Toast.show({ type: "success", text1: `${label} copied!` });
    } catch {
      Toast.show({ type: "error", text1: "Could not copy" });
    }
  };

  const handleKycSubmit = async () => {
    if (!kycValue || kycValue.length < 10) {
      Toast.show({
        type: "error",
        text1: `Please enter a valid ${kycType.toUpperCase()}`,
      });
      return;
    }
    if (!kycDob) {
      Toast.show({
        type: "error",
        text1: "Please enter your date of birth",
      });
      return;
    }
    setSubmittingKyc(true);
    try {
      await client.post("/user/kyc", { 
        method: kycType.toUpperCase(),
        [kycType]: kycValue,
        dob: kycDob
      });
      Toast.show({
        type: "success",
        text1: "Verification submitted!",
        text2: "Generating your account now...",
      });
      setKycValue("");
      setKycDob("");
      // Refresh to trigger auto-healing with the new KYC
      await fetchData();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err.response?.data?.msg || "Failed to submit verification",
      });
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleDynamicPay = async () => {
    const amt = parseFloat(dynamicAmount);
    if (!amt || amt < 100) {
      Toast.show({ type: "error", text1: "Minimum amount is ₦100" });
      return;
    }
    setDynamicLoading(true);
    try {
      const res = await client.post("/user/fund-wallet/initialize", { amount: amt });
      const { authorization_url } = res.data.data;
      if (authorization_url) {
        await WebBrowser.openBrowserAsync(authorization_url);
        Toast.show({ type: "info", text1: "Payment completed", text2: "Your wallet will be updated shortly." });
        fetchData();
      } else {
        Toast.show({ type: "error", text1: "Failed to initialize payment." });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Failed to initialize payment." });
    } finally {
      setDynamicLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Header gradient */}
        <LinearGradient
          colors={["#0f172a", "#1e3a8a", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGrad, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", top: insets.top + 16, left: 16, zIndex: 10, padding: 4 }}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Fund Wallet</Text>
          <Text style={styles.headerSub}>
            Transfer to your dedicated account number
          </Text>

          <View style={styles.balanceChip}>
            <Ionicons name="wallet" size={16} color={COLORS.primary} />
            <Text style={styles.balanceText}>
              Balance: {loading ? "..." : fmt(balance)}
            </Text>
          </View>
        </LinearGradient>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "auto" && styles.tabBtnActive]}
            onPress={() => setActiveTab("auto")}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeTab === "auto" ? "#fff" : COLORS.muted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "auto" && styles.tabBtnTextActive,
              ]}
            >
              Automated
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "manual" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("manual")}
          >
            <Ionicons
              name="business-outline"
              size={14}
              color={activeTab === "manual" ? "#fff" : COLORS.muted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "manual" && styles.tabBtnTextActive,
              ]}
            >
              Manual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "dynamic" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("dynamic")}
          >
            <Ionicons
              name="card-outline"
              size={14}
              color={activeTab === "dynamic" ? "#fff" : COLORS.muted}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "dynamic" && styles.tabBtnTextActive,
              ]}
            >
              Dynamic
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {activeTab === "auto" ? (
            <>
              {/* How to fund */}
              <View style={styles.stepBox}>
                <Text style={styles.stepTitle}>How to Fund Your Wallet</Text>
                {[
                  "Copy your unique account number below",
                  "Transfer any amount from your bank app",
                  "Your wallet is credited automatically",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <SectionHeader title="Your Virtual Account Numbers" />

              {loading ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ padding: 32 }}
                />
              ) : accounts.length === 0 ? (
                kycPending ? (
                  <Card style={[styles.kycCard, { borderColor: COLORS.warning, borderWidth: 1 }]}>
                    <View style={styles.kycHeader}>
                      <Ionicons
                        name="time-outline"
                        size={24}
                        color={COLORS.warning}
                      />
                      <Text style={styles.kycTitle}>Verification in Progress</Text>
                    </View>
                    <Text style={[styles.kycDesc, { marginBottom: 16 }]}>
                      Your KYC details have been received and are being processed. 
                      Your virtual accounts will appear here once verified.
                    </Text>
                    <TouchableOpacity 
                      style={[styles.kycSubmitBtn, { width: '100%', height: 45 }]}
                      onPress={fetchData}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800' }}>Check Status</Text>
                    </TouchableOpacity>
                  </Card>
                ) : needsKyc ? (
                  <Card style={styles.kycCard}>
                    <View style={styles.kycHeader}>
                      <Ionicons
                        name="shield-checkmark"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text style={styles.kycTitle}>Account Verification</Text>
                    </View>
                    <Text style={styles.kycDesc}>
                      To comply with CBN regulations, please provide your BVN or
                      NIN to generate your unique bank account numbers.
                    </Text>

                    <View style={styles.kycTypeRow}>
                      <TouchableOpacity
                        style={[
                          styles.kycTypeBtn,
                          kycType === "bvn" && styles.kycTypeBtnActive,
                        ]}
                        onPress={() => setKycType("bvn")}
                      >
                        <Text
                          style={[
                            styles.kycTypeText,
                            kycType === "bvn" && styles.kycTypeTextActive,
                          ]}
                        >
                          BVN
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.kycTypeBtn,
                          kycType === "nin" && styles.kycTypeBtnActive,
                        ]}
                        onPress={() => setKycType("nin")}
                      >
                        <Text
                          style={[
                            styles.kycTypeText,
                            kycType === "nin" && styles.kycTypeTextActive,
                          ]}
                        >
                          NIN
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.kycFieldsGroup}>
                      <TouchableOpacity 
                        style={[styles.kycInputSecondary, { justifyContent: 'center' }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={{ color: kycDob ? COLORS.text : COLORS.muted }}>
                          {kycDob ? kycDob.split('-').reverse().join('-') : "Select Date of Birth"}
                        </Text>
                      </TouchableOpacity>

                      {showDatePicker && (
                        <DateTimePicker
                          value={new Date(kycDob || "2000-01-01")}
                          mode="date"
                          display="default"
                          maximumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                              const y = selectedDate.getFullYear();
                              const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                              const d = String(selectedDate.getDate()).padStart(2, '0');
                              setKycDob(`${y}-${m}-${d}`);
                            }
                          }}
                        />
                      )}
                    </View>

                    <View style={styles.kycInputCont}>
                      <TextInput
                        style={styles.kycInput}
                        placeholder={`Enter 11-digit ${kycType.toUpperCase()}`}
                        value={kycValue}
                        onChangeText={setKycValue}
                        keyboardType="number-pad"
                        maxLength={11}
                        placeholderTextColor={COLORS.muted}
                      />
                      <TouchableOpacity
                        style={styles.kycSubmitBtn}
                        onPress={handleKycSubmit}
                        disabled={submittingKyc}
                      >
                        {submittingKyc ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.kycNote}>
                      {kycType === "bvn" ? "Charge: ₦10" : "Charge: ₦70"} • Secure verification.
                    </Text>
                  </Card>
                ) : (
                  <View style={styles.empty}>
                    <Ionicons
                      name="bank-outline"
                      size={48}
                      color={COLORS.border}
                    />
                    <Text style={styles.emptyTitle}>No account assigned yet</Text>
                    <Text style={styles.emptyDesc}>
                      Contact support if this persists
                    </Text>
                  </View>
                )
              ) : (
                accounts.map((acc, i) => (
                  <Card key={i} style={styles.accountCard}>
                    <LinearGradient
                      colors={["#eff6ff", "#f0f9ff"]}
                      style={styles.accountGrad}
                    >
                      <View style={styles.accountTop}>
                        <View>
                          <Text style={styles.bankName}>{acc.bankName}</Text>
                          <Text style={styles.accountName}>
                            Virtual Account
                          </Text>
                        </View>
                        <View style={styles.bankIcon}>
                          <Ionicons
                            name="business"
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                      </View>

                      <View style={styles.accountNumberRow}>
                        <Text style={styles.accountNumber}>
                          {acc.accountNumber || acc.number}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            copyToClipboard(
                              acc.accountNumber || acc.number,
                              "Account number",
                            )
                          }
                          style={styles.copyBtn}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color={COLORS.primary}
                          />
                          <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.accountFooter}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={COLORS.success}
                        />
                        <Text style={styles.footerText}>
                          Instant credit • No transfer fees
                        </Text>
                      </View>
                    </LinearGradient>
                  </Card>
                ))
              )}

              {/* Note */}
              <View style={styles.noteBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.warning}
                />
                <Text style={styles.noteText}>
                  Only transfer from your registered bank account. Third-party
                  transfers may take longer to verify.
                </Text>
              </View>
            </>
          ) : activeTab === "dynamic" ? (
            /* Dynamic tab */
            <>
              <View style={styles.stepBox}>
                <Text style={styles.stepTitle}>Fund Wallet Online</Text>
                {[
                  "Enter the amount you want to fund",
                  "Tap Pay Now and choose your payment method",
                  "Complete payment — wallet is credited instantly",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <Card style={{ padding: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.muted, marginBottom: 8 }}>
                  AMOUNT (₦)
                </Text>
                <TextInput
                  style={{
                    height: 50,
                    backgroundColor: "#f8fafc",
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    fontSize: 18,
                    fontWeight: "700",
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    marginBottom: 12,
                  }}
                  placeholder="Enter amount"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="number-pad"
                  value={dynamicAmount}
                  onChangeText={setDynamicAmount}
                />

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => setDynamicAmount(String(amt))}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: RADIUS.full,
                        backgroundColor: dynamicAmount === String(amt) ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: dynamicAmount === String(amt) ? "#fff" : COLORS.muted,
                      }}>
                        ₦{amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.kycSubmitBtn, { width: "100%", height: 50, borderRadius: RADIUS.md }]}
                  onPress={handleDynamicPay}
                  disabled={dynamicLoading || !dynamicAmount || parseFloat(dynamicAmount) < 100}
                >
                  {dynamicLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              </Card>

              <View style={styles.noteBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.warning}
                />
                <Text style={styles.noteText}>
                  You can pay with your card, bank transfer, or USSD. Wallet is credited instantly after payment.
                </Text>
              </View>
            </>
          ) : (
            /* Manual tab */
            <>
              <View style={styles.stepBox}>
                <Text style={styles.stepTitle}>Manual Bank Transfer</Text>
                {[
                  "Copy the account details below",
                  "Transfer your exact desired amount",
                  "Send payment screenshot to support",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {loading ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ padding: 32 }}
                />
              ) : !manualBank ? (
                <View style={styles.empty}>
                  <Ionicons
                    name="business-outline"
                    size={48}
                    color={COLORS.border}
                  />
                  <Text style={styles.emptyTitle}>Bank details not set</Text>
                  <Text style={styles.emptyDesc}>
                    Contact admin to set up bank account details.
                  </Text>
                </View>
              ) : (
                <Card style={{ padding: 20 }}>
                  {[
                    { label: "BANK NAME", value: manualBank.bankName },
                    { label: "ACCOUNT NUMBER", value: manualBank.accountNumber },
                    { label: "ACCOUNT NAME", value: manualBank.accountName },
                  ].map((item) => (
                    <View key={item.label} style={styles.manualRow}>
                      <Text style={styles.manualLabel}>{item.label}</Text>
                      <View style={styles.manualValueRow}>
                        <Text style={styles.manualValue}>{item.value}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Clipboard.setStringAsync(item.value);
                            Toast.show({ type: "success", text1: "Copied!" });
                          }}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={18}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              <View style={styles.noteBox}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={COLORS.warning}
                />
                <Text style={styles.noteText}>
                  After transferring, send your payment screenshot to our
                  support team via WhatsApp or the in-app chat for faster
                  confirmation.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: 4,
    ...SHADOW.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.muted },
  tabBtnTextActive: { color: "#fff" },

  manualRow: { marginBottom: 12 },
  manualLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  manualValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  manualValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.black,
    flex: 1,
    marginRight: 8,
  },

  headerGrad: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
  },
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -60,
    right: -60,
  },
  circle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -40,
    left: -30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  balanceText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },

  stepBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.black,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  stepText: { flex: 1, fontSize: 13, color: COLORS.body, lineHeight: 20 },

  accountCard: { overflow: "hidden", padding: 0, borderRadius: RADIUS.xl },
  accountGrad: { padding: 20 },
  accountTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.black,
    marginBottom: 2,
  },
  accountName: { fontSize: 13, color: COLORS.muted },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  accountNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
  },
  kycFieldsGroup: {
    gap: 8,
    marginBottom: 12,
  },
  kycInputSecondary: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.surface,
  },
  accountNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "15",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  accountFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12, color: COLORS.success, fontWeight: "600" },

  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  emptyDesc: { fontSize: 13, color: COLORS.muted },

  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.warning + "15",
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.warning + "30",
  },
  noteText: { flex: 1, fontSize: 12, color: COLORS.body, lineHeight: 18 },

  // KYC Styles
  kycCard: { padding: 20 },
  kycHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  kycTitle: { fontSize: 18, fontWeight: "800", color: COLORS.black },
  kycDesc: { fontSize: 13, color: COLORS.muted, lineHeight: 20, marginBottom: 20 },
  kycTypeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  kycTypeBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  kycTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "08" },
  kycTypeText: { fontSize: 14, fontWeight: "700", color: COLORS.muted },
  kycTypeTextActive: { color: COLORS.primary },
  kycInputCont: { flexDirection: "row", gap: 10, marginBottom: 12 },
  kycInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#f8fafc",
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kycSubmitBtn: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  kycNote: { fontSize: 11, color: COLORS.muted, textAlign: "center" },
});
