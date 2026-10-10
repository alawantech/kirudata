import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Dimensions, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SPLASH_FONTS as F } from "../constants/splashTheme";
import { COLORS } from "../constants/theme";
import { API_BASE } from "../api/client";
import { useAuth } from "../context/AuthContext";

const { width: W } = Dimensions.get("window");
const BAR_WIDTH = 168;
const BAR_HEIGHT = 4;
const SPLASH_DURATION = 1800;
const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../assets/logo-kiru.png");
const LOGO_W = 250;
const LOGO_H = 77;
const WORDMARK_NAME = "Kiru";
const WORDMARK_TAG = "DATA SUB";

export default function SplashScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const insets = useSafeAreaInsets();
  const { lastUser } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  useEffect(() => {
    const normaliseUrl = (url) => {
      if (!url) return null;
      if (/^https?:\/\//i.test(url)) return url;
      return `${API_BASE.replace(/\/api\/?$/, "")}/${url.replace(/^\/+/, "")}`;
    };
    AsyncStorage.getItem(LOGO_CACHE_KEY)
      .then((cached) => {
        if (cached) setLogoUrl(normaliseUrl(cached));
      })
      .catch(() => {});
    fetch(`${API_BASE}/public/settings`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        const url = normaliseUrl(j?.data?.settings?.logoUrl);
        if (url) {
          setLogoUrl(url);
          AsyncStorage.setItem(LOGO_CACHE_KEY, url).catch(() => {});
        }
      })
      .catch(() => {});
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => navigation.replace(lastUser ? "Login" : "Welcome"));
    }, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) return null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH],
  });
  const logo = logoUrl || LOCAL_LOGO;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeOut }}>
      <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <View pointerEvents="none" style={{ position: "absolute", top: -100, left: W / 2 - 160, width: 320, height: 320, borderRadius: 160, backgroundColor: "rgba(79,70,229,0.06)" }} />
        <View pointerEvents="none" style={{ position: "absolute", top: -40, left: W / 2 - 100, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(30,58,138,0.05)" }} />
        <View pointerEvents="none" style={{ position: "absolute", bottom: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(99,102,241,0.06)" }} />

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 30 }}>
          {logo && !(logoFailed && !logoUrl) ? (
            <Image
              source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
              style={{ width: LOGO_W, height: LOGO_H }}
              resizeMode="contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: F.bold, fontSize: 34, fontWeight: "800", color: COLORS.black, lineHeight: 40 }}>{WORDMARK_NAME}</Text>
              <Text style={{ fontFamily: F.semiBold, fontSize: 13, fontWeight: "700", color: COLORS.primary, letterSpacing: 4, marginTop: 2 }}>{WORDMARK_TAG}</Text>
            </View>
          )}

          <View style={{ width: BAR_WIDTH, height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, backgroundColor: "rgba(79,70,229,0.12)", overflow: "hidden", marginTop: 36 }}>
            <Animated.View style={{ height: BAR_HEIGHT, width: barWidth }}>
              <LinearGradient
                colors={["#4f46e5", "#6366f1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: BAR_HEIGHT / 2 }}
              />
            </Animated.View>
          </View>

          <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: COLORS.muted, marginTop: 12 }}>Setting things up …</Text>
        </View>

        <View style={{ alignItems: "center", paddingBottom: (insets.bottom || 16) + 32 }}>
          <View style={{ width: 40, height: 1, backgroundColor: COLORS.border, marginBottom: 14 }} />
          <Text style={{ fontFamily: F.medium, fontSize: 9, color: COLORS.subtle, letterSpacing: 2.5, marginBottom: 4 }}>DEVELOPED BY</Text>
          <Text style={{ fontFamily: F.semiBold, fontSize: 13 }}>
            <Text style={{ color: COLORS.black }}>ZEDRO</Text>
            <Text style={{ color: COLORS.primary }}>TECH</Text>
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
