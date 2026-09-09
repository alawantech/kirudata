"use client";
import Link from "next/link";
import { ArrowLeft, Shield, Zap, Users, Heart } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import AppLogo from "@/components/AppLogo";

export default function AboutPage() {
  const settings = useSiteSettings();
  const siteName = settings.sitename || "KIRU DATA";
  const siteInitial = siteName.charAt(0).toUpperCase();
  const logoUrl = settings.logoUrl || "";
  const team = [
    { name: "Yusuf Habibu", role: "Founder & CEO", initials: "YH" },
    { name: "Tech Team", role: "Engineering", initials: "TT" },
    { name: "Support", role: "24/7 Customer Care", initials: "SC" },
  ];
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <nav
        style={{
          background: "#0f172a",
          padding: "0 1.5rem",
          height: 88,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/home"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <AppLogo showBrandName={false} logoHeight={72} />
        </Link>
        <Link
          href="/home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".375rem",
            color: "rgba(255,255,255,.6)",
            textDecoration: "none",
            fontSize: ".85rem",
          }}
        >
          <ArrowLeft size={15} /> Back
        </Link>
      </nav>

      <div
        style={{
          background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)",
          padding: "5rem 1.5rem",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem,5vw,3.5rem)",
            fontWeight: 900,
            letterSpacing: "-.04em",
            marginBottom: ".875rem",
          }}
        >
          About {siteName}
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,.75)",
            fontSize: "1.1rem",
            maxWidth: 540,
            margin: "0 auto",
          }}
        >
          We're on a mission to make digital utilities affordable and accessible
          to every Nigerian.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: "1.5rem",
            marginBottom: "4rem",
          }}
        >
          {[
            {
              icon: Zap,
              color: "#f59e0b",
              title: "Our Mission",
              desc: "To provide the fastest, cheapest, and most reliable VTU platform in Nigeria — putting more value back in your pocket on every recharge.",
            },
            {
              icon: Shield,
              color: "#10b981",
              title: "Security First",
              desc: "Your data and funds are protected with industry-standard encryption. Every transaction is monitored for fraud 24/7.",
            },
            {
              icon: Users,
              color: "#8b5cf6",
              title: "Community",
              desc: `Over 50,000 users and 5,000+ agents across Nigeria trust ${siteName} for their daily digital utility needs.`,
            },
            {
              icon: Heart,
              color: "#ef4444",
              title: "Customer Care",
              desc: "Our support team is available 24/7 via WhatsApp and live chat to resolve any issue in under 2 hours.",
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              style={{
                background: "white",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 15,
                  background: color + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <Icon size={24} color={color} />
              </div>
              <h3
                style={{
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: ".5rem",
                  fontSize: "1.05rem",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: ".875rem",
                  lineHeight: 1.65,
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "3rem",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            border: "1px solid #f1f5f9",
            marginBottom: "3rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: ".75rem",
              letterSpacing: "-.03em",
            }}
          >
            Our Story
          </h2>
          <p
            style={{
              color: "#64748b",
              lineHeight: 1.8,
              maxWidth: 660,
              margin: "0 auto",
              fontSize: ".95rem",
            }}
          >
            {siteName} was founded with a simple idea: Nigerians should not have
            to overpay for data, airtime, and utility bills. We built a platform
            that connects directly to network providers, cutting out the
            middleman and passing the savings to you. Today, we process millions
            in transactions monthly, helping individuals, resellers, and
            businesses save more every single day.
          </p>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: "2rem",
              letterSpacing: "-.03em",
            }}
          >
            Meet the Team
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {team.map((m) => (
              <div key={m.name} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#1e3a8a,#06b6d4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto .75rem",
                    fontWeight: 900,
                    color: "white",
                    fontSize: "1.25rem",
                  }}
                >
                  {m.initials}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: ".9rem",
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: ".75rem",
                    marginTop: ".2rem",
                  }}
                >
                  {m.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".5rem",
              background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
              color: "white",
              padding: ".875rem 2.5rem",
              borderRadius: "1rem",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 4px 14px rgba(37,99,235,.35)",
            }}
          >
            Get Started Free →
          </Link>
        </div>
      </div>

      <footer
        style={{
          background: "#0f172a",
          padding: "2rem 1.5rem",
          textAlign: "center",
          color: "rgba(255,255,255,.4)",
          fontSize: ".8rem",
        }}
      >
        © {new Date().getFullYear()} {siteName}. All rights reserved. | Developed by <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.6)", textDecoration: "underline" }}>ZEDROTECH</a>
      </footer>
    </div>
  );
}
