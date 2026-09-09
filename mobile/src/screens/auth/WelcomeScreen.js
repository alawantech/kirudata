import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Linking,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_500Medium } from "@expo-google-fonts/poppins";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SPLASH_COLORS as C, SPLASH_FONTS as F } from "../../constants/splashTheme";
import client, { API_BASE } from "../../api/client";

const { width: W } = Dimensions.get("window");
const HERO_SIZE = Math.min(W * 0.52, 220);
const LOGO_CACHE_KEY = "cached_logo_url";
const LOCAL_LOGO = require("../../../assets/logo-gsub.png");

/* ── tiny reusable pieces ────────────────────────────────── */

function DashedRing({ size, opacity, rotation }) {
  const r = size / 2;
  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: r,
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

function GlassCircle({ size, children, style }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.055)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </View>
  );
}

function GlassPill({ children, style }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.055)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        ...style,
      }}
    >
      {children}
    </View>
  );
}

function GlassSquare({ size, children, style }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.055)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </View>
  );
}

function PhoneIcon() {
  return (
    <View
      style={{
        width: 52,
        height: 96,
        borderRadius: 14,
        backgroundColor: C.indigo1,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: C.indigo1,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Wifi glyph */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 16,
            height: 8,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderWidth: 1.8,
            borderBottomWidth: 0,
            borderColor: "white",
            marginBottom: -1.5,
          }}
        />
        <View
          style={{
            width: 10,
            height: 5,
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            borderWidth: 1.8,
            borderBottomWidth: 0,
            borderColor: "white",
            marginBottom: -1,
          }}
        />
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "white" }} />
      </View>
    </View>
  );
}

function WifiIconSvg({ size = 16, color = C.lime1 }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size,
          height: size / 2,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: size * 0.6,
          height: size * 0.3,
          borderTopLeftRadius: size * 0.3,
          borderTopRightRadius: size * 0.3,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: color,
          marginBottom: -0.5,
        }}
      />
      <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: color }} />
    </View>
  );
}

function LogoMark({ size = 36 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.42,
        backgroundColor: C.indigo1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.lime1 }} />
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 14,
            height: 7,
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            borderWidth: 1.6,
            borderBottomWidth: 0,
            borderColor: "white",
            marginBottom: -1.5,
          }}
        />
        <View
          style={{
            width: 8,
            height: 4,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderWidth: 1.6,
            borderBottomWidth: 0,
            borderColor: "white",
            marginBottom: -1,
          }}
        />
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "white" }} />
      </View>
    </View>
  );
}

/* ── Orbiting network badges around the hero ring ─────── */
const NETWORKS = [
  { label: "MTN", color: "#F5C518", textColor: "#1a1a00" },
  { label: "Glo", color: "#4CAF50", textColor: "#fff" },
  { label: "Airtel", color: "#E53935", textColor: "#fff" },
  { label: "9mobile", color: "#4CAF50", textColor: "#fff" },
];

function OrbitingBadges({ orbitAnim, heroSize }) {
  const orbitRadius = heroSize * 0.42;

  // The orbit container rotates; each badge counter-rotates to stay upright
  const containerRotation = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 0,
        height: 0,
        transform: [{ rotate: containerRotation }],
      }}
      pointerEvents="none"
    >
      {NETWORKS.map((net, i) => {
        const angle = (i * Math.PI) / 2 - Math.PI / 2;
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;

        return (
          <Animated.View
            key={net.label}
            style={{
              position: "absolute",
              left: x - 27,
              top: y - 15,
              width: 54,
              height: 30,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.07)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              transform: [{ rotate: containerRotation }],
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: net.color,
              }}
            />
            <Text
              style={{
                fontFamily: F.semiBold,
                fontSize: 9.5,
                fontWeight: "600",
                color: net.textColor === "#fff" ? C.textPrimary : net.textColor,
                letterSpacing: 0.3,
              }}
            >
              {net.label}
            </Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

/* ── Pill icon (outside component for shared access) ───── */
function PillIcon({ type }) {
  if (type === "wifi") return <WifiIconSvg size={13} color={C.lime1} />;
  if (type === "bolt") {
    return (
      <View style={{ width: 8, height: 13, alignItems: "center" }}>
        <View style={{ width: 6, height: 8, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 5, borderBottomColor: C.lime1, borderLeftColor: "transparent", borderRightColor: "transparent", marginBottom: -1 }} />
        <View style={{ width: 6, height: 6, borderTopWidth: 5, borderLeftWidth: 3, borderRightWidth: 3, borderTopColor: C.lime1, borderLeftColor: "transparent", borderRightColor: "transparent" }} />
      </View>
    );
  }
  if (type === "tv") {
    return (
      <View style={{ width: 14, height: 11, borderRadius: 2, borderWidth: 1.5, borderColor: C.lime1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 1 }}>
        <View style={{ width: 4, height: 1.5, backgroundColor: C.lime1, borderRadius: 0.5 }} />
      </View>
    );
  }
  if (type === "flash") {
    return (
      <View style={{ width: 10, height: 16, alignItems: "center" }}>
        <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 9, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: C.lime1, marginBottom: -2, marginLeft: 2 }} />
        <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 9, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: C.lime1, marginLeft: -2 }} />
      </View>
    );
  }
  return null;
}

/* ── Animated pill with staggered entrance + subtle glow ── */
function AnimatedPillItem({ p, animValue, glowValue }) {
  const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const bgGlow = glowValue.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] });

  return (
    <Animated.View style={{ opacity: animValue, transform: [{ scale }] }}>
      <View style={{ position: "relative", overflow: "hidden", borderRadius: 20 }}>
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: C.lime1,
            borderRadius: 20,
            opacity: bgGlow,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: C.glassFill,
            borderWidth: 1,
            borderColor: C.glassBorder,
          }}
        >
          <PillIcon type={p.icon} />
          <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.textPrimary, fontWeight: "500" }}>
            {p.label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ── main component ─────────────────────────────────────── */

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // Entrance animations
  const heroScale = useRef(new Animated.Value(0.85)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(16)).current;

  // Ring rotation
  const ringRotation = useRef(new Animated.Value(0)).current;
  // Network badge orbit (continuous)
  const orbitAnim = useRef(new Animated.Value(0)).current;

  const pillData = [
    { icon: "wifi", label: "Data" },
    { icon: "bolt", label: "Airtime" },
    { icon: "tv", label: "Cable TV" },
    { icon: "flash", label: "Electricity" },
  ];

  // Pill chip staggered entrance + breathing
  const pillAnims = useRef(pillData.map(() => new Animated.Value(0))).current;
  const pillGlows = useRef(pillData.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Fetch logo + settings (same pattern as LoginScreen)
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
    client
      .get("/public/settings")
      .then((r) => {
        const s = r.data?.data?.settings;
        setWhatsappNumber(s?.whatsapp || s?.phone || "");
        const url = normaliseUrl(s?.logoUrl);
        if (url) { setLogoUrl(url); AsyncStorage.setItem(LOGO_CACHE_KEY, url); }
      })
      .catch(() => {});

    // Staggered entrance
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(heroScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();

    // Ring rotation (slow)
    Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Network badges orbit (smooth continuous loop)
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Pill chips staggered entrance
    Animated.stagger(
      80,
      pillAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true })
      )
    ).start();

    // Pill chips subtle breathing glow (continuous loop, staggered phases)
    pillGlows.forEach((glow, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 300),
          Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);

  if (!fontsLoaded) return null;

  const ringRot = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const openWhatsApp = () => {
    if (whatsappNumber) {
      const num = whatsappNumber.replace(/[^0-9]/g, "").replace(/^0+/, "");
      Linking.openURL(`https://wa.me/234${num}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bgDeep }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Background glows */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <View
            style={{
              position: "absolute",
              top: -80,
              left: W / 2 - 160,
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: C.bgViolet,
              opacity: 0.45,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -60,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: C.lime2,
              opacity: 0.07,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: -40,
              left: W / 2 - 100,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: C.indigo1,
              opacity: 0.2,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingTop: (insets.top || 44) + 4,
            paddingHorizontal: 20,
          }}
        >
          <Image
            source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
            style={{ width: 112, height: 112, borderRadius: 24 }}
            resizeMode="contain"
            onError={() => setLogoUrl(null)}
          />
          <View>
            <Text style={{ fontFamily: F.bold, fontSize: 18, fontWeight: "700", color: C.textPrimary, lineHeight: 20 }}>Kiru</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 9, fontWeight: "500", color: C.lime1, letterSpacing: 2.5, marginTop: -1 }}>DATA SUB</Text>
          </View>
        </View>

        {/* Hero illustration */}
        <Animated.View
          style={{
            width: HERO_SIZE,
            height: HERO_SIZE,
            alignSelf: "center",
            marginTop: 8,
            opacity: heroOpacity,
            transform: [{ scale: heroScale }],
          }}
        >
          {/* Outer dashed rings */}
          <DashedRing size={HERO_SIZE} opacity={0.14} rotation={ringRot} />
          <DashedRing size={HERO_SIZE * 0.82} opacity={0.08} rotation={ringRot} />

          {/* Glassy core circle */}
          <GlassCircle
            size={HERO_SIZE * 0.52}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: -(HERO_SIZE * 0.52) / 2,
              marginLeft: -(HERO_SIZE * 0.52) / 2,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            <PhoneIcon />
          </GlassCircle>

          {/* Orbiting network badges */}
          <OrbitingBadges
            orbitAnim={orbitAnim}
            heroSize={HERO_SIZE}
            ringRot={ringRot}
          />

          {/* Floating glass squares */}
          <GlassSquare
            size={30}
            style={{ position: "absolute", top: HERO_SIZE * 0.18, left: -4 }}
          >
            <WifiIconSvg size={12} color="rgba(255,255,255,0.5)" />
          </GlassSquare>
          <GlassSquare
            size={28}
            style={{ position: "absolute", bottom: HERO_SIZE * 0.2, right: 0 }}
          >
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" }} />
              <View style={{ width: 1.5, height: 5, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 0.75, marginTop: 1 }} />
              <View style={{ width: 1.5, height: 3.5, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 0.75, marginTop: 0.5 }} />
            </View>
          </GlassSquare>
        </Animated.View>

        {/* Headline */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textY }],
            alignItems: "center",
            paddingHorizontal: 24,
            marginTop: 2,
          }}
        >
          <Text
            style={{
              fontFamily: F.bold,
              fontSize: 25,
              fontWeight: "700",
              color: C.textPrimary,
              textAlign: "center",
              lineHeight: 34,
            }}
          >
            Bills and airtime,{"\n"}
            <Text style={{ color: C.lime1 }}>made easy.</Text>
          </Text>
        </Animated.View>

        {/* Subtext */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textY }],
            paddingHorizontal: 28,
            marginTop: 6,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: F.medium,
              fontSize: 13,
              color: C.textSecondary,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Top up data, airtime, cable TV and exam pins in seconds — all in one place.
          </Text>
        </Animated.View>

        {/* Pill chips */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 20,
            marginTop: 12,
          }}
        >
          {pillData.map((p, i) => (
              <AnimatedPillItem
                key={p.label}
                p={p}
                animValue={pillAnims[i]}
                glowValue={pillGlows[i]}
              />
          ))}
        </View>

        {/* Buttons */}
        <Animated.View
          style={{
            opacity: btnOpacity,
            transform: [{ translateY: btnY }],
            paddingHorizontal: 24,
            marginTop: 16,
            gap: 10,
          }}
        >
          {/* Create account */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Register")}
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[C.indigo2, C.indigo1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 54,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: F.semiBold, fontSize: 15.5, fontWeight: "600", color: C.textPrimary }}>
                Create account
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign in */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Login")}
            style={{
              height: 54,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}
          >
            <Text style={{ fontFamily: F.semiBold, fontSize: 15.5, fontWeight: "600", color: C.textPrimary }}>
              Sign in
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms */}
        <Animated.View
          style={{
            opacity: btnOpacity,
            paddingHorizontal: 24,
            marginTop: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: C.textMuted, textAlign: "center", lineHeight: 17 }}>
            By continuing you agree to our{" "}
            <Text
              style={{ color: C.lime1, fontWeight: "600" }}
              onPress={() => navigation.navigate("Terms")}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              style={{ color: C.lime1, fontWeight: "600" }}
              onPress={() => navigation.navigate("Privacy")}
            >
              Privacy policy
            </Text>
          </Text>
        </Animated.View>

        {/* Contact support */}
        <Animated.View
          style={{
            opacity: btnOpacity,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openWhatsApp}
            style={{
              flexDirection: "row",
              alignItems: "center",
            gap: 6,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(182,255,92,0.25)",
              backgroundColor: "rgba(182,255,92,0.06)",
            }}
          >
            {/* Chat bubble icon */}
            <View style={{ width: 16, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: C.lime1, position: "relative" }}>
              <View style={{ position: "absolute", bottom: -4, left: 3, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 5, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: C.lime1 }} />
            </View>
            <Text style={{ fontFamily: F.semiBold, fontSize: 13, fontWeight: "600", color: C.lime1 }}>
              Contact support
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
