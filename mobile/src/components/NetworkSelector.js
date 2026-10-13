import React, { useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import NetworkLogo from "./NetworkLogo";

const GAP = 8;
const PAD = 4;
const MIN_W = 48;
const MAX_W = 96;

/**
 * Row of network cards (logo on top, name below) used by Buy Data and Buy Airtime.
 *
 * Card size is derived from the measured row width so every network fits on
 * screen with no horizontal scrolling. Chevrons only appear if there are more
 * networks than can fit (they are hidden in the normal 4-network case).
 */
export function NetworkSelector({ networks, value, onChange }) {
  const scrollRef = useRef(null);
  const offset = useRef(0);
  const [rowW, setRowW] = useState(0);

  const n = networks?.length || 0;
  const raw = n && rowW > 0 ? (rowW - PAD * 2 - (n - 1) * GAP) / n : 0;
  // floor so the row can never overflow by a pixel and falsely need scrolling
  const cardW = raw ? Math.floor(Math.min(MAX_W, Math.max(MIN_W, raw))) : MAX_W;
  const cardH = Math.round(cardW * 1.15);
  const logoSize = Math.round(cardW * 0.46);
  const fontSize = Math.max(11, Math.min(13, Math.round(cardW * 0.17)));
  const fits = !raw || n * cardW + (n - 1) * GAP + PAD * 2 <= rowW;

  const nudge = (dir) => {
    const target = Math.max(0, offset.current + dir * (cardW + GAP) * 2);
    offset.current = target;
    scrollRef.current?.scrollTo({ x: target, animated: true });
  };

  if (!n) return null;

  return (
    <View style={styles.wrap} onLayout={(e) => setRowW(e.nativeEvent.layout.width)}>
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
        {networks.map((nn) => {
          const isActive = value === nn.id;
          return (
            <TouchableOpacity
              key={nn.id}
              onPress={() => onChange(nn.id)}
              activeOpacity={0.85}
              style={[
                styles.card,
                { width: cardW, height: cardH },
                isActive && styles.cardActive,
              ]}
            >
              <NetworkLogo name={nn.name} size={logoSize} />
              <Text
                style={[
                  styles.label,
                  { fontSize },
                  isActive && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {nn.name}
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

      {!fits ? (
        <TouchableOpacity
          style={[styles.arrow, { left: 0, top: (cardH - 28) / 2 }]}
          onPress={() => nudge(-1)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={15} color={COLORS.body} />
        </TouchableOpacity>
      ) : null}
      {!fits ? (
        <TouchableOpacity
          style={[styles.arrow, { right: 0, top: (cardH - 28) / 2 }]}
          onPress={() => nudge(1)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-forward" size={15} color={COLORS.body} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  row: { paddingHorizontal: PAD, gap: GAP },
  card: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "12",
  },
  label: {
    fontWeight: "800",
    color: COLORS.body,
    letterSpacing: -0.2,
  },
  labelActive: { color: COLORS.primary },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    position: "absolute",
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
