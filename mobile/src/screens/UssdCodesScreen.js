import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Header } from "../components/Header";
import { COLORS, RADIUS, SHADOW } from "../constants/theme";
import NetworkLogo from "../components/NetworkLogo";

/**
 * USSD codes per network — reachable from Buy Data, Buy Airtime, the receipt
 * screen and anywhere else via `navigation.navigate("UssdCodes")`.
 *
 * Codes are the ones supplied in the reference screens; edit USSD below to
 * change them. Tapping a row copies the code to the clipboard.
 */
const USSD = [
  {
    name: "MTN",
    items: [
      { title: "Check Mobile Phone Number", code: "*123*1#" },
      { title: "Check Phone Balance", code: "*310#" },
      { title: "Check Data Usage [Gifting]", code: "*323*1#" },
      { title: "Check Data Usage [Gifting]", code: "*360*260#" },
      { title: "Check Data Usage [SME]", code: "*314*4#" },
    ],
  },
  {
    name: "AIRTEL",
    items: [
      { title: "Check Mobile Phone Number", code: "*121*9#" },
      { title: "Check Phone Balance", code: "*310#" },
      { title: "Check Data Usage", code: "*323#" },
    ],
  },
  {
    name: "GLO",
    items: [
      { title: "Check Mobile Phone Number", code: "*777#" },
      { title: "Check Phone Balance", code: "*310#" },
      { title: "Check Data Usage", code: "*323#" },
    ],
  },
  {
    name: "9MOBILE",
    items: [
      { title: "Check Mobile Phone Number", code: "*248#" },
      { title: "Check Phone Balance", code: "*310#" },
      { title: "Check Data Usage [Gifting]", code: "*323#" },
    ],
  },
];

export default function UssdCodesScreen({ navigation }) {
  const copy = async (code) => {
    try {
      await Clipboard.setStringAsync(code);
      Toast.show({ type: "success", text1: "Copied", text2: code });
    } catch {
      Toast.show({ type: "error", text1: "Could not copy code" });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <Header title="USSD Codes" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={15} color={COLORS.muted} />
          <Text style={styles.hintText}>
            Tap any code to copy it, then dial it from your phone.
          </Text>
        </View>

        {USSD.map((section) => (
          <View key={section.name} style={styles.section}>
            <View style={styles.sectionHead}>
              <NetworkLogo name={section.name} size={34} />
              <Text style={styles.sectionTitle}>{section.name}</Text>
            </View>

            <View style={styles.card}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={`${section.name}-${item.code}-${i}`}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                  onPress={() => copy(item.code)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowCode}>{item.code}</Text>
                  </View>
                  <View style={styles.chevron}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          Codes may vary by bundle. Contact support if one does not work.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 18 },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.primary + "10",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: { flex: 1, fontSize: 12.5, color: COLORS.body, fontWeight: "600" },
  section: { gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.black,
    letterSpacing: -0.2,
  },
  rowCode: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 3,
    letterSpacing: 0.4,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    textAlign: "center",
    fontSize: 11.5,
    color: COLORS.subtle,
    marginTop: 2,
  },
});
