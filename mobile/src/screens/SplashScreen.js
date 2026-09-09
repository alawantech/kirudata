import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Dimensions, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { SPLASH_COLORS as C, SPLASH_FONTS as F } from "../constants/splashTheme";
import { API_BASE } from "../api/client";

const { width: W } = Dimensions.get("window");
const BAR_WIDTH = 168;
const BAR_HEIGHT = 4;
const SPLASH_DURATION = 2500;
const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../assets/logo-gsub.png");

function DashedRing({ size, opacity, rotation }) {
  const r = size / 2;
  const dashArray = "8 12";
  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.2,
        borderStyle: "dashed",
        borderColor: `rgba(139,127,255,${opacity})`,
        top: "50%",
        left: "50%",
        marginTop: -r,
        marginLeft: -r,
        transform: [{ rotate: rotation }],
      }}
      pointerEvents="none"
    />
  );
}

function LogoMark() {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: C.logoMark || 15,
        backgroundColor: C.indigo1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: C.lime1 }} />
      {/* Wifi/signal glyph: two arcs + dot */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 22,
            height: 11,
            borderTopLeftRadius: 11,
            borderTopRightRadius: 11,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderColor: "white",
            marginBottom: -2,
          }}
        />
        <View
          style={{
            width: 14,
            height: 7,
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderColor: "white",
            marginBottom: -1,
          }}
        />
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "white" }} />
      </View>
    </View>
  );
}

export default function SplashScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const [logoUrl, setLogoUrl] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  useEffect(() => {
    // Load logo from cache
    const normaliseUrl = (url) => {
      if (!url) return null;
      try {
        const apiOrigin = new URL(API_BASE).origin;
        const parsed = new URL(url);
        if (parsed.origin !== apiOrigin) return apiOrigin + parsed.pathname + parsed.search;
        return url;
      } catch { return url; }
    };
    AsyncStorage.getItem(LOGO_CACHE_KEY).then((c) => { if (c) setLogoUrl(normaliseUrl(c)); });

    // Loading bar animation — fills over 2.5s
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Slow ring rotation
    Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Auto-navigate after 2.5s
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        navigation.replace("Welcome");
      });
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) return null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH],
  });

  const ringRot = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ flex: 1, opacity: fadeOut }}>
      {/* Background */}
      <View style={{ flex: 1, backgroundColor: C.bgDeep }}>
        {/* Violet radial glow from top-center */}
        <View
          style={{
            position: "absolute",
            top: -120,
            left: W / 2 - 180,
            width: 360,
            height: 360,
            borderRadius: 180,
            backgroundColor: C.bgViolet,
            opacity: 0.55,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: -60,
            left: W / 2 - 120,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: C.indigo1,
            opacity: 0.25,
          }}
        />
        {/* Lime glow bottom-left */}
        <View
          style={{
            position: "absolute",
            bottom: -80,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: C.lime2,
            opacity: 0.08,
          }}
        />

        {/* Dashed rings */}
        <DashedRing size={260} opacity={0.12} rotation={ringRot} />
        <DashedRing size={320} opacity={0.06} rotation={ringRot} />

        {/* Center content */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
          {/* Logo lockup */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 32 }}>
            <Image
              source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
              style={{ width: 240, height: 240, borderRadius: 40 }}
              resizeMode="contain"
            />
            <View>
              <Text
                style={{
                  fontFamily: F.bold,
                  fontSize: 30,
                  fontWeight: "700",
                  color: C.textPrimary,
                  lineHeight: 34,
                }}
              >
                Kiru
              </Text>
              <Text
                style={{
                  fontFamily: F.medium,
                  fontSize: 11,
                  fontWeight: "500",
                  color: C.lime1,
                  letterSpacing: 3,
                  marginTop: -2,
                }}
              >
                DATA SUB
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View
            style={{
              width: BAR_WIDTH,
              height: BAR_HEIGHT,
              borderRadius: BAR_HEIGHT / 2,
              backgroundColor: "rgba(255,255,255,0.12)",
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={{
                height: BAR_HEIGHT,
                borderRadius: BAR_HEIGHT / 2,
                width: barWidth,
                backgroundColor: C.lime1,
              }}
            />
          </View>

          {/* Loading label */}
          <Text
            style={{
              fontFamily: F.medium,
              fontSize: 11.5,
              color: C.textMuted,
              marginTop: 12,
            }}
          >
            Setting things up …
          </Text>
        </View>

        {/* Bottom credit */}
        <View style={{ alignItems: "center", paddingBottom: 48 }}>
          <View
            style={{
              width: 40,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.12)",
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              fontFamily: F.medium,
              fontSize: 9,
              color: C.textMuted,
              letterSpacing: 2.5,
              marginBottom: 4,
            }}
          >
            DEVELOPED BY
          </Text>
          <Text style={{ fontFamily: F.semiBold, fontSize: 13 }}>
            <Text style={{ color: C.textPrimary }}>ZEDRO</Text>
            <Text style={{ color: C.lime1 }}>TECH</Text>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
