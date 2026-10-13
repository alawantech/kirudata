import React, { useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../constants/theme";
import NetworkLogo from "./NetworkLogo";

const CARD_W = 96;
const CARD_H = 110;
const GAP = 12;
const STEP = CARD_W + GAP;

/**
 * Horizontal, scrollable row of tall network cards (logo on top, name below)
 * with chevron buttons at each edge. Used by Buy Data and Buy Airtime.
 */
export function NetworkSelector({ networks, value, onChange }) {
  const scrollRef = useRef(null);
  const offset = useRef(0);

  const nudge = (dir) => {
    const target = Math.max(0, offset.current + dir * STEP * 2);
    offset.current = target;
    scrollRef.current?.scrollTo({ x: target, animated: true });
  };

  if (!networks?.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {networks.map((n) => {
          const isActive = value === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              onPress={() => onChange(n.id)}
              activeOpacity={0.85}
              style={[styles.card, isActive && styles.cardActive]}
            >
              <View style={styles.logoBox}>
                <NetworkLogo name={n.name} size={44} />
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {n.name}
              </Text>
              {isActive ? (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.arrow, { left: 0 }]}
        onPress={() => nudge(-1)}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={15} color={COLORS.body} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, { right: 0 }]}
        onPress={() => nudge(1)}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-forward" size={15} color={COLORS.body} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  row: { paddingHorizontal: 4, gap: GAP },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "12",
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.body,
    letterSpacing: -0.2,
  },
  labelActive: { color: COLORS.primary },
  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    position: "absolute",
    top: (CARD_H - 28) / 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
