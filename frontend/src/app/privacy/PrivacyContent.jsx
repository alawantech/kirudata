"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "KIRU DATA collects information you provide directly and information generated through your use of our services. We collect: your full name, email address, phone number, and password (hashed) when you register; your BVN or NIN and date of birth when you complete optional KYC verification; transaction data including purchases, wallet funding, and airtime-to-cash requests; device information including device fingerprint (derived from your device's operating system and app version), operating system version, and app version; and account activity such as login timestamps and session duration.",
  },
  {
    title: "2. Personal Information at Registration",
    content:
      "When you create a KIRU DATA account, we collect: full name, email address, phone number, and a password (stored as a bcrypt hash — we never store plain text passwords). You may optionally provide a referral code. BVN, NIN, and date of birth are only collected if you choose to complete KYC verification, which is a separate optional step.",
  },
  {
    title: "3. Transaction Information",
    content:
      "We store data about your transactions including: airtime, data, cable TV, electricity, exam PIN, SMS, data card, and recharge card purchases; wallet funding history; airtime-to-cash conversion requests (including network, sender phone number, amount, payout method, and bank details if applicable); transaction amounts, dates, wallet balance changes, and status. This data is retained for regulatory compliance and dispute resolution.",
  },
  {
    title: "4. KYC Verification Data",
    content:
      "If you choose to complete KYC verification, we collect your BVN (Bank Verification Number) or NIN (National Identification Number) and date of birth. This information is validated through Monnify, our payment processing partner, which checks your BVN/NIN against your name and date of birth. We store your KYC status and the verification method used. KYC data is retained for regulatory compliance.",
  },
  {
    title: "5. Device and Usage Information",
    content:
      "We collect device information to protect your account: a device fingerprint derived from your device's operating system and app version, your IP address, and session timestamps. This data is used for device recognition — when you log in from a new device, an OTP is sent to your email for verification. We also collect app version and OS version for platform improvement and debugging.",
  },
  {
    title: "6. How We Use Your Information",
    content:
      "We use your information for: account creation and authentication; processing your VTU purchases and wallet transactions; airtime-to-cash conversion processing; device recognition and fraud prevention (sending OTP to your email when logging in from a new device); KYC identity verification (if you choose to verify); sending transaction confirmation emails and OTP codes; customer support; regulatory compliance with Nigeria Data Protection Act (NDPA 2023) and Central Bank of Nigeria (CBN) regulations; and platform improvement and debugging.",
  },
  {
    title: "7. Third-Party Data Sharing",
    content:
      "We do not sell your personal information to third parties. We share data with the following third-party service providers strictly for service delivery: VTU Providers (mySubwallet, Dorosub, First-sub, MBC Data) — we share phone number, network, amount, and service details to process your airtime, data, cable, electricity, and other VTU purchases; Monnify — we share your name, email, BVN/NIN, and date of birth for KYC verification and payment processing; MailerSend — we share your email address to send OTP codes and transaction notifications; and network operators — we share phone numbers and service details when processing purchases. All third-party providers are contractually obligated to protect your data and use it only for the purposes we specify.",
  },
  {
    title: "8. WhatsApp Communication",
    content:
      "For Airtime to Cash requests, after you submit a request, you are directed to contact our admin via WhatsApp to confirm your airtime transfer. When you click the WhatsApp contact button, your name, email, phone number, and transaction details are pre-filled in the WhatsApp message. This communication happens directly between you and our admin through WhatsApp and is subject to WhatsApp's privacy policy.",
  },
  {
    title: "9. Data Security",
    content:
      "We implement industry-standard security measures: SSL/TLS encryption for all data transmitted between your device and our servers; bcrypt hashing for passwords and transaction PINs (we never store plain text credentials); httpOnly, secure cookies for session management; device fingerprinting for account protection; rate limiting on authentication endpoints; and token-based session management with automatic expiry. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    title: "10. Cookies and Session Management",
    content:
      "We use httpOnly cookies to maintain your authentication session. These cookies cannot be accessed by JavaScript, protecting against cross-site scripting (XSS) attacks. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. You can disable cookies in your browser settings, but this may affect platform functionality.",
  },
  {
    title: "11. Data Retention",
    content:
      "We retain your account data for as long as your account is active. Transaction records are kept for regulatory compliance and dispute resolution. KYC verification data is retained as required by Nigerian financial regulations. If you close your account, we retain data as required by law and delete the rest within a reasonable period.",
  },
  {
    title: "12. Your Privacy Rights",
    content:
      "Under the Nigeria Data Protection Act (NDPA 2023), you have the right to: access your personal data; correct or update inaccurate information; request deletion of your data (subject to legal retention obligations); data portability (receive your data in a machine-readable format); withdraw consent for data processing; and lodge complaints with the Nigeria Data Protection Commission (NDPC). To exercise these rights, contact us at support@kirudata.com or through in-app support.",
  },
  {
    title: "13. Children's Privacy",
    content:
      "KIRU DATA services are not directed to children under 18. We do not knowingly collect personal information from minors. If you believe we have collected information from a child under 18, please contact us immediately at support@kirudata.com. We will take appropriate action to remove such information.",
  },
  {
    title: "14. Data Transfer and Storage",
    content:
      "Your data is stored on secure servers. In case of a merger, acquisition, or business transfer, your information may be transferred to the new entity. We will notify you of such transfers via email or in-app notification.",
  },
  {
    title: "15. Changes to This Privacy Policy",
    content:
      "We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. Material changes will be communicated via email, in-app notification, or prominent notice on our website. Continued use of KIRU DATA after updates constitutes acceptance of the modified policy.",
  },
  {
    title: "16. Governing Law",
    content:
      "This Privacy Policy is governed by the Nigeria Data Protection Act (NDPA, 2023) and all applicable Nigerian laws and regulations. You consent to the exclusive jurisdiction of Nigerian courts for privacy disputes.",
  },
  {
    title: "17. Contact Us",
    content:
      "If you have any questions, concerns, or requests related to this Privacy Policy or your personal data, please contact us at: Email: support@kirudata.com | In-App Support: Available 24/7. We typically respond to privacy inquiries within 7 business days.",
  },
];

export default function PrivacyPage() {
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
          height: 68,
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
            gap: ".75rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,#2563eb,#06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "white",
              fontSize: 17,
            }}
          >
            Z
          </div>
          <span style={{ fontWeight: 800, color: "white", fontSize: "1.1rem" }}>
            KIRU DATA
          </span>
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
          padding: "4rem 1.5rem",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(1.75rem,4vw,2.75rem)",
            fontWeight: 900,
            marginBottom: ".75rem",
            letterSpacing: "-.03em",
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".9rem" }}>
          Last Updated: June 2026 | NDPA 2023 Compliant
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "2.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            border: "1px solid #f1f5f9",
            marginBottom: "2rem",
          }}
        >
          <p style={{ color: "#64748b", lineHeight: 1.8, fontSize: ".95rem" }}>
            KIRU DATA ("we", "our", "us") operates as a Virtual Top-Up service provider in Nigeria. We are committed to protecting your privacy and handling your data with transparency and care. This Privacy Policy explains what information we collect, how we use it, who we share it with, and your rights under the Nigeria Data Protection Act (NDPA, 2023).
          </p>
        </div>

        {sections.map((s) => (
          <div
            key={s.title}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              boxShadow: "0 2px 8px rgba(0,0,0,.05)",
              border: "1px solid #f1f5f9",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontWeight: 800,
                color: "#0f172a",
                fontSize: "1.05rem",
                marginBottom: ".875rem",
                letterSpacing: "-.01em",
              }}
            >
              {s.title}
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.8, fontSize: ".9rem" }}>
              {s.content}
            </p>
          </div>
        ))}
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
        © {new Date().getFullYear()} KIRU DATA. All rights reserved. | Developed by <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.6)", textDecoration: "underline" }}>ZEDROTECH</a> | <Link href="/terms" style={{ color: "rgba(255,255,255,.4)", textDecoration: "underline" }}>Terms & Conditions</Link>
      </footer>
    </div>
  );
}
