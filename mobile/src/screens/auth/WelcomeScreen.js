import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SPLASH_COLORS as C, SPLASH_FONTS as F } from "../../constants/splashTheme";
import client, { API_BASE } from "../../api/client";

const { width: W } = Dimensions.get("window");
const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../../assets/logo-gsub.png");

const BRAND = "Kiru";
const BRAND_TAG = "DATA SUB";

const SLIDES = [
  {
    iconSet: "ion",
    icon: "rocket",
    title: "Welcome to Kiru Data",
    sub: "Buy data, recharge airtime, and pay bills easily. All you need for digital services in one app.",
  },
  {
    iconSet: "mci",
    icon: "robot",
    title: "We are Automated",
    sub: "Airtime topup and data purchase are automated and get delivered to you almost instantly.",
  },
  {
    iconSet: "mci",
    icon: "headset",
    title: "Customer Support",
    sub: "Our customer service is just a click away. Don't hesitate to consult us on anything.",
  },
];

function Dots({ index }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        justifyContent: "center",
        marginTop: 20,
      }}
    >
      {SLIDES.map((_, i) => (
        <View
          key={i}
          style={
            i === index
              ? { width: 22, height: 7, borderRadius: 4, backgroundColor: C.lime1 }
              : { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)" }
          }
        />
      ))}
    </View>
  );
}

function Illustration({ slide, glow }) {
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const Icon = slide.iconSet === "ion" ? Ionicons : MaterialCommunityIcons;

  return (
    <View
      style={{
        height: Math.min(W * 0.55, 210),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Soft indigo blob (top-right) */}
      <View
        style={{
          position: "absolute",
          top: 6,
          right: 18,
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: C.indigo1,
          opacity: 0.16,
        }}
      />
      {/* Main lime glow behind the icon */}
      <Animated.View
        style={{
          position: "absolute",
          width: 165,
          height: 165,
          borderRadius: 83,
          backgroundColor: "rgba(182,255,92,0.10)",
          borderWidth: 1,
          borderColor: "rgba(182,255,92,0.22)",
          transform: [{ scale }],
        }}
      />
      <Icon name={slide.icon} size={74} color={C.lime1} />
      {/* Floating accents */}
      <View style={{ position: "absolute", top: 16, left: 30, width: 6, height: 6, borderRadius: 3, backgroundColor: C.lime1, opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 24, right: 36, width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#ffffff", opacity: 0.35 }} />
      <View style={{ position: "absolute", bottom: 46, left: 40, width: 4, height: 4, borderRadius: 2, backgroundColor: C.indigo2, opacity: 0.7 }} />
    </View>
  );
}

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [logoUrl, setLogoUrl] = useState(null);
  const [index, setIndex] = useState(0);

  const glow = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  useEffect(() => {
    const normaliseUrl = (url) => {
      if (!url) return null;
      try {
        const apiOrigin = new URL(API_BASE).origin;
        const parsed = new URL(url);
        if (parsed.origin !== apiOrigin) return apiOrigin + parsed.pathname + parsed.search;
        return url;
      } catch {
        return url;
      }
    };
    AsyncStorage.getItem(LOGO_CACHE_KEY).then((c) => {
      if (c) setLogoUrl(normaliseUrl(c));
    });
    client
      .get("/public/settings")
      .then((r) => {
        const s = r.data?.data?.settings;
        const url = normaliseUrl(s?.logoUrl);
        if (url) {
          setLogoUrl(url);
          AsyncStorage.setItem(LOGO_CACHE_KEY, url);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bgDeep }}>
      {/* Header: logo + brand (centered) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingTop: (insets.top || 24) + 8,
        }}
      >
        <Image
          source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
          style={{ width: 42, height: 42, borderRadius: 12 }}
          resizeMode="contain"
          onError={() => setLogoUrl(null)}
        />
        <View>
          <Text
            style={{
              fontFamily: F.bold,
              fontSize: 17,
              fontWeight: "700",
              color: C.textPrimary,
              lineHeight: 19,
            }}
          >
            {BRAND}
          </Text>
          <Text
            style={{
              fontFamily: F.medium,
              fontSize: 9,
              fontWeight: "500",
              color: C.lime1,
              letterSpacing: 2.5,
            }}
          >
            {BRAND_TAG}
          </Text>
        </View>
      </View>

      {/* Onboarding carousel */}
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <FlatList
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / W))
          }
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item }) => (
            <View
              style={{
                width: W,
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  borderRadius: 26,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  paddingHorizontal: 24,
                  paddingTop: 26,
                  paddingBottom: 26,
                }}
              >
                <Illustration slide={item} glow={glow} />

                <Text
                  style={{
                    fontFamily: F.bold,
                    fontSize: 24,
                    fontWeight: "700",
                    color: C.textPrimary,
                    textAlign: "center",
                    lineHeight: 32,
                    marginTop: 14,
                  }}
                >
                  {item.title}
                </Text>

                <Text
                  style={{
                    fontFamily: F.medium,
                    fontSize: 13,
                    fontWeight: "500",
                    color: C.textSecondary,
                    textAlign: "center",
                    lineHeight: 21,
                    marginTop: 10,
                    paddingHorizontal: 6,
                  }}
                >
                  {item.sub}
                </Text>

                <Dots index={index} />
              </View>
            </View>
          )}
        />
      </Animated.View>

      {/* Bottom actions */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: (insets.bottom || 16) + 14,
          gap: 4,
        }}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("Register")}>
          <View
            style={{
              height: 54,
              borderRadius: 16,
              backgroundColor: C.lime1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: F.semiBold,
                fontSize: 15.5,
                fontWeight: "700",
                color: "#0A0918",
              }}
            >
              Get Started
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Login")}
          style={{ height: 46, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: F.semiBold,
              fontSize: 14.5,
              fontWeight: "600",
              color: C.textPrimary,
            }}
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
