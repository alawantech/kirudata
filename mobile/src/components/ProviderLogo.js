import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BRANDS = {
  // Cable
  dstv: { bg: "#1a1a3e", text: "#fff", sub: "DStv" },
  gotv: { bg: "#f7941d", text: "#fff", sub: "GoTV" },
  startimes: { bg: "#00a0e1", text: "#fff", sub: "Star" },
  // Exam
  waec: { bg: "#006b3f", text: "#fff", sub: "WAEC" },
  neco: { bg: "#1a3c8f", text: "#ffd700", sub: "NECO" },
  nabteb: { bg: "#cc0000", text: "#fff", sub: "NAB" },
  // Electricity
  ikeja: { bg: "#f57c00", text: "#fff", sub: "IK", isElec: true },
  eko: { bg: "#2e7d32", text: "#fff", sub: "EK", isElec: true },
  kano: { bg: "#00897b", text: "#fff", sub: "KN", isElec: true },
  "port harcourt": { bg: "#c62828", text: "#fff", sub: "PH", isElec: true },
  jos: { bg: "#5d4037", text: "#fff", sub: "JO", isElec: true },
  ibadan: { bg: "#1565c0", text: "#fff", sub: "IB", isElec: true },
  kaduna: { bg: "#00695c", text: "#fff", sub: "KD", isElec: true },
  abuja: { bg: "#283593", text: "#fff", sub: "AB", isElec: true },
  enugu: { bg: "#6a1b9a", text: "#fff", sub: "EN", isElec: true },
  benin: { bg: "#ef6c00", text: "#fff", sub: "BE", isElec: true },
  yola: { bg: "#00796b", text: "#fff", sub: "YL", isElec: true },
  aba: { bg: "#ad1457", text: "#fff", sub: "AB", isElec: true },
};

function getBrand(name = "") {
  const lower = (name || "").toLowerCase();
  for (const [key, val] of Object.entries(BRANDS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export default function ProviderLogo({ name = "", size = 44, style }) {
  const brand = getBrand(name);

  if (!brand) {
    return (
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size * 0.22, backgroundColor: "#6366f1" },
          style,
        ]}
      >
        <Text style={[styles.abbr, { fontSize: size * 0.24, color: "#fff" }]}>
          {(name || "?").slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

  if (brand.isElec) {
    // Electricity: circle with lightning bolt (⚡ emoji) + 2-letter code
    return (
      <View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: brand.bg },
          style,
        ]}
      >
        <Text style={{ fontSize: size * 0.36 }}>{"\u26A1"}</Text>
        <Text
          style={{
            fontSize: size * 0.18,
            fontWeight: "800",
            color: brand.text,
            marginTop: -2,
          }}
        >
          {brand.sub}
        </Text>
      </View>
    );
  }

  // Cable / Exam
  const isCable = ["dstv", "gotv", "startimes"].some((k) =>
    (name || "").toLowerCase().includes(k)
  );

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: isCable ? size * 0.22 : size * 0.18,
          backgroundColor: brand.bg,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: size * (brand.sub.length > 4 ? 0.22 : 0.3),
          fontWeight: "900",
          color: brand.text,
          letterSpacing: brand.sub === "GoTV" ? 0 : -0.5,
        }}
      >
        {brand.sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  abbr: {
    fontWeight: "900",
    letterSpacing: -0.3,
  },
});
