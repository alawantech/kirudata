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
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SPLASH_FONTS as F } from "../../constants/splashTheme";
import { COLORS } from "../../constants/theme";
import client, { API_BASE } from "../../api/client";

const { width: W } = Dimensions.get("window");
const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../../assets/logo-gsub.png");

const BRAND = "Kiru";

/* Brand palette (matches login / dashboard / shared Button component) */
const BRAND_GRADIENT = ["#0f172a", "#1e3a8a", "#4f46e5"];
const BTN_GRADIENT = ["#4f46e5", "#6366f1"];
const WHATSAPP_GREEN = "#25D366";

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
              ? { width: 22, height: 7, borderRadius: 4, backgroundColor: "#ffffff" }
              : { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.30)" }
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
      {/* Violet blob accent (top-right) */}
      <View
        style={{
          position: "absolute",
          top: 6,
          right: 18,
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: "#6366f1",
          opacity: 0.55,
        }}
      />
      {/* Soft white glow behind the icon */}
      <Animated.View
        style={{
          position: "absolute",
          width: 165,
          height: 165,
          borderRadius: 83,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.22)",
          transform: [{ scale }],
        }}
      />
      <Icon name={slide.icon} size={74} color="#ffffff" />
      {/* Floating accents */}
      <View style={{ position: "absolute", top: 16, left: 30, width: 6, height: 6, borderRadius: 3, backgroundColor: "#ffffff", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 24, right: 36, width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#ffffff", opacity: 0.4 }} />
      <View style={{ position: "absolute", bottom: 46, left: 40, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a5b4fc", opacity: 0.9 }} />
    </View>
  );
}

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [index, setIndex] = useState(0);

  const scrollRef = useRef(null);
  const idxRef = useRef(0);
  const timerRef = useRef(null);

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
        setWhatsappNumber(s?.whatsapp || s?.phone || "");
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

  const startAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const next = (idxRef.current + 1) % SLIDES.length;
      idxRef.current = next;
      setIndex(next);
      if (scrollRef.current) {
        scrollRef.current.scrollToOffset({ offset: next * W, animated: true });
      }
    }, 4000);
  };

  useEffect(() => {
    startAuto();
    return () => clearInterval(timerRef.current);
  }, []);

  const openWhatsApp = () => {
    if (whatsappNumber) {
      const num = whatsappNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
      Linking.openURL(`https://wa.me/234${num}`);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      {/* Header: logo (left) + contact support (right) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: (insets.top || 24) + 8,
        }}
      >
        {logoFailed ? (
          <View
            style={{
              height: 42,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: F.bold,
                fontSize: 14,
                fontWeight: "700",
                color: COLORS.black,
              }}
            >
              {BRAND}
            </Text>
          </View>
        ) : (
          <Image
            source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
            resizeMode="contain"
            onError={() => setLogoFailed(true)}
          />
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openWhatsApp}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(79,70,229,0.25)",
            backgroundColor: "rgba(79,70,229,0.06)",
          }}
        >
          <Ionicons name="logo-whatsapp" size={16} color={WHATSAPP_GREEN} />
          <Text
            style={{
              fontFamily: F.semiBold,
              fontSize: 12.5,
              fontWeight: "600",
              color: COLORS.primary,
            }}
          >
            Contact support
          </Text>
        </TouchableOpacity>
      </View>

      {/* Onboarding carousel */}
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <FlatList
          ref={scrollRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / W);
            idxRef.current = i;
            setIndex(i);
            startAuto();
          }}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item }) => (
            <View
              style={{
                width: W,
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 26,
                  paddingHorizontal: 24,
                  paddingTop: 26,
                  paddingBottom: 26,
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.22,
                  shadowRadius: 18,
                  elevation: 8,
                }}
              >
                <Illustration slide={item} glow={glow} />

                <Text
                  style={{
                    fontFamily: F.bold,
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#ffffff",
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
                    color: "rgba(255,255,255,0.78)",
                    textAlign: "center",
                    lineHeight: 21,
                    marginTop: 10,
                    paddingHorizontal: 6,
                  }}
                >
                  {item.sub}
                </Text>

                <Dots index={index} />
              </LinearGradient>
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
          <LinearGradient
            colors={BTN_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 54,
              borderRadius: 27,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.30,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontFamily: F.semiBold,
                fontSize: 15.5,
                fontWeight: "700",
                color: "#ffffff",
              }}
            >
              Get Started
            </Text>
          </LinearGradient>
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
              color: COLORS.primary,
            }}
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
