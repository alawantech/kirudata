import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Image, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { AuthStack, AppStack } from "./AppNavigator";
import { COLORS } from "../constants/theme";

const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../assets/logo-kiru.png");
const WORDMARK_NAME = "Kiru";
const WORDMARK_TAG = "DATA SUB";
const LOGO_W = 250;
const LOGO_H = 77;
const BAR_WIDTH = 168;
const { width: W } = Dimensions.get("window");

function LoadingView() {
  const pulse = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(LOGO_CACHE_KEY)
      .then((c) => {
        if (c) setLogoUrl(c);
      })
      .catch(() => {});
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(slide, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const barX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, BAR_WIDTH + 6],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -100,
          left: W / 2 - 160,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: "rgba(79,70,229,0.06)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(99,102,241,0.06)",
        }}
      />

      <Animated.View
        style={{ alignItems: "center", transform: [{ scale }], opacity }}
      >
        {LOCAL_LOGO || logoUrl ? (
          <Image
            source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
            onError={() => setLogoUrl(null)}
          />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 34,
                fontWeight: "800",
                color: COLORS.black,
                lineHeight: 40,
              }}
            >
              {WORDMARK_NAME}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: COLORS.primary,
                letterSpacing: 4,
                marginTop: 2,
              }}
            >
              {WORDMARK_TAG}
            </Text>
          </View>
        )}
      </Animated.View>

      <View
        style={{
          width: BAR_WIDTH,
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(79,70,229,0.12)",
          overflow: "hidden",
          marginTop: 32,
        }}
      >
        <Animated.View
          style={{
            width: 64,
            height: 4,
            borderRadius: 2,
            transform: [{ translateX: barX }],
          }}
        >
          <LinearGradient
            colors={["#4f46e5", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 2 }}
          />
        </Animated.View>
      </View>

      <Text style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 12 }}>
        Setting things up …
      </Text>
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingView />;

  return user ? <AppStack /> : <AuthStack />;
}
