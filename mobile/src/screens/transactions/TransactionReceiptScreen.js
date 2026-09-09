import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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
  other: { color: "#0891b2", bg: "#ecfeff", icon: "receipt", label: "Transaction" },
};

const ROW_ICONS = {
  "Reference": "finger-print",
  "Transaction ID": "finger-print",
  "Service": "cube",
  "Description": "document-text",
  "Amount": "wallet",
  "Old Balance": "arrow-down",
  "New Balance": "arrow-up",
  "Date": "calendar",
  "Token": "flash",
  "Meter": "speedometer",
  "Meter Type": "information-circle",
  "Customer Name": "person",
  "Customer Address": "location",
  "Product": "cube",
  "Status": "checkmark-circle",
};

const ROW_ICON_COLORS = {
  "Reference": "#6366f1",
  "Transaction ID": "#6366f1",
  "Service": "#8b5cf6",
  "Description": "#a78bfa",
  "Amount": "#4f46e5",
  "Old Balance": "#f97316",
  "New Balance": "#10b981",
  "Date": "#64748b",
  "Token": "#d97706",
  "Meter": "#0891b2",
  "Meter Type": "#0891b2",
  "Customer Name": "#7c3aed",
  "Customer Address": "#6366f1",
  "Product": "#8b5cf6",
  "Status": "#10b981",
};

const normaliseUrl = (url) => {
  if (!url) return null;
  try {
    const apiOrigin = new URL(API_BASE).origin;
    const parsed = new URL(url);
    if (parsed.origin !== apiOrigin) {
      return apiOrigin + parsed.pathname + parsed.search;
    }
    return url;
  } catch {
    return url;
  }
};

function parseServicedesc(desc, servicename, apiResponseLog) {
  if (!desc || desc === "\u2014") return { description: desc || "\u2014" };

  let token = undefined;
  if (apiResponseLog && servicename === "Electricity") {
    try {
      const parsed = typeof apiResponseLog === "string" ? JSON.parse(apiResponseLog) : apiResponseLog;
      if (parsed.token) token = parsed.token;
    } catch {}
  }

  if (servicename !== "Electricity") return { description: desc, token };

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

  if (!providerName || providerName === first) {
    providerName = first.replace(/\d{10,}/, "").replace(/\s*-\s*$/, "").trim();
  }

  return {
    description: providerName || undefined,
    meterNumber,
    meterType: meterType || undefined,
    customerName: rest[0] || undefined,
    address: rest[1] || undefined,
    token,
  };
}

function getSvc(cat, name = "") {
  if (SVC[cat]) return SVC[cat];
  const l = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(SVC)) if (l.includes(k)) return v;
  return SVC.other;
}
function statusMeta(s) {
  if (s === 1 || s === "success" || s === "successful")
    return { color: COLORS.success, label: "Successful", icon: "checkmark-circle" };
  if (s === 0 || s === "failed")
    return { color: COLORS.danger, label: "Failed", icon: "close-circle" };
  return { color: COLORS.warning, label: "Pending", icon: "time" };
}
function fmt(n) {
  return "\u20A6" + Math.abs(Number(n)).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}
function fmtDate(d) {
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionReceiptScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const ref = route.params?.ref;
  const isNew = !!route.params?.isNew;
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const [siteName, setSiteName] = useState("Kiru Data");
  const [downloading, setDownloading] = useState(false);

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

  const buildReceiptHTML = () => {
    if (!tx) return "";
    const isDebit = Number(tx.oldbal || 0) > Number(tx.newbal || 0);
    const st = statusMeta(tx.status);
    const cat = tx.category || "other";
    const svc = getSvc(cat, tx.servicename);
    const pd = parseServicedesc(tx.servicedesc || "", tx.servicename, tx.apiResponseLog);
    const statusColor = st.color === COLORS.success ? "#10b981" : st.color === COLORS.danger ? "#ef4444" : "#f59e0b";

    let detailsHTML = "";
    if (isElectricity) {
      if (pd.token) detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Token</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;font-family:monospace;">${pd.token}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Transaction ID</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;font-family:monospace;">${tx.transref || tx.ref}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Status</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;color:${statusColor};">${st.label}</td></tr>`;
      if (pd.description) detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Product</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${pd.description}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Amount</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:15px;font-weight:900;text-align:right;">${fmt(tx.amount)}</td></tr>`;
      if (pd.meterNumber) detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Meter</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;font-family:monospace;">${pd.meterNumber}</td></tr>`;
      if (pd.meterType) detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Meter Type</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${pd.meterType}</td></tr>`;
      if (pd.customerName) detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Customer Name</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${pd.customerName}</td></tr>`;
      if (pd.address) detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Customer Address</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${pd.address}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Date</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${fmtDate(tx.date || tx.createdAt)}</td></tr>`;
    } else {
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Reference</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;font-family:monospace;">${tx.transref || tx.ref}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Service</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${tx.servicename || svc.label}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Description</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${tx.servicedesc || "\u2014"}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Amount</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:15px;font-weight:900;text-align:right;color:${isDebit ? "#ef4444" : "#10b981"};">${isDebit ? "-" : "+"}${fmt(tx.amount)}</td></tr>`;
      detailsHTML += `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Date</td><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right;">${fmtDate(tx.date || tx.createdAt)}</td></tr>`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:20px;background:#f5f5f7;}</style></head>
      <body>
        <div style="max-width:400px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px 20px;text-align:center;">
            ${logoUrl ? `<img src="${logoUrl}" style="width:60px;height:60px;border-radius:12px;margin-bottom:10px;" />` : `<div style="width:60px;height:60px;border-radius:12px;background:rgba(255,255,255,0.18);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:28px;font-weight:900;">${siteName.charAt(0)}</span></div>`}
            <div style="color:rgba(255,255,255,0.85);font-size:14px;font-weight:800;letter-spacing:0.3px;margin-bottom:16px;">${siteName}</div>
            <div style="width:50px;height:50px;border-radius:25px;background:rgba(255,255,255,0.18);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:24px;">&#10003;</span>
            </div>
            <div style="color:rgba(255,255,255,0.75);font-size:13px;font-weight:600;margin-bottom:4px;">${svc.label} Receipt</div>
            <div style="color:#fff;font-size:32px;font-weight:900;letter-spacing:-1px;margin-top:4px;">${isDebit ? "-" : "+"}${fmt(tx.amount)}</div>
            <div style="display:inline-block;background:rgba(255,255,255,0.18);padding:5px 18px;border-radius:99px;margin-top:12px;"><span style="color:#fff;font-size:12px;font-weight:700;">${st.label}</span></div>
          </div>
          <table style="width:100%;border-collapse:collapse;">${detailsHTML}</table>
          <div style="text-align:center;padding:16px;color:#a1a1aa;font-size:12px;font-weight:600;">Secured & verified by ${siteName}</div>
          <div style="text-align:center;padding:4px 16px 20px;color:#d4d4d8;font-size:11px;">Generated ${new Date().toLocaleString("en-NG")}</div>
        </div>
      </body>
      </html>`;
  };

  const downloadReceipt = async () => {
    if (!tx) return;
    try {
      setDownloading(true);
      const html = buildReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save Receipt PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      Toast.show({ type: "error", text1: "Download failed", text2: "Please try again" });
    } finally {
      setDownloading(false);
    }
  };

  const shareReceipt = async () => {
    if (!tx) return;
    try {
      const isDebit = Number(tx.oldbal || 0) > Number(tx.newbal || 0);
      const st = statusMeta(tx.status);
      const cat = tx.category || "other";
      const svc = getSvc(cat, tx.servicename);
      const pd = parseServicedesc(tx.servicedesc || "", tx.servicename, tx.apiResponseLog);

      const line = "\u2500".repeat(32);
      let text =
        `\n${siteName}\n` +
        `${line}\n` +
        `${svc.label} Receipt\n` +
        `${line}\n\n` +
        `Reference:    ${tx.transref || tx.ref}\n` +
        `Service:      ${tx.servicename || svc.label}\n`;
      if (pd.token) text += `Token:        ${pd.token}\n`;
      if (pd.description) text += `Provider:     ${pd.description}\n`;
      if (pd.meterNumber) text += `Meter Number: ${pd.meterNumber}\n`;
      if (pd.meterType) text += `Meter Type:   ${pd.meterType}\n`;
      if (pd.customerName) text += `Customer:     ${pd.customerName}\n`;
      if (pd.address) text += `Address:      ${pd.address}\n`;
      text +=
        `Amount:       ${isDebit ? "-" : "+"}${fmt(tx.amount)}\n` +
        `Status:       ${st.label}\n` +
        `Prev Balance: ${fmt(tx.oldbal)}\n` +
        `New Balance:  ${fmt(tx.newbal)}\n` +
        `Date:         ${fmtDate(tx.date || tx.createdAt)}\n\n` +
        `${line}\n` +
        `Secured & verified by ${siteName}\n` +
        `Generated ${new Date().toLocaleString("en-NG")}\n`;
      await Share.share({ message: text, title: `${siteName} Receipt` });
    } catch {
      // user cancelled
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <LinearGradient colors={["#4f46e5", "#7c3aed"]} style={{ paddingTop: insets.top + 10, paddingBottom: 20, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,.18)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>Receipt</Text>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </View>
    );
  }
  if (!tx) return null;

  const cat = tx.category || getSvc("", tx.servicename).label.toLowerCase();
  const svc = getSvc(cat, tx.servicename);
  const st = statusMeta(tx.status);
  const isDebit = Number(tx.oldbal || 0) > Number(tx.newbal || 0);

  const parsedDesc = parseServicedesc(tx.servicedesc || "", tx.servicename, tx.apiResponseLog);
  const isElectricity = tx.servicename === "Electricity";
  const rows = isElectricity
    ? [
        parsedDesc.token && { label: "Token", value: parsedDesc.token },
        { label: "Transaction ID", value: tx.transref || tx.ref, mono: true },
        { label: "Status", value: st.label },
        parsedDesc.description && { label: "Product", value: parsedDesc.description },
        {
          label: "Amount",
          value: fmt(tx.amount),
          color: COLORS.black,
          bold: true,
        },
        parsedDesc.meterNumber && { label: "Meter", value: parsedDesc.meterNumber, mono: true },
        parsedDesc.meterType && { label: "Meter Type", value: parsedDesc.meterType },
        parsedDesc.customerName && { label: "Customer Name", value: parsedDesc.customerName },
        parsedDesc.address && { label: "Customer Address", value: parsedDesc.address },
        { label: "Date", value: fmtDate(tx.date || tx.createdAt) },
      ].filter(Boolean)
    : [
        { label: "Reference", value: tx.transref || tx.ref, mono: true },
        { label: "Service", value: tx.servicename || svc.label },
        { label: "Description", value: tx.servicedesc || "\u2014" },
        {
          label: "Amount",
          value: `${isDebit ? "-" : "+"}${fmt(tx.amount)}`,
          color: isDebit ? COLORS.danger : COLORS.success,
          bold: true,
        },
        { label: "Date", value: fmtDate(tx.date || tx.createdAt) },
      ].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      <LinearGradient
        colors={["#4f46e5", "#7c3aed"]}
        style={{ paddingTop: insets.top + 10, paddingBottom: 24, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,.18)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>Receipt</Text>
        </View>

        <View style={{ alignItems: "center" }}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 6, backgroundColor: "rgba(255,255,255,.15)" }} resizeMode="contain" />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>{siteName.charAt(0)}</Text>
            </View>
          )}
          <Text style={{ color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: "800", letterSpacing: 0.3, marginBottom: 14 }}>
            {siteName}
          </Text>

          <View style={styles.heroCheck}>
            <Ionicons name={isNew ? "checkmark-circle" : st.icon} size={30} color="#fff" />
          </View>
          <Text style={{ color: "rgba(255,255,255,.75)", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
            {svc.label} Receipt
          </Text>
          <Text style={styles.heroAmount}>
            {isDebit ? "-" : "+"}{fmt(tx.amount)}
          </Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{st.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, SHADOW.sm]}>
          {rows.map((r, i) => {
            const iconName = ROW_ICONS[r.label] || "finger-print";
            const iconColor = ROW_ICON_COLORS[r.label] || "#6366f1";
            return (
              <View
                key={r.label}
                style={[
                  styles.detailRow,
                  i === 0 && { borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md },
                  i === rows.length - 1 && {
                    borderBottomLeftRadius: RADIUS.md,
                    borderBottomRightRadius: RADIUS.md,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
                  <View style={[styles.rowIconCircle, { backgroundColor: iconColor + "14" }]}>
                    <Ionicons name={iconName} size={14} color={iconColor} />
                  </View>
                  <Text style={styles.detailLabel}>{r.label}</Text>
                </View>
                <Text
                  style={[
                    styles.detailValue,
                    r.bold && { fontWeight: "900", color: r.color },
                    r.mono && { fontFamily: "Courier", fontSize: 12 },
                  ]}
                  numberOfLines={3}
                >
                  {r.value}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="shield-checkmark" size={14} color="#a1a1aa" />
          <Text style={{ color: "#a1a1aa", fontSize: 11, fontWeight: "600" }}>
            Secured & verified by {siteName}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={downloadReceipt}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#fff" />
          )}
          <Text style={[styles.actionText, { color: "#fff" }]}>
            {downloading ? "Generating PDF..." : "Save / Share Receipt"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionGhost]}
          onPress={() => navigation.navigate("ServicesList")}
        >
          <Text style={[styles.actionText, { color: COLORS.body }]}>Buy Another</Text>
        </TouchableOpacity>

        <Text style={styles.thanks}>Thank you for using {siteName}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  logoFallbackText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: -1,
  },
  heroCheck: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    marginTop: 2,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,.18)",
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 99,
    marginTop: 10,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.muted,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "right",
    flexShrink: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
  },
  actionOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGhost: { backgroundColor: "transparent" },
  actionText: { fontSize: 15, fontWeight: "800" },
  thanks: {
    textAlign: "center",
    color: COLORS.subtle,
    fontSize: 12,
    marginTop: 6,
  },
});
