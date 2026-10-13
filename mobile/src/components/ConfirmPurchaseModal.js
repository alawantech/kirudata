import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";
import NetworkLogo from "./NetworkLogo";

function formatPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return p || "—";
}

function Row({ label, value, logoName }) {
  return (
    <View style={styles.row}>
      <Text style={styles.key}>{label}</Text>
      <View style={styles.valWrap}>
        {logoName ? <NetworkLogo name={logoName} size={16} /> : null}
        <Text style={styles.val} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ConfirmPurchaseModal({
  visible,
  onCancel,
  onConfirm,
  plan,
  phone,
  networkName,
  dataType,
  validityLabel,
  loading,
}) {
  if (!plan) return null;
  const amount = Number(plan.userPrice || 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.backdropFill} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Confirm purchase</Text>
              <Text style={styles.sub}>Review your details before paying.</Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.close}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>You're paying</Text>
            <Text style={styles.amount}>₦{amount.toLocaleString()}</Text>
            <Text style={styles.amountTo}>to {formatPhone(phone)}</Text>
          </View>

          <View style={styles.rows}>
            <Row label="Network" value={networkName} logoName={networkName} />
            <Row label="Data Type" value={dataType || "—"} />
            <Row label="Plan" value={plan.name} />
            {validityLabel ? <Row label="Validity" value={validityLabel} /> : null}
            <Row label="Recipient" value={formatPhone(phone)} />
          </View>

          <View style={styles.note}>
            <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
            <Text style={styles.noteText}>Data is delivered instantly after payment.</Text>
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={onConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.payText}>Confirm &amp; Pay</Text>
            <Ionicons name="lock-closed" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={styles.cancel} disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  backdropFill: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    ...SHADOW.lg,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.black, letterSpacing: -0.3 },
  sub: { fontSize: 12.5, color: COLORS.muted, marginTop: 3 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  amountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  amountLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  amount: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: -1,
    marginVertical: 2,
  },
  amountTo: { fontSize: 13, color: COLORS.muted, fontWeight: "600" },
  rows: { marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  key: { fontSize: 13.5, color: COLORS.muted },
  valWrap: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "62%" },
  val: { fontSize: 13.5, fontWeight: "700", color: COLORS.black, flexShrink: 1 },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    marginTop: 2,
  },
  noteText: { fontSize: 12.5, color: "#16a34a", fontWeight: "600" },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 15,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
  },
  payText: { color: "#fff", fontSize: 15.5, fontWeight: "800" },
  cancel: { alignItems: "center", paddingVertical: 13 },
  cancelText: { color: COLORS.muted, fontSize: 14, fontWeight: "700" },
});
