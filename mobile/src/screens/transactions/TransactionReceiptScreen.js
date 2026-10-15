import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import Toast from "react-native-toast-message";
import client from "../../api/client";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

const API_BASE = client.defaults?.baseURL || "";

const SVC = {
  airtime: { color: "#f97316", bg: "#fff7ed", icon: "call", label: "Airtime" },
  atc: { color: "#0d9488", bg: "#ccfbf1", icon: "repeat", label: "Airtime to Cash" },
  data: { color: "#4f46e5", bg: "#eff6ff", icon: "cellular", label: "Data" },
  cable: { color: "#7c3aed", bg: "#f5f3ff", icon: "tv", label: "Cable TV" },
  electricity: { color: "#d97706", bg: "#fffbeb", icon: "flash", label: "Electricity" },
  exam: { color: "#059669", bg: "#ecfdf5", icon: "school", label: "Exam Pin" },
  sms: { color: "#0369a1", bg: "#f0f9ff", icon: "chatbubble", label: "Bulk SMS" },
  wallet: { color: "#0891b2", bg: "#ecfeff", icon: "wallet", label: "Wallet" },
  card: { color: "#16a34a", bg: "#f0fdf4", icon: "card", label: "Card" },
  pin: { color: "#db2777", bg: "#fdf2f8", icon: "key", label: "Pin" },
  other: { color: "#0891b2", bg: "#ecfeff", icon: "swap-horizontal", label: "Transaction" },
};

function getSvc(cat, name) {
  if (SVC[cat]) return SVC[cat];
  const l = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(SVC)) if (l.includes(k)) return v;
  return SVC.other;
}

function statusMeta(s) {
  if (s === 1 || s === "success" || s === "successful")
    return { label: "Successful", color: COLORS.success };
  if (s === 0 || s === "failed")
    return { label: "Failed", color: COLORS.danger };
  return { label: "Pending", color: "#fbbf24" };
}

function fmt(n) {
  return "\u20A6" + Math.abs(parseFloat(n || 0)).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normaliseUrl(u) {
  if (!u) return null;
  try {
    const url = new URL(u);
    const base = new URL(API_BASE);
    if (url.origin !== base.origin) url.origin = base.origin;
    return url.toString();
  } catch {
    return u;
  }
}

function toFileUri(uri) {
  if (!uri) return uri;
  return uri.startsWith("file://") ? uri : "file://" + uri;
}

function parseServicedesc(desc, servicename, apiResponseLog) {
  if (!desc || desc === "\u2014") return {};
  let token;
  if (apiResponseLog && servicename === "Electricity") {
    try {
      const parsed = typeof apiResponseLog === "string" ? JSON.parse(apiResponseLog) : apiResponseLog;
      if (parsed.token) token = parsed.token;
    } catch {}
  }
  if (servicename !== "Electricity") return { description: desc };
  const parts = desc.split(" | ").map((p) => p.trim());
  const first = parts[0] || desc;
  const rest = parts.length > 1 ? parts.slice(1) : [];
  const meterTypes = ["Prepaid", "Postpaid"];
  let meterType = "";
  let providerName = first;
  for (const mt of meterTypes) {
    if (first.toLowerCase().includes(mt.toLowerCase())) {
      meterType = mt;
      providerName = first.replace(new RegExp(mt, "i"), "").replace(/\s*-\s*\d+/, "").trim();
      break;
    }
  }
  const meterMatch = first.match(/(\d{10,})/);
  const meterNumber = meterMatch ? meterMatch[1] : undefined;
  if (!providerName || providerName === first)
    providerName = first.replace(/\d{10,}/, "").replace(/\s*-\s*$/, "").trim();
  return {
    description: providerName || undefined,
    meterNumber,
    meterType: meterType || undefined,
    customerName: rest[0] || undefined,
    address: rest[1] || undefined,
    token,
  };
}

export default function TransactionReceiptScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const ref = route.params?.ref;
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const [siteName, setSiteName] = useState("Kiru Data");
  const [sharing, setSharing] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const shotRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await client.get(`/user/transactions/${ref}`);
      setTx(r.data.data?.transaction || r.data.data);
    } catch {
      Toast.show({ type: "error", text1: "Could not load receipt" });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    load();
    client
      .get("/public/settings")
      .then((r) => {
        const s = r.data?.data?.settings;
        if (s?.logoUrl) setLogoUrl(normaliseUrl(s.logoUrl));
        if (s?.sitename) setSiteName(s.sitename);
      })
      .catch(() => {});
  }, [load]);

  const isElectricity = tx?.servicename === "Electricity";
  const pd = tx ? parseServicedesc(tx.servicedesc || "", tx.servicename, tx.apiResponseLog) : {};
  const st = tx ? statusMeta(tx.status) : statusMeta("pending");
  const svc = tx ? getSvc(tx.category || "other", tx.servicename) : SVC.other;

  const rows = tx
    ? isElectricity
      ? [
          pd.token && { label: "Token", value: pd.token, mono: true, highlight: true },
          { label: "Transaction ID", value: tx.transref || tx.ref, mono: true },
          { label: "Status", value: st.label },
          pd.description && { label: "Product", value: pd.description },
          { label: "Amount", value: fmt(tx.amount), highlight: true },
          pd.meterNumber && { label: "Meter", value: pd.meterNumber, mono: true },
          pd.meterType && { label: "Meter Type", value: pd.meterType },
          pd.customerName && { label: "Customer Name", value: pd.customerName },
          pd.address && { label: "Customer Address", value: pd.address },
          { label: "Date", value: fmtDate(tx.date || tx.createdAt) },
        ].filter(Boolean)
      : [
          { label: "Reference", value: tx.transref || tx.ref, mono: true },
          { label: "Service", value: tx.servicename || svc.label },
          { label: "Description", value: tx.servicedesc || "\u2014" },
          { label: "Amount", value: fmt(tx.amount), highlight: true },
          { label: "Date", value: fmtDate(tx.date || tx.createdAt) },
        ]
    : [];

  const rowIcon = (label) => {
    switch (label) {
      case "Token":
        return "key";
      case "Transaction ID":
      case "Reference":
        return "pricetag";
      case "Amount":
        return "wallet";
      case "Date":
        return "calendar";
      case "Status":
        return "checkmark-circle";
      case "Customer Name":
        return "person";
      case "Customer Address":
        return "location";
      case "Product":
        return "cube";
      case "Meter":
        return "speedometer";
      case "Meter Type":
        return "information-circle";
      case "Service":
        return "grid";
      default:
        return "document-text";
    }
  };

  const rowIconColor = (label) => {
    if (label === "Token") return "#4f46e5";
    if (label === "Amount") return "#4f46e5";
    if (label === "Status") return "#10b981";
    return "#6366f1";
  };

  const buildReceiptHTML = () => {
    if (!tx) return "";
    let tokenHTML = "";
    if (pd.token) {
      tokenHTML = `
        <div style="border:2px solid #4f46e5;background:#eef2ff;border-radius:14px;padding:14px;text-align:center;margin:0 20px 14px;">
          <div style="font-size:10px;color:#4338ca;font-weight:700;letter-spacing:1.5px;margin-bottom:4px;">PREPAID TOKEN</div>
          <div style="font-size:16px;font-weight:700;color:#09090b;font-family:monospace;">${pd.token}</div>
        </div>`;
    }

    let detailsHTML = "";
    rows.forEach((r, i) => {
      const border = i < rows.length - 1 ? "border-bottom:1px solid #f1f5f9;" : "";
      const weight = r.highlight ? "font-weight:900;font-size:15px;" : "font-weight:600;font-size:13px;";
      const mono = r.mono ? "font-family:monospace;font-size:12px;" : "";
      detailsHTML += `<tr><td style="padding:11px 16px;${border}color:#64748b;font-size:13px;">${r.label}</td><td style="padding:11px 16px;${border}${weight}${mono}text-align:right;color:#09090b;">${r.value}</td></tr>`;
    });

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:16px;background:#f8fafc;}</style></head><body>
      <div style="max-width:400px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:20px;padding:28px 20px 22px;text-align:center;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
          ${logoUrl ? `<div style="background:rgba(15,23,42,0.55);border:1px solid rgba(255,255,255,0.15);border-radius:14px;width:52px;height:52px;margin:0 auto 8px;padding:6px;display:flex;align-items:center;justify-content:center;"><img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;" /></div>` : `<div style="width:52px;height:52px;border-radius:14px;background:rgba(15,23,42,0.55);border:1px solid rgba(255,255,255,0.15);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:22px;font-weight:900;">${siteName.charAt(0)}</span></div>`}
          <div style="color:rgba(255,255,255,.9);font-size:14px;font-weight:700;">${siteName}</div>
          <div style="color:rgba(255,255,255,.88);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:4px 0 12px;">Transaction Receipt</div>
          <div style="color:#fff;font-size:34px;font-weight:900;letter-spacing:-1px;">${fmt(tx.amount)}</div>
          <div style="display:inline-block;background:rgba(255,255,255,0.18);color:#fff;padding:5px 18px;border-radius:99px;margin-top:10px;font-size:12px;font-weight:700;">&#10003; ${st.label}</div>
          <div style="color:rgba(255,255,255,.55);font-size:12px;margin-top:10px;">${fmtDate(tx.date || tx.createdAt)}</div>
        </div>
        ${tokenHTML}
        <div style="background:#fff;border-radius:16px;overflow:hidden;margin-top:14px;">
          <table style="width:100%;border-collapse:collapse;">${detailsHTML}</table>
        </div>
        <div style="text-align:center;padding:14px;color:#a1a1aa;font-size:11px;font-weight:600;">&#128737; Secured &amp; verified by ${siteName}</div>
      </div>
    </body></html>`;
  };

  const shareFile = async (uri, mimeType) => {
    const fileUri = toFileUri(uri);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: "Share Receipt",
        UTI: mimeType === "application/pdf" ? "com.adobe.pdf" : "public.png",
      });
    } else {
      await Share.share({ url: fileUri });
    }
  };

  const shareAsImage = async () => {
    if (!tx || !shotRef.current) return;
    setShareModal(false);
    try {
      setSharing(true);
      const uri = await captureRef(shotRef, { format: "png", quality: 1 });
      await shareFile(uri, "image/png");
      Toast.show({ type: "success", text1: "Receipt ready to share" });
    } catch (e) {
      console.error(e);
      const missingNative = String(e && e.message).includes("RNViewShot");
      Toast.show({
        type: "error",
        text1: missingNative
          ? "Please update the app to share as image"
          : "Could not create image",
      });
    } finally {
      setSharing(false);
    }
  };

  const shareAsPdf = async () => {
    if (!tx) return;
    setShareModal(false);
    try {
      setSharing(true);
      const html = buildReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await shareFile(uri, "application/pdf");
      Toast.show({ type: "success", text1: "Receipt ready to share" });
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: "Failed to generate PDF" });
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (!tx) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View ref={shotRef} collapsable={false}>
          <LinearGradient colors={["#4f46e5", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            {logoUrl ? (
              <View style={styles.logoWrap}>
                <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="contain" />
              </View>
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>{siteName.charAt(0)}</Text>
              </View>
            )}

            <Text style={styles.heroSite}>{siteName}</Text>
            <Text style={styles.heroLabel}>TRANSACTION RECEIPT</Text>
            <Text style={styles.heroAmount}>{fmt(tx.amount)}</Text>

            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={14} color={st.color} />
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>

            <Text style={styles.heroDate}>{fmtDate(tx.date || tx.createdAt)}</Text>
          </LinearGradient>

          {pd.token && (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>PREPAID TOKEN</Text>
              <Text style={styles.tokenValue}>{pd.token}</Text>
            </View>
          )}

          <View style={styles.card}>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.rowIcon, { backgroundColor: rowIconColor(r.label) + "14" }]}>
                    <Ionicons name={rowIcon(r.label)} size={14} color={rowIconColor(r.label)} />
                  </View>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                </View>
                <Text
                  style={[
                    styles.rowValue,
                    r.highlight && { fontWeight: "900", fontSize: 15 },
                    r.mono && { fontFamily: "monospace", fontSize: 12 },
                  ]}
                  numberOfLines={3}
                >
                  {r.value}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>
            <Text>{"\u{1F6E1}\uFE0F"}</Text> Secured & verified by {siteName}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => Share.share({ message: `${siteName} Receipt\nRef: ${tx.transref || tx.ref}` })}
            style={styles.outlineBtn}
          >
            <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
            <Text style={styles.outlineBtnText}>Copy Ref</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShareModal(true)}
            disabled={sharing}
            style={[styles.shareBtn, sharing && { opacity: 0.7 }]}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="share-social" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>Share Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("UssdCodes")} style={styles.ussdBtn}>
          <Ionicons name="radio-outline" size={16} color="#64748b" />
          <Text style={styles.ussdBtnText}>Check balance with USSD</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("ServicesList")} style={styles.buyAgain}>
          <Text style={styles.buyAgainText}>Buy Another</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={shareModal} animationType="slide" onRequestClose={() => setShareModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShareModal(false)}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Receipt</Text>

            <TouchableOpacity onPress={shareAsImage} style={styles.modalOption}>
              <View style={[styles.modalIcon, { backgroundColor: "#eef2ff" }]}>
                <Ionicons name="image" size={20} color="#4f46e5" />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Share as Image</Text>
                <Text style={styles.modalOptionSub}>Save the receipt as a picture</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={shareAsPdf} style={styles.modalOption}>
              <View style={[styles.modalIcon, { backgroundColor: "#eef2ff" }]}>
                <Ionicons name="document-text" size={20} color="#4f46e5" />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Share as PDF</Text>
                <Text style={styles.modalOptionSub}>Formatted document receipt</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShareModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },

  hero: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  heroCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,.07)",
  },
  heroCircle2: {
    position: "absolute",
    bottom: -25,
    left: -25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,.05)",
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.15)",
    padding: 6,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: "100%", height: "100%" },
  logoFallback: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoFallbackText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  heroSite: { color: "rgba(255,255,255,.9)", fontSize: 14, fontWeight: "700" },
  heroLabel: {
    color: "rgba(255,255,255,.88)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 10,
  },
  heroAmount: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,.18)",
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  heroDate: { color: "rgba(255,255,255,.55)", fontSize: 12, marginTop: 10 },

  tokenBox: {
    borderWidth: 1.5,
    borderColor: "#4f46e5",
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },
  tokenLabel: {
    fontSize: 10,
    color: "#4338ca",
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
    fontFamily: "monospace",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...SHADOW.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 13, color: "#64748b" },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b",
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "58%",
  },

  footer: {
    textAlign: "center",
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 12,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingVertical: 14,
  },
  outlineBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    ...SHADOW.md,
  },
  shareBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  ussdBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  ussdBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },

  buyAgain: { alignItems: "center", marginTop: 14, paddingVertical: 10 },
  buyAgainText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a", marginBottom: 16 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionTitle: { fontSize: 14, fontWeight: "700", color: "#09090b" },
  modalOptionSub: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  modalCancel: { alignItems: "center", paddingVertical: 12 },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: "#94a3b8" },
});

