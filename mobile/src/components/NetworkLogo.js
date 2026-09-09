import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BRANDS = {
  mtn: {
    bg: "#FFCC00",
    text: "#1a1a1a",
    abbr: "MTN",
    hasOval: true,
    ovalBg: "#0066B3",
  },
  glo: {
    bg: "#008000",
    text: "#ffffff",
    abbr: "glo",
    italic: true,
    fontSize: 0.34,
  },
  airtel: {
    bg: "#FF0000",
    text: "#ffffff",
    abbr: "airtel",
    fontSize: 0.2,
    hasSwoosh: true,
  },
  "9mobile": {
    bg: "#1C1C1C",
    text: "#97C93E",
    abbr: "9",
    subText: "mobile",
    fontSize: 0.38,
    subFontSize: 0.14,
    isSquare: true,
  },
  etisalat: {
    bg: "#1C1C1C",
    text: "#97C93E",
    abbr: "9",
    subText: "mobile",
    fontSize: 0.38,
    subFontSize: 0.14,
    isSquare: true,
  },
};

function getBrand(name = "") {
  const lower = (name || "").toLowerCase();
  for (const [key, val] of Object.entries(BRANDS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export default function NetworkLogo({ name = "", size = 44, style }) {
  const brand = getBrand(name);

  if (!brand) {
    // Fallback
    return (
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: "#6366f1" },
          style,
        ]}
      >
        <Text style={[styles.abbr, { fontSize: size * 0.26, color: "#fff" }]}>
          {(name || "NET").slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

  if (brand.isSquare) {
    // 9mobile: rounded square
    return (
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
            backgroundColor: brand.bg,
          },
          style,
        ]}
      >
        <Text
          style={{
            fontSize: size * (brand.fontSize || 0.38),
            fontWeight: "900",
            color: brand.text,
            lineHeight: size * 0.38,
          }}
        >
          {brand.abbr}
        </Text>
        {brand.subText ? (
          <Text
            style={{
              fontSize: size * (brand.subFontSize || 0.14),
              fontWeight: "600",
              color: brand.text,
              marginTop: -2,
              letterSpacing: 0.5,
            }}
          >
            {brand.subText}
          </Text>
        ) : null}
      </View>
    );
  }

  if (brand.hasOval) {
    // MTN: yellow circle with blue oval
    return (
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: brand.bg },
          style,
        ]}
      >
        <View
          style={{
            backgroundColor: brand.ovalBg,
            borderRadius: size * 0.25,
            paddingHorizontal: size * 0.12,
            paddingVertical: size * 0.04,
          }}
        >
          <Text
            style={{
              fontSize: size * 0.24,
              fontWeight: "900",
              color: "#fff",
              letterSpacing: -0.5,
            }}
          >
            MTN
          </Text>
        </View>
      </View>
    );
  }

  // Glo / Airtel: circle with text
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: brand.bg },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: size * (brand.fontSize || 0.28),
          fontWeight: "900",
          color: brand.text,
          fontStyle: brand.italic ? "italic" : "normal",
          letterSpacing: brand.abbr === "glo" ? 1 : 0,
          textTransform: brand.abbr === "glo" ? "lowercase" : "none",
        }}
      >
        {brand.abbr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  abbr: {
    fontWeight: "900",
    letterSpacing: -0.3,
  },
});
