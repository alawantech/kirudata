"use client";

import Link from "next/link";
import Image from "next/image";
import { Manrope, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  GraduationCap,
  Headphones,
  Menu,
  Phone,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Tv,
  Users,
  Wallet,
  Wifi,
  X,
  Zap,
  MessageSquare,
  PhoneCall,
  Send,
  LogOut,
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
});

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function useCountUp(end, duration = 1800, startOnVisible = false, visible = true) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (startOnVisible && !visible) return;
    if (started.current) return;
    started.current = true;

    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, startOnVisible, visible]);

  return value;
}

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const SERVICES = [
  { icon: Phone, title: "Instant Airtime", description: "Top up MTN, Airtel, Glo and 9mobile without delays or failed reversals.", accent: "#f97316", tint: "rgba(249,115,22,0.12)", link: "/dashboard/airtime" },
  { icon: Wifi, title: "Discounted Data", description: "SME, gifting and corporate data plans with prices tuned for repeat buyers.", accent: "#4f46e5", tint: "rgba(79,70,229,0.12)", link: "/dashboard/data" },
  { icon: Tv, title: "Cable Renewals", description: "DStv, GOtv and Startimes subscriptions handled with real-time confirmation.", accent: "#7c3aed", tint: "rgba(124,58,237,0.12)", link: "/dashboard/cable" },
  { icon: Zap, title: "Electricity Tokens", description: "Prepaid meter tokens delivered fast across all major DISCOs in Nigeria.", accent: "#d97706", tint: "rgba(217,119,6,0.12)", link: "/dashboard/electricity" },
  { icon: GraduationCap, title: "Exam Pins", description: "WAEC, NECO and JAMB checker pins available the moment you need them.", accent: "#059669", tint: "rgba(5,150,105,0.12)", link: "/dashboard/exam" },
  { icon: CreditCard, title: "Data Card Pins", description: "Scratch card pins for bulk data resale and distribution.", accent: "#7c3aed", tint: "rgba(124,58,237,0.12)", link: "/dashboard/data-card" },
  { icon: PhoneCall, title: "Recharge Card Pins", description: "Airtime scratch cards for agents and resellers.", accent: "#16a34a", tint: "rgba(22,163,74,0.12)", link: "/dashboard/recharge-card" },
  { icon: MessageSquare, title: "Bulk SMS", description: "Send SMS to any number nationwide with reliable delivery tracking.", accent: "#0891b2", tint: "rgba(8,145,178,0.12)", link: "/dashboard/sms" },
];

const STATS = [
  { value: 50000, suffix: "+", label: "Active users", icon: Users },
  { value: 99.9, suffix: "%", label: "Uptime guaranteed", icon: Shield, decimals: 1 },
  { value: 10, suffix: "s", label: "Avg delivery", prefix: "<", icon: Clock },
  { value: 24, suffix: "/7", label: "Support access", icon: Headphones },
];

const VALUE_POINTS = [
  "Clean wallet funding and instant balance updates",
  "Transparent prices instead of hidden markups at checkout",
  "Built for casual buyers, agents and bulk vendors",
  "Reliable transaction history and support follow-up",
];

const WORKFLOW = [
  { step: "01", title: "Create your account", text: "Get onboarded quickly and move straight into your wallet dashboard." },
  { step: "02", title: "Fund once, transact repeatedly", text: "Use your wallet to buy airtime, data, tokens and subscriptions without friction." },
  { step: "03", title: "Scale with confidence", text: "Track transactions, serve customers faster and keep your margins visible." },
];

const TESTIMONIALS = [
  { name: "Amina Yusuf", role: "Campus reseller, Abuja", quote: "This is the first VTU dashboard I can confidently use during rush periods. Payments land fast and my customers stopped complaining about delays.", accent: "#38bdf8" },
  { name: "Tunde Bakare", role: "Bulk vendor, Ibadan", quote: "What matters to me is consistency. The pricing stays clear, the history is easy to audit and support actually responds like people who know the product.", accent: "#22c55e" },
  { name: "Chisom Okonkwo", role: "Busy parent, Lagos", quote: "I renew cable, pay electricity and buy data for my family from one place. It feels premium and it removes the stress from routine bill payments.", accent: "#f97316" },
];

const FAQS = [
  { question: "How fast are purchases delivered?", answer: "Most purchases are confirmed within seconds. If a provider is slow, the transaction stays traceable and support can step in quickly." },
  { question: "Can I use it for resale?", answer: "Yes. The platform is suitable for personal use and for resellers who need repeat purchases, margin visibility and stable wallet operations." },
  { question: "Do I need to wait for business hours?", answer: "No. The platform is available around the clock for airtime, data, cable and utility purchases." },
  { question: "What happens if a transaction fails?", answer: "Failed or interrupted transactions can be traced from your dashboard, and support can verify the provider response with you." },
];

const TICKER_BASE = [
  { name: "MTN", color: "#facc15" },
  { name: "Airtel", color: "#ef4444" },
  { name: "Glo", color: "#22c55e" },
  { name: "9mobile", color: "#14b8a6" },
  { name: "DStv", color: "#3b82f6" },
  { name: "GOtv", color: "#8b5cf6" },
  { name: "WAEC", color: "#f97316" },
  { name: "NECO", color: "#06b6d4" },
  { name: "IKEDC", color: "#f59e0b" },
  { name: "AEDC", color: "#10b981" },
];

const TICKER_ITEMS = [...TICKER_BASE, ...TICKER_BASE];

const NET_COLORS = {
  mtn: "#facc15",
  airtel: "#ef4444",
  glo: "#22c55e",
  "9mobile": "#14b8a6",
  etisalat: "#14b8a6",
};

function sectionReveal(visible, distance = 32) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0,0,0)" : "translate3d(0," + distance + "px,0)",
    transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
  };
}

function staggerReveal(visible, index, delay = 0.08) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.97)",
    transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) " + (index * delay) + "s, transform 0.7s cubic-bezier(0.16,1,0.3,1) " + (index * delay) + "s",
  };
}

function formatPrice(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  return value.toLocaleString();
}

function formatCount(value, decimals) {
  if (decimals > 0) return value.toFixed(decimals);
  return Math.round(value).toLocaleString();
}

function PhoneMockup() {
  return (
    <div className="lp-phone-wrap" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 320, height: 320, borderRadius: "50%", border: "2px solid rgba(56,189,248,0.12)", animation: "lp-ring-rotate 20s linear infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 360, height: 360, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.06)", animation: "lp-ring-rotate 30s linear infinite reverse", pointerEvents: "none" }} />

      <div className="lp-phone-frame">
        <div className="lp-phone-notch" />
        <div className="lp-phone-screen">
          <div className="lp-phone-header">
            <div className="lp-phone-logo">
              <div className="lp-phone-logo-dot"><span>G</span></div>
              <div>
                <div className="lp-phone-greeting">Good morning</div>
                <div className="lp-phone-name">Ibrahim</div>
              </div>
            </div>
            <div className="lp-phone-avatar">I</div>
          </div>

          <div className="lp-phone-balance-card">
            <div className="lp-phone-balance-label">Wallet Balance</div>
            <div className="lp-phone-balance-amount">{"\u20A6"}25,800</div>
            <div className="lp-phone-balance-actions">
              <div className="lp-phone-action-btn" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                <Send size={8} style={{ marginRight: 3 }} /> Fund
              </div>
              <div className="lp-phone-action-btn" style={{ background: "rgba(148,163,184,0.15)", color: "#7dd3fc" }}>
                History
              </div>
            </div>
          </div>

          <div className="lp-phone-actions-grid">
            {[
              { icon: "\u{1F4F1}", label: "Airtime", bg: "rgba(249,115,22,0.12)" },
              { icon: "\u{1F4F6}", label: "Data", bg: "rgba(79,70,229,0.12)" },
              { icon: "\u{1F4FA}", label: "Cable", bg: "rgba(124,58,237,0.12)" },
              { icon: "\u26A1", label: "Electric", bg: "rgba(217,119,6,0.12)" },
            ].map((item) => (
              <div key={item.label} className="lp-phone-action-item">
                <div className="lp-phone-action-icon" style={{ background: item.bg }}>{item.icon}</div>
                <div className="lp-phone-action-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="lp-phone-recent-title">Recent Activity</div>
          {[
            { name: "MTN SME 5GB", sub: "Data \u00B7 2 min ago", amount: "+\u20A61,200", color: "#facc15", icon: "\u{1F4F6}" },
            { name: "IKEDC Token", sub: "Electricity \u00B7 1hr ago", amount: "+\u20A65,000", color: "#f59e0b", icon: "\u26A1" },
            { name: "GOtv Renewal", sub: "Cable \u00B7 Yesterday", amount: "+\u20A62,100", color: "#8b5cf6", icon: "\u{1F4FA}" },
          ].map((tx) => (
            <div key={tx.name} className="lp-phone-tx-item">
              <div className="lp-phone-tx-icon" style={{ background: tx.color + "18" }}>{tx.icon}</div>
              <div className="lp-phone-tx-details">
                <div className="lp-phone-tx-name">{tx.name}</div>
                <div className="lp-phone-tx-sub">{tx.sub}</div>
              </div>
              <div className="lp-phone-tx-amount">{tx.amount}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-floating-badge" style={{ top: 30, right: -70, animation: "lp-badge-float-1 6s ease-in-out infinite" }}>
        <div className="lp-floating-badge-icon" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}><Shield size={18} /></div>
        <div>
          <div className="lp-floating-badge-text">Secure & Encrypted</div>
          <div className="lp-floating-badge-sub">Bank-grade security</div>
        </div>
      </div>

      <div className="lp-floating-badge" style={{ top: 200, left: -80, animation: "lp-badge-float-2 7s ease-in-out infinite" }}>
        <div className="lp-floating-badge-icon" style={{ background: "rgba(56,189,248,0.12)", color: "#7dd3fc" }}><Zap size={18} /></div>
        <div>
          <div className="lp-floating-badge-text">Instant Delivery</div>
          <div className="lp-floating-badge-sub">Under 10 seconds</div>
        </div>
      </div>

      <div className="lp-floating-badge" style={{ bottom: 60, right: -65, animation: "lp-badge-float-3 5.5s ease-in-out infinite" }}>
        <div className="lp-floating-badge-icon" style={{ background: "rgba(250,204,21,0.12)", color: "#facc15" }}><Star size={18} /></div>
        <div>
          <div className="lp-floating-badge-text">4.9/5 Rating</div>
          <div className="lp-floating-badge-sub">50k+ happy users</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ label, title, description, align, maxWidth }) {
  const maxW = maxWidth || 680;
  const al = align || "left";
  return (
    <div style={{ maxWidth: maxW, textAlign: al, marginBottom: "2.5rem" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: ".6rem", fontSize: ".82rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#7dd3fc", fontWeight: 700, marginBottom: "1rem" }}>
        <span style={{ width: 24, height: 2, borderRadius: 2, background: "linear-gradient(90deg,#38bdf8,#2563eb)" }} />
        {label}
      </div>
      <h2 className={spaceGrotesk.className} style={{ fontSize: "clamp(2rem,4vw,3.25rem)", lineHeight: 1.08, letterSpacing: "-0.05em", color: "#f8fbff" }}>
        {title}
      </h2>
      {description && (
        <p style={{ marginTop: "1rem", color: "rgba(226,232,240,0.68)", lineHeight: 1.85, fontSize: "1.02rem" }}>
          {description}
        </p>
      )}
    </div>
  );
}

function StatCounter({ stat, visible, index }) {
  var count = useCountUp(stat.value, 1800, true, visible);
  var Icon = stat.icon;

  return (
    <div className="lp-glass-card" style={{ ...staggerReveal(visible, index), padding: "1.75rem", borderRadius: 24, textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: "rgba(56,189,248,0.12)", color: "#7dd3fc", margin: "0 auto 1rem" }}>
        <Icon size={22} />
      </div>
      <div className={spaceGrotesk.className + " lp-counter-value"} style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f8fafc", lineHeight: 1 }}>
        {(stat.prefix || "") + formatCount(count, stat.decimals || 0) + (stat.suffix || "")}
      </div>
      <div style={{ marginTop: ".5rem", fontWeight: 600, color: "rgba(226,232,240,0.68)", fontSize: ".95rem" }}>
        {stat.label}
      </div>
    </div>
  );
}

export default function LandingPage() {
  var menuOpenState = useState(false);
  var menuOpen = menuOpenState[0];
  var setMenuOpen = menuOpenState[1];
  var scrolledState = useState(false);
  var scrolled = scrolledState[0];
  var setScrolled = scrolledState[1];
  var networksState = useState([]);
  var networks = networksState[0];
  var setNetworks = networksState[1];
  var activeNetIdState = useState(null);
  var activeNetId = activeNetIdState[0];
  var setActiveNetId = activeNetIdState[1];
  var plansState = useState([]);
  var plans = plansState[0];
  var setPlans = plansState[1];
  var plansLoadingState = useState(false);
  var plansLoading = plansLoadingState[0];
  var setPlansLoading = plansLoadingState[1];
  var openFaqState = useState(0);
  var openFaq = openFaqState[0];
  var setOpenFaq = openFaqState[1];
  var authObj = useAuth();
  var user = authObj.user;
  var logout = authObj.logout;
  var router = useRouter();
  var settings = useSiteSettings();

  var siteName = (settings && settings.sitename) || "KIRU DATA";
  var siteDescription = (settings && settings.sitedesc) || "A premium VTU and bill payment experience built for speed, trust and repeat use.";
  var logoUrl = (settings && settings.logoUrl) || "";
  var apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v2";

  var heroRefObj = useReveal(0.1);
  var heroRef = heroRefObj[0];
  var heroVisible = heroRefObj[1];
  var statsRefObj = useReveal(0.2);
  var statsRef = statsRefObj[0];
  var statsVisible = statsRefObj[1];
  var servicesRefObj = useReveal(0.1);
  var servicesRef = servicesRefObj[0];
  var servicesVisible = servicesRefObj[1];
  var proofRefObj = useReveal(0.15);
  var proofRef = proofRefObj[0];
  var proofVisible = proofRefObj[1];
  var whyRefObj = useReveal(0.1);
  var whyRef = whyRefObj[0];
  var whyVisible = whyRefObj[1];
  var pricingRefObj = useReveal(0.1);
  var pricingRef = pricingRefObj[0];
  var pricingVisible = pricingRefObj[1];
  var testimonialsRefObj = useReveal(0.15);
  var testimonialsRef = testimonialsRefObj[0];
  var testimonialsVisible = testimonialsRefObj[1];
  var faqRefObj = useReveal(0.1);
  var faqRef = faqRefObj[0];
  var faqVisible = faqRefObj[1];

  var primaryHref = user ? "/dashboard" : "/register";
  var primaryLabel = user ? "Open dashboard" : "Create free account";
  var activeNetwork = networks.find(function(item) { return item.id === activeNetId; }) || null;
  var activeAccent = NET_COLORS[(activeNetwork && activeNetwork.name && activeNetwork.name.toLowerCase()) || ""] || "#38bdf8";
  var featuredPlans = plans.slice(0, 6);
  var socialLinks = [];
  if (settings && settings.whatsapp) socialLinks.push({ label: "WhatsApp", href: "https://wa.me/" + settings.whatsapp.replace(/\D/g, "") });
  if (settings && settings.facebook) socialLinks.push({ label: "Facebook", href: settings.facebook });
  if (settings && settings.instagram) socialLinks.push({ label: "Instagram", href: settings.instagram });
  if (settings && settings.twitter) socialLinks.push({ label: "Twitter", href: settings.twitter });

  useEffect(function() {
    var onScroll = function() { setScrolled(window.scrollY > 18); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return function() { window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(function() {
    fetch(apiBase + "/data/networks")
      .then(function(response) { return response.json(); })
      .then(function(payload) {
        var nextNetworks = (payload && payload.data && payload.data.networks) || [];
        setNetworks(nextNetworks);
        if (nextNetworks.length > 0) {
          setPlansLoading(true);
          setActiveNetId(nextNetworks[0].id);
        }
      })
      .catch(function() { setNetworks([]); });
  }, [apiBase]);

  useEffect(function() {
    if (!activeNetId) return;
    fetch(apiBase + "/data/plans?network=" + activeNetId)
      .then(function(response) { return response.json(); })
      .then(function(payload) { setPlans((payload && payload.data && payload.data.plans) || []); })
      .catch(function() { setPlans([]); })
      .finally(function() { setPlansLoading(false); });
  }, [activeNetId, apiBase]);

  var whatsappHref = "";
  if (settings && settings.whatsapp) {
    whatsappHref = "https://wa.me/" + settings.whatsapp.replace(/\D/g, "");
  }

  return (
    <div className={manrope.className} style={{ background: "radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 32%), radial-gradient(circle at 82% 14%, rgba(251,191,36,0.13), transparent 26%), linear-gradient(180deg, #05111f 0%, #071a2f 48%, #04101d 100%)", color: "#e5eefb", overflowX: "hidden" }}>

      {whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" style={{ position: "fixed", right: "1.25rem", bottom: "1.25rem", zIndex: 120, width: 58, height: 58, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 20px 45px rgba(34,197,94,0.35)", border: "1px solid rgba(255,255,255,0.16)", animation: "lp-float-card 4.5s ease-in-out infinite" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
        </a>
      )}

      <nav style={{ position: "fixed", inset: "0 0 auto 0", zIndex: 100, backdropFilter: scrolled ? "blur(18px)" : "blur(0px)", background: scrolled ? "rgba(4,16,29,0.82)" : "transparent", borderBottom: scrolled ? "1px solid rgba(148,163,184,0.14)" : "1px solid transparent", transition: "all 0.25s ease" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 1.25rem", minHeight: 82, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <Link href="/home" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <AppLogo showBrandName={false} logoHeight={60} />
          </Link>

          <div className="lp-nav-links" style={{ gap: "1.5rem", alignItems: "center" }}>
            {NAV_LINKS.map(function(link) {
              return (
                <Link key={link.label} href={link.href} style={{ color: "rgba(226,232,240,0.76)", textDecoration: "none", fontSize: ".92rem", fontWeight: 600 }}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            {user ? (
              <React.Fragment>
                <button type="button" onClick={function() { router.push("/dashboard"); }} className="lp-cta-btn" style={{ border: "none", borderRadius: 999, padding: ".8rem 1.25rem", background: "linear-gradient(135deg,#0ea5e9,#2563eb)", color: "white", fontWeight: 700, cursor: "pointer" }}>
                  Dashboard
                </button>
                <button type="button" onClick={function() { logout(); router.push("/home"); }} style={{ border: "1px solid rgba(148,163,184,0.25)", borderRadius: 999, padding: ".8rem 1rem", background: "transparent", color: "rgba(226,232,240,0.8)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: ".4rem", fontSize: ".88rem" }}>
                  <LogOut size={15} /> Log out
                </button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Link href="/login" className="lp-nav-links" style={{ color: "rgba(226,232,240,0.78)", textDecoration: "none", fontWeight: 600, fontSize: ".92rem" }}>
                  Login
                </Link>
                <Link href="/register" className="lp-cta-btn" style={{ textDecoration: "none", borderRadius: 999, padding: ".8rem 1.3rem", background: "linear-gradient(135deg,#38bdf8,#1d4ed8)", color: "white", fontWeight: 700, whiteSpace: "nowrap" }}>
                  Get started
                </Link>
              </React.Fragment>
            )}
            <button type="button" className="lp-burger" onClick={function() { setMenuOpen(function(c) { return !c; }); }} aria-label="Toggle menu" style={{ width: 42, height: 42, borderRadius: 12, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.88)", color: "white", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ margin: "0 1rem 1rem", padding: "1rem", borderRadius: 24, background: "rgba(4,16,29,0.96)", border: "1px solid rgba(148,163,184,0.14)", boxShadow: "0 18px 45px rgba(2,6,23,0.4)" }}>
            <div style={{ display: "grid", gap: ".9rem" }}>
              {NAV_LINKS.map(function(link) {
                return (
                  <Link key={link.label} href={link.href} onClick={function() { setMenuOpen(false); }} style={{ textDecoration: "none", color: "rgba(226,232,240,0.88)", fontWeight: 600 }}>
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div style={{ display: "grid", gap: ".75rem", marginTop: "1rem" }}>
              {user ? (
                <React.Fragment>
                  <button type="button" onClick={function() { setMenuOpen(false); router.push("/dashboard"); }} style={{ border: "none", borderRadius: 14, padding: ".9rem 1rem", background: "linear-gradient(135deg,#0ea5e9,#2563eb)", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    Go to dashboard
                  </button>
                  <button type="button" onClick={function() { setMenuOpen(false); logout(); router.push("/home"); }} style={{ border: "1px solid rgba(148,163,184,0.25)", borderRadius: 14, padding: ".9rem 1rem", background: "transparent", color: "rgba(226,232,240,0.8)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem" }}>
                    <LogOut size={16} /> Log out
                  </button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Link href="/login" onClick={function() { setMenuOpen(false); }} style={{ textDecoration: "none", textAlign: "center", borderRadius: 14, padding: ".9rem 1rem", background: "rgba(148,163,184,0.1)", color: "white", fontWeight: 700 }}>
                    Login
                  </Link>
                  <Link href="/register" onClick={function() { setMenuOpen(false); }} style={{ textDecoration: "none", textAlign: "center", borderRadius: 14, padding: ".9rem 1rem", background: "linear-gradient(135deg,#38bdf8,#1d4ed8)", color: "white", fontWeight: 700 }}>
                    Create free account
                  </Link>
                </React.Fragment>
              )}
            </div>
          </div>
        )}
      </nav>

      <section ref={heroRef} style={{ position: "relative", padding: "8.5rem 1.25rem 4.5rem", minHeight: "100vh", overflow: "hidden" }}>
        {/* Full-width background image */}
        <div className="lp-hero-bg">
          <img src="/hero-bg.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "70% center" }} />
        </div>
        <div className="lp-hero-mesh" />
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-orb lp-orb-c" />

        {/* Floating orbit dots */}
        <div className="lp-orbit-dot" style={{ "--orbit-r": "200px", "--orbit-dur": "18s", background: "#38bdf8", boxShadow: "0 0 12px #38bdf8" }} />
        <div className="lp-orbit-dot" style={{ "--orbit-r": "240px", "--orbit-dur": "25s", background: "#facc15", boxShadow: "0 0 12px #facc15", animationDelay: "-8s" }} />
        <div className="lp-orbit-dot" style={{ "--orbit-r": "160px", "--orbit-dur": "15s", background: "#22c55e", boxShadow: "0 0 12px #22c55e", animationDelay: "-4s" }} />

        <div className="lp-hero-grid" style={{ maxWidth: 1240, margin: "0 auto", gap: "3rem", alignItems: "center" }}>
          <div style={{ position: "relative", zIndex: 2, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translate3d(0,0,0)" : "translate3d(0,32px,0)", transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".6rem", padding: ".55rem 1rem", borderRadius: 999, background: "rgba(8,47,73,0.55)", border: "1px solid rgba(56,189,248,0.22)", color: "#7dd3fc", fontSize: ".78rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 6px rgba(34,197,94,0.14)", animation: "lp-pulse 1.8s ease-in-out infinite" }} />
              Welcome to {siteName}
            </div>

            <h1 className={spaceGrotesk.className} style={{ fontSize: "clamp(2.8rem,6.5vw,4.5rem)", lineHeight: 1.02, letterSpacing: "-0.06em", margin: "1.4rem 0 1.25rem", color: "#f8fbff", maxWidth: 680 }}>
              Your Trusted{" "}
              <span style={{ display: "block", background: "linear-gradient(135deg,#f8fafc 0%, #7dd3fc 34%, #facc15 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                VTU Partner in Nigeria.
              </span>
            </h1>

            <p style={{ maxWidth: 620, fontSize: "1.06rem", lineHeight: 1.85, color: "rgba(226,232,240,0.72)" }}>
              Buy airtime, data, cable TV, electricity tokens and exam pins at the best rates. Fast, reliable and built for you.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".9rem", marginTop: "2rem", alignItems: "center" }}>
              <Link href={primaryHref} className="lp-cta-btn" style={{ position: "relative", overflow: "hidden", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".55rem", padding: ".95rem 1.35rem", borderRadius: 999, background: "linear-gradient(135deg,#38bdf8,#2563eb)", color: "white", fontWeight: 800, boxShadow: "0 18px 45px rgba(37,99,235,0.3)" }}>
                <span className="lp-button-sheen" />
                {primaryLabel}
                <ArrowRight size={18} />
              </Link>
              <span style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".6rem", padding: ".85rem 1.3rem", borderRadius: 14, background: "rgba(15,23,42,0.7)", color: "#e2e8f0", fontWeight: 700, border: "1px solid rgba(148,163,184,0.18)", fontSize: ".92rem", backdropFilter: "blur(8px)", cursor: "default" }}>
                <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
                  <path d="M1 1L11 11L1 21V1Z" fill="#4ADE80"/>
                  <path d="M1 1L14 8L11 11L1 1Z" fill="#38BDF8"/>
                  <path d="M1 21L14 14L11 11L1 21Z" fill="#F97316"/>
                  <path d="M14 8L18 10L18 12L14 14L11 11L14 8Z" fill="#FACC15"/>
                </svg>
                Google Play
              </span>
              <span style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".6rem", padding: ".85rem 1.3rem", borderRadius: 14, background: "rgba(15,23,42,0.7)", color: "#e2e8f0", fontWeight: 700, border: "1px solid rgba(148,163,184,0.18)", fontSize: ".92rem", backdropFilter: "blur(8px)", cursor: "default" }}>
                <svg width="18" height="22" viewBox="0 0 18 22" fill="white">
                  <path d="M14.94 11.65c-.03-2.67 2.17-3.95 2.27-4.01-1.24-1.82-3.17-2.07-3.86-2.09-1.64-.17-3.21.97-4.04.97-.84 0-2.13-.95-3.51-.92-1.81.03-3.49 1.05-4.42 2.67-1.89 3.26-.48 8.09 1.36 10.74.9 1.29 1.97 2.74 3.38 2.69 1.36-.05 1.87-.88 3.51-.88 1.63 0 2.11.88 3.53.85 1.46-.02 2.38-1.31 3.27-2.61 1.04-1.49 1.47-2.94 1.49-3.02-.03-.01-2.87-1.1-2.9-4.36l-.18.07zM12.04 3.79c.75-.91 1.25-2.18 1.11-3.44-1.07.04-2.36.71-3.13 1.62-.69.81-1.29 2.1-1.13 3.34 1.19.09 2.4-.6 3.15-1.52z"/>
                </svg>
                App Store
              </span>
            </div>

            <div className="lp-band-grid" style={{ marginTop: "2.4rem" }}>
              {[
                { value: "50k+", label: "active users" },
                { value: "4.9/5", label: "customer rating" },
                { value: "24/7", label: "purchase access" },
                { value: "1 app", label: "for all bills" },
              ].map(function(item) {
                return (
                  <div key={item.label} style={{ padding: "1rem 1.05rem", borderRadius: 20, background: "rgba(8,15,30,0.58)", border: "1px solid rgba(148,163,184,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                    <div className={spaceGrotesk.className} style={{ fontSize: "1.45rem", fontWeight: 700, color: "#f8fafc" }}>{item.value}</div>
                    <div style={{ marginTop: ".2rem", fontSize: ".82rem", color: "rgba(226,232,240,0.58)" }}>{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 2, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translate3d(0,0,0)" : "translate3d(0,40px,0)", transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s" }}>
            {/* Glow behind phone */}
            <div className="lp-phone-glow" />
            {/* Decorative dots */}
            <div style={{ position: "absolute", top: 20, right: -30, width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 20px #38bdf8", animation: "lp-pulse 2s ease-in-out infinite", opacity: 0.7 }} />
            <div style={{ position: "absolute", bottom: 60, left: -25, width: 10, height: 10, borderRadius: "50%", background: "#facc15", boxShadow: "0 0 20px #facc15", animation: "lp-pulse 2.5s ease-in-out infinite 0.5s", opacity: 0.6 }} />
            <div style={{ position: "absolute", top: "40%", right: -20, width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 15px #22c55e", animation: "lp-pulse 3s ease-in-out infinite 1s", opacity: 0.5 }} />
            <PhoneMockup />
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 2rem" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", borderTop: "1px solid rgba(148,163,184,0.1)", borderBottom: "1px solid rgba(148,163,184,0.1)", overflow: "hidden", padding: "1rem 0" }}>
          <div style={{ display: "flex", width: "max-content", animation: "lp-marquee 24s linear infinite", gap: "1rem" }}>
            {TICKER_ITEMS.map(function(item, index) {
              return (
                <div key={item.name + "-" + index} style={{ display: "inline-flex", alignItems: "center", gap: ".65rem", padding: ".65rem 1rem", borderRadius: 999, background: "rgba(15,23,42,0.52)", border: "1px solid rgba(148,163,184,0.12)", color: "rgba(226,232,240,0.82)", fontWeight: 700 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, boxShadow: "0 0 18px " + item.color }} />
                  {item.name}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section ref={statsRef} style={{ padding: "0 1.25rem 5rem" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem", ...sectionReveal(statsVisible) }}>
            <SectionHeading label="Performance" title="Numbers that speak for themselves" description="Every metric is tuned to give you confidence in every transaction." align="center" maxWidth={600} />
          </div>
          <div className="lp-band-grid" style={{ gap: "1.25rem" }}>
            {STATS.map(function(stat, index) {
              return <StatCounter key={stat.label} stat={stat} visible={statsVisible} index={index} />;
            })}
          </div>
        </div>
      </section>

      <section id="services" ref={servicesRef} style={{ padding: "0 1.25rem 5rem" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", ...sectionReveal(servicesVisible) }}>
          <SectionHeading label="Service stack" title="Everything your customers expect from a modern bills and VTU platform." description="The design leads with clarity and trust while covering the core services that drive daily usage and repeat purchases." />
          <div className="lp-service-grid" style={{ gap: "1rem" }}>
            {SERVICES.map(function(service, index) {
              var Icon = service.icon;
              return (
                <Link key={service.title} href={user ? service.link : "/register"} style={{ textDecoration: "none" }}>
                  <div className="lp-glass-card lp-service-card" style={{ ...staggerReveal(servicesVisible, index), padding: "1.4rem", borderRadius: 28, minHeight: 230, cursor: "pointer", "--card-glow": service.accent + "20" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, display: "grid", placeItems: "center", background: service.tint, color: service.accent, boxShadow: "inset 0 0 0 1px " + service.accent + "22" }}>
                      <Icon size={24} />
                    </div>
                    <h3 style={{ margin: "1rem 0 .65rem", fontSize: "1.08rem", color: "#f8fafc" }}>{service.title}</h3>
                    <p style={{ color: "rgba(226,232,240,0.66)", lineHeight: 1.75, fontSize: ".95rem" }}>{service.description}</p>
                    <div style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: ".45rem", color: service.accent, fontWeight: 700, fontSize: ".88rem" }}>
                      Ready to use
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why-us" ref={whyRef} style={{ padding: "0 1.25rem 5rem" }}>
        <div className="lp-showcase-grid" style={{ maxWidth: 1240, margin: "0 auto", gap: "1.5rem", ...sectionReveal(whyVisible) }}>
          <div className="lp-glass-card" style={{ padding: "2rem", borderRadius: 30 }}>
            <SectionHeading label="Operational advantage" title="Designed to convert first-time visitors into repeat buyers." description="The composition balances emotion and proof. It shows the platform is approachable for casual users while still strong enough for high-volume resellers." />
            <div style={{ display: "grid", gap: "1rem", marginTop: "1.6rem" }}>
              {WORKFLOW.map(function(item) {
                return (
                  <div key={item.step} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "1rem", alignItems: "start", padding: "1rem", borderRadius: 22, background: "rgba(15,23,42,0.48)", border: "1px solid rgba(148,163,184,0.1)" }}>
                    <div className={spaceGrotesk.className} style={{ fontSize: "1.7rem", fontWeight: 700, color: "#7dd3fc", lineHeight: 1 }}>{item.step}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#f8fafc" }}>{item.title}</div>
                      <div style={{ marginTop: ".4rem", color: "rgba(226,232,240,0.64)", lineHeight: 1.7 }}>{item.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ position: "relative", minHeight: 310, borderRadius: 30, overflow: "hidden", border: "1px solid rgba(148,163,184,0.14)", boxShadow: "0 24px 70px rgba(2,8,23,0.4)", background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(37,99,235,0.12), rgba(124,58,237,0.08))" }}>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#38bdf8,#2563eb)", margin: "0 auto 1.5rem", boxShadow: "0 20px 50px rgba(37,99,235,0.4)" }}>
                    <Smartphone size={36} color="white" />
                  </div>
                  <div style={{ fontWeight: 800, color: "#f8fafc", fontSize: "1.35rem" }}>Mobile-first purchase flow</div>
                  <div style={{ marginTop: ".5rem", color: "rgba(226,232,240,0.6)", fontSize: ".95rem" }}>Stronger visual trust for first-time users.</div>
                </div>
              </div>
            </div>
            <div className="lp-two-col" style={{ gap: "1rem" }}>
              {[
                { icon: TrendingUp, title: "Margin friendly", text: "Helpful for agents and repeat resellers." },
                { icon: Globe, title: "Always reachable", text: "Built for transactions that cannot wait." },
              ].map(function(item) {
                var Icon = item.icon;
                return (
                  <div key={item.title} className="lp-glass-card" style={{ padding: "1.25rem", borderRadius: 24 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(56,189,248,0.12)", color: "#7dd3fc" }}><Icon size={20} /></div>
                    <div style={{ marginTop: ".9rem", fontWeight: 800, color: "#f8fafc" }}>{item.title}</div>
                    <div style={{ marginTop: ".35rem", color: "rgba(226,232,240,0.62)", lineHeight: 1.7, fontSize: ".92rem" }}>{item.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" ref={pricingRef} style={{ padding: "0 1.25rem 5rem" }}>
        <div className="lp-pricing-grid" style={{ maxWidth: 1240, margin: "0 auto", gap: "1.5rem", ...sectionReveal(pricingVisible) }}>
          <div className="lp-glass-card" style={{ padding: "2rem", borderRadius: 30 }}>
            <SectionHeading label="Live data pricing" title="Real plans, current prices, better buying confidence." description="This section pulls live plan data inside a cleaner premium presentation that makes prices easier to scan." />
            <div style={{ marginTop: "1.4rem", display: "grid", gap: ".85rem" }}>
              {[
                "Network-specific tabs with real data",
                "Admin-updated plan pricing surfaced directly on the home page",
                "Immediate path from browsing to purchase",
              ].map(function(item) {
                return (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: ".7rem", color: "rgba(226,232,240,0.78)" }}>
                    <CheckCircle size={18} color="#4ade80" />
                    {item}
                  </div>
                );
              })}
            </div>
            <Link href={primaryHref} className="lp-cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: ".55rem", textDecoration: "none", marginTop: "1.75rem", padding: ".9rem 1.2rem", borderRadius: 999, background: "linear-gradient(135deg,#38bdf8,#2563eb)", color: "white", fontWeight: 800 }}>
              Start transacting
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="lp-glass-card" style={{ padding: "1.5rem", borderRadius: 30 }}>
            {networks.length > 0 && (
              <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap", marginBottom: "1.3rem" }}>
                {networks.map(function(network) {
                  var isActive = activeNetId === network.id;
                  var accent = NET_COLORS[(network.name && network.name.toLowerCase()) || ""] || "#38bdf8";
                  return (
                    <button key={network.id} type="button" onClick={function() { setPlansLoading(true); setActiveNetId(network.id); }} style={{ border: isActive ? "1px solid " + accent : "1px solid rgba(148,163,184,0.14)", background: isActive ? accent + "20" : "rgba(15,23,42,0.54)", color: isActive ? accent : "rgba(226,232,240,0.78)", borderRadius: 999, padding: ".7rem 1rem", fontWeight: 800, cursor: "pointer" }}>
                      {network.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.1rem", borderRadius: 22, background: "rgba(15,23,42,0.52)", border: "1px solid " + activeAccent + "22" }}>
              <div>
                <div style={{ fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(226,232,240,0.56)" }}>Active network</div>
                <div className={spaceGrotesk.className} style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginTop: ".2rem" }}>{(activeNetwork && activeNetwork.name) || "Choose a network"}</div>
              </div>
              <div style={{ width: 54, height: 54, borderRadius: 18, background: activeAccent + "1f", border: "1px solid " + activeAccent + "33", boxShadow: "0 0 24px " + activeAccent + "25" }} />
            </div>
            <div style={{ marginTop: "1.2rem" }}>
              {plansLoading ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "rgba(226,232,240,0.58)" }}>Loading plans...</div>
              ) : featuredPlans.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "rgba(226,232,240,0.58)" }}>No plans available for this network.</div>
              ) : (
                <div className="lp-service-grid" style={{ gap: "1rem" }}>
                  {featuredPlans.map(function(plan) {
                    return (
                      <div key={plan.id} style={{ padding: "1.15rem", borderRadius: 24, background: "rgba(8,15,30,0.72)", border: "1px solid rgba(148,163,184,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                        <div style={{ fontSize: ".74rem", letterSpacing: ".08em", textTransform: "uppercase", color: activeAccent, fontWeight: 800 }}>{plan.type || "Data Plan"}</div>
                        <div style={{ marginTop: ".55rem", color: "#f8fafc", fontWeight: 800, lineHeight: 1.35 }}>{plan.name}</div>
                        <div style={{ marginTop: ".35rem", color: "rgba(226,232,240,0.6)", fontSize: ".88rem" }}>{plan.validity ? `${plan.validity} day${plan.validity === "1" ? "" : "s"}` : ""}</div>
                        <div className={spaceGrotesk.className} style={{ marginTop: "1rem", fontSize: "1.6rem", fontWeight: 700, color: "#4ade80" }}>{"\u20A6"}{formatPrice(plan.userPrice)}</div>
                        <Link href={primaryHref} style={{ display: "inline-flex", alignItems: "center", gap: ".45rem", marginTop: ".95rem", textDecoration: "none", color: "#7dd3fc", fontWeight: 700 }}>
                          Buy now
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" ref={testimonialsRef} style={{ padding: "0 1.25rem 5rem" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", ...sectionReveal(testimonialsVisible) }}>
          <SectionHeading label="Social proof" title="People keep coming back because the product feels stable." description="Premium design only matters if it supports trust. These reactions reinforce that visually." />
          <div className="lp-service-grid" style={{ gap: "1rem" }}>
            {TESTIMONIALS.map(function(item, index) {
              return (
                <div key={item.name} className="lp-glass-card" style={{ ...staggerReveal(testimonialsVisible, index), padding: "1.5rem", borderRadius: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#f8fafc" }}>{item.name}</div>
                      <div style={{ marginTop: ".2rem", color: "rgba(226,232,240,0.58)", fontSize: ".88rem" }}>{item.role}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".15rem" }}>
                      {[0,1,2,3,4].map(function(i) {
                        return <Star key={i} size={16} fill={item.accent} color={item.accent} />;
                      })}
                    </div>
                  </div>
                  <p style={{ marginTop: "1rem", color: "rgba(226,232,240,0.7)", lineHeight: 1.85 }}>
                    {item.quote}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section ref={faqRef} style={{ padding: "0 1.25rem 6rem" }}>
        <div className="lp-showcase-grid" style={{ maxWidth: 1240, margin: "0 auto", gap: "1.5rem", ...sectionReveal(faqVisible) }}>
          <div className="lp-glass-card" style={{ padding: "2rem", borderRadius: 30 }}>
            <SectionHeading label="Common questions" title="Answers that remove hesitation before signup." />
            <div style={{ display: "grid", gap: ".9rem", marginTop: "1.25rem" }}>
              {FAQS.map(function(item, index) {
                var isOpen = openFaq === index;
                return (
                  <button key={item.question} type="button" onClick={function() { setOpenFaq(isOpen ? null : index); }} style={{ border: "1px solid rgba(148,163,184,0.12)", background: "rgba(15,23,42,0.5)", borderRadius: 22, padding: "1rem 1.05rem", textAlign: "left", color: "inherit", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                      <span style={{ fontWeight: 800, color: "#f8fafc" }}>{item.question}</span>
                      <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }} />
                    </div>
                    {isOpen && (
                      <p style={{ marginTop: ".8rem", color: "rgba(226,232,240,0.66)", lineHeight: 1.8 }}>
                        {item.answer}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lp-glass-card lp-cta-gradient-bg" style={{ position: "relative", padding: "2rem", borderRadius: 30, overflow: "hidden" }}>
            <div className="lp-orb lp-orb-d" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: ".55rem", padding: ".5rem .8rem", borderRadius: 999, background: "rgba(56,189,248,0.14)", color: "#7dd3fc", fontWeight: 700, fontSize: ".82rem" }}>
                <Users size={16} />
                Ready to switch to a sharper platform
              </div>
              <h3 className={spaceGrotesk.className} style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.02, letterSpacing: "-0.05em", color: "#f8fbff", margin: "1rem 0" }}>
                Start buying bills and VTU services with less friction.
              </h3>
              <p style={{ color: "rgba(226,232,240,0.7)", lineHeight: 1.85, maxWidth: 520 }}>
                {siteDescription}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".8rem", marginTop: "1.6rem" }}>
                <Link href={primaryHref} className="lp-cta-btn" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".55rem", padding: ".95rem 1.3rem", borderRadius: 999, background: "linear-gradient(135deg,#38bdf8,#2563eb)", color: "white", fontWeight: 800 }}>
                  {primaryLabel}
                  <ArrowRight size={18} />
                </Link>
                <Link href="#contact" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: ".95rem 1.3rem", borderRadius: 999, background: "rgba(15,23,42,0.5)", color: "#f8fafc", fontWeight: 700, border: "1px solid rgba(148,163,184,0.16)" }}>
                  Talk to support
                </Link>
              </div>
              <div className="lp-two-col" style={{ gap: "1rem", marginTop: "1.75rem" }}>
                {[
                  { icon: Shield, text: "Secure purchase flow" },
                  { icon: Headphones, text: "Fast human support" },
                ].map(function(item) {
                  var Icon = item.icon;
                  return (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: ".7rem", padding: ".95rem 1rem", borderRadius: 20, background: "rgba(15,23,42,0.56)", border: "1px solid rgba(148,163,184,0.1)" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(56,189,248,0.12)", color: "#7dd3fc" }}><Icon size={18} /></div>
                      <span style={{ color: "#f8fafc", fontWeight: 700 }}>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" style={{ padding: "0 1.25rem 2rem" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", borderRadius: 32, background: "linear-gradient(180deg, rgba(4,16,29,0.92), rgba(8,15,30,0.98))", border: "1px solid rgba(148,163,184,0.14)", boxShadow: "0 24px 70px rgba(2,8,23,0.4)", overflow: "hidden" }}>
          {/* Top section - Logo + Newsletter style */}
          <div style={{ padding: "2.5rem 2.5rem 2rem", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} style={{ height: 48, width: "auto", objectFit: "contain" }} />
              ) : (
                <div className={spaceGrotesk.className} style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#38bdf8,#2563eb)", color: "white", fontWeight: 700, fontSize: "1.1rem" }}>
                  {siteName.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, color: "#f8fafc", fontSize: "1.1rem" }}>{siteName}</div>
                <div style={{ color: "rgba(226,232,240,0.5)", fontSize: ".85rem" }}>Premium VTU & bills platform</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              {settings && settings.whatsapp && (
                <a href={"https://wa.me/" + settings.whatsapp.replace(/\D/g, "")} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".7rem 1.2rem", borderRadius: 999, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontWeight: 700, fontSize: ".88rem", textDecoration: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                  Chat on WhatsApp
                </a>
              )}
              <Link href={primaryHref} style={{ display: "inline-flex", alignItems: "center", padding: ".7rem 1.2rem", borderRadius: 999, background: "rgba(56,189,248,0.12)", color: "#7dd3fc", fontWeight: 700, fontSize: ".88rem", textDecoration: "none", border: "1px solid rgba(56,189,248,0.2)" }}>
                Get started free
              </Link>
            </div>
          </div>

          {/* Main footer columns - horizontal layout */}
          <div style={{ padding: "2.5rem", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: "2.5rem" }}>
            {/* Brand description */}
            <div>
              <p style={{ color: "rgba(226,232,240,0.6)", lineHeight: 1.8, fontSize: ".92rem", maxWidth: 320 }}>
                {siteDescription}
              </p>
              <div style={{ display: "flex", gap: ".6rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                {socialLinks.map(function(item) {
                  return (
                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(15,23,42,0.6)", color: "rgba(226,232,240,0.7)", border: "1px solid rgba(148,163,184,0.1)", textDecoration: "none", fontWeight: 700, fontSize: ".78rem", transition: "all 0.2s" }}>
                      {item.label.charAt(0)}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".12em", color: "#7dd3fc", fontWeight: 700, marginBottom: "1.2rem" }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {["Buy airtime", "Buy data", "Cable TV", "Electricity", "Exam pins", "Data cards"].map(function(item) {
                  return <Link key={item} href={primaryHref} style={{ textDecoration: "none", color: "rgba(226,232,240,0.65)", fontSize: ".92rem", transition: "color 0.2s" }}>{item}</Link>;
                })}
              </div>
            </div>

            {/* Company */}
            <div>
              <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".12em", color: "#7dd3fc", fontWeight: 700, marginBottom: "1.2rem" }}>Company</div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {[
                  { label: "About us", href: "/about" },
                  { label: "Contact", href: "/contact" },
                  { label: "Privacy policy", href: "/privacy" },
                  { label: "Terms of service", href: "/terms" },
                ].map(function(link) {
                  return <Link key={link.label} href={link.href} style={{ textDecoration: "none", color: "rgba(226,232,240,0.65)", fontSize: ".92rem", transition: "color 0.2s" }}>{link.label}</Link>;
                })}
              </div>
            </div>

            {/* Support */}
            <div>
              <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".12em", color: "#7dd3fc", fontWeight: 700, marginBottom: "1.2rem" }}>Support</div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {settings && settings.phone && <a href={"tel:" + settings.phone} style={{ textDecoration: "none", color: "rgba(226,232,240,0.65)", fontSize: ".92rem" }}>{settings.phone}</a>}
                {settings && settings.email && <a href={"mailto:" + settings.email} style={{ textDecoration: "none", color: "rgba(226,232,240,0.65)", fontSize: ".92rem" }}>{settings.email}</a>}
                {settings && settings.whatsapp && <a href={"https://wa.me/" + settings.whatsapp.replace(/\D/g, "")} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#4ade80", fontWeight: 600, fontSize: ".92rem" }}>WhatsApp chat</a>}
                <Link href="/contact" style={{ textDecoration: "none", color: "rgba(226,232,240,0.65)", fontSize: ".92rem" }}>Help center</Link>
              </div>
            </div>

            {/* Trust badges */}
            <div>
              <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".12em", color: "#7dd3fc", fontWeight: 700, marginBottom: "1.2rem" }}>Why trust us</div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {[
                  { icon: Shield, text: "Secure payments" },
                  { icon: Zap, text: "Instant delivery" },
                  { icon: Clock, text: "24/7 availability" },
                  { icon: Headphones, text: "Fast support" },
                ].map(function(item) {
                  var Icon = item.icon;
                  return (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: ".6rem", color: "rgba(226,232,240,0.65)", fontSize: ".92rem" }}>
                      <Icon size={15} color="#4ade80" />
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ padding: "1.2rem 2.5rem", borderTop: "1px solid rgba(148,163,184,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ color: "rgba(226,232,240,0.4)", fontSize: ".85rem" }}>{"\u00A9"} {new Date().getFullYear()} {siteName}. All rights reserved.</span>
            <span style={{ color: "rgba(226,232,240,0.35)", fontSize: ".85rem" }}>Developed by <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "#7dd3fc", textDecoration: "none", fontWeight: 600 }}>ZEDROTECH</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
