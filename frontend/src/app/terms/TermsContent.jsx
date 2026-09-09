"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using KIRU DATA's platform (website, mobile app), you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of updated terms. Your use of KIRU DATA is at your sole discretion and risk.",
  },
  {
    title: "2. Service Description",
    content:
      "KIRU DATA provides Virtual Top-Up (VTU) services including: mobile airtime purchases, mobile data bundles, electricity bill payments, cable TV subscriptions, bulk SMS, result checker PINs (WAEC, NECO, NABTEB), data cards, recharge cards, and airtime-to-cash conversion. We act as an intermediary between you and network providers through third-party VTU providers. Services are available 24/7, subject to provider availability and system maintenance.",
  },
  {
    title: "3. User Eligibility & Registration",
    content:
      "You must be at least 18 years old and legally capable of entering binding contracts. Registration requires your full name, email address, phone number, and a password. BVN or NIN verification (KYC) is optional and available separately after account creation. You are responsible for maintaining confidentiality of your account credentials. KIRU DATA reserves the right to suspend accounts providing false information or violating regulatory requirements.",
  },
  {
    title: "4. Account Security & Authentication",
    content:
      "You must protect your password and login credentials. Your account is protected by device recognition — when you log in from a new device, a one-time password (OTP) is sent to your registered email. Never share your PIN, OTP, or password with anyone, including KIRU DATA staff. We are not liable for unauthorized access resulting from your negligence. Report suspicious activity immediately to support@kirudata.com.",
  },
  {
    title: "5. Wallet & Fund Management",
    content:
      "Your wallet holds funds in Nigerian Naira (NGN). Deposits are made via bank transfer and credited to your wallet. Wallet balances do not expire. Funds in your wallet are held securely but are not insured by any deposit insurance scheme. You are responsible for maintaining adequate balance for transactions.",
  },
  {
    title: "6. Transaction Processing & Services",
    content:
      "All transactions are final once submitted. Airtime and data bundles are credited directly to the phone number within 2-5 minutes, subject to network provider processing times. Bill payments and cable subscriptions are processed within 30 minutes to 2 hours. Failed transactions due to network errors are automatically refunded to your wallet. You are responsible for providing correct recipient details. KIRU DATA is not liable for transactions sent to incorrect numbers.",
  },
  {
    title: "7. Fees & Charges",
    content:
      "All applicable fees and service charges are displayed before transaction completion. Fees vary by service type and are determined by our platform and third-party providers. We reserve the right to modify fees with notice displayed in the app. Promotional discounts may be applied automatically to eligible transactions. Processing fees for wallet funding may apply. All fees are non-refundable unless the service is not delivered.",
  },
  {
    title: "8. Airtime to Cash",
    content:
      "The Airtime to Cash service allows you to convert airtime to wallet balance at a rate displayed at the time of transaction. This service is available for MTN and Airtel networks only. You must transfer airtime from a phone number belonging to the selected network. After submitting an airtime-to-cash request, you must contact our admin via WhatsApp to confirm the transfer with a screenshot as proof. Processing is manual and may take up to 24 hours. We reserve the right to reject requests that do not meet our requirements.",
  },
  {
    title: "9. Data & Payment Processing",
    content:
      "We collect your name, email, phone number, transaction data, and device information (device fingerprint, operating system version) for account management, fraud prevention, and regulatory compliance. Payments are processed through third-party payment processors. Your data is transmitted via SSL/TLS encryption. We do not sell your data to third parties. By using our services, you consent to data processing as described in our Privacy Policy.",
  },
  {
    title: "10. KYC Verification & Compliance",
    content:
      "KIRU DATA complies with Nigeria Data Protection Act (NDPA 2023) and Central Bank of Nigeria (CBN) regulations. KYC verification using BVN or NIN is available as an optional step and may be required for certain services or higher transaction limits. KYC verification is processed through Monnify, which validates your BVN or NIN against your date of birth and name. Failure to complete verification when required may result in account limitations.",
  },
  {
    title: "11. Prohibited Activities",
    content:
      "You agree not to: engage in fraud or deception; use stolen payment methods; attempt to hack our systems; resell services for profit without authorization; engage in money laundering or terrorist financing; use services for illegal purposes; transmit malware; impersonate KIRU DATA staff; manipulate system exploits; or abuse promotional offers. Violation results in account termination, fund forfeiture, and potential legal action.",
  },
  {
    title: "12. Service Availability & Disclaimers",
    content:
      "We strive to provide reliable service but make no guarantee of uninterrupted access. Network provider outages, third-party VTU provider downtime, system maintenance, or technical issues may cause service disruptions. We are not liable for delays caused by third-party providers or network operators. Services are provided 'as-is' without warranties. We disclaim all implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
  },
  {
    title: "13. Limitation of Liability",
    content:
      "To the fullest extent permitted by law, KIRU DATA is not liable for indirect, incidental, punitive, or consequential damages. This includes lost profits, data loss, business interruption, or emotional distress. Our liability is limited to the transaction amount in dispute. You use our services at your own risk.",
  },
  {
    title: "14. Dispute Resolution & Support",
    content:
      "Contact our support team within 30 days of a disputed transaction. Provide transaction reference, date, amount, and dispute reason. We investigate and respond within 7 business days. Escalated disputes go to arbitration per Nigerian law. You can reach us via: Email: support@kirudata.com | WhatsApp: Available in-app | In-app support.",
  },
  {
    title: "15. Account Termination",
    content:
      "We may terminate accounts for: breach of terms, illegal activity, fraud, regulatory non-compliance, or security risks. Upon termination, all transactions are frozen and remaining balance may be forfeited. We may retain your data for regulatory compliance as required by law.",
  },
  {
    title: "16. Indemnification",
    content:
      "You agree to indemnify and hold harmless KIRU DATA from any claims, damages, losses, or expenses (including legal fees) arising from: your breach of these terms; your misuse of services; your violation of law; fraudulent activity on your account; or your disputes with third parties through our services.",
  },
  {
    title: "17. Intellectual Property Rights",
    content:
      "All content, logos, trademarks, designs, and materials on KIRU DATA are protected by copyright and intellectual property laws. You may not copy, reproduce, distribute, or transmit any content without express written permission. Unauthorized use of our intellectual property may result in legal action.",
  },
  {
    title: "18. Third-Party Services",
    content:
      "Our platform uses the following third-party service providers to deliver our services: mySubwallet, Dorosub, First-sub, and MBC Data (VTU processing); Monnify (payment processing and KYC verification); and MailerSend (transactional emails). We are not responsible for their services, policies, or data practices. Review their privacy policies before engaging. KIRU DATA is not liable for third-party performance issues or service failures.",
  },
  {
    title: "19. Governing Law & Jurisdiction",
    content:
      "These Terms & Conditions are governed by Nigerian law and the Nigeria Data Protection Act (NDPA, 2023). Any disputes are subject to exclusive jurisdiction of Nigerian courts. By using KIRU DATA, you consent to Nigerian legal proceedings.",
  },
  {
    title: "20. Amendment & Modifications",
    content:
      "KIRU DATA reserves the right to modify these terms at any time. Material changes are communicated via email, in-app notification, or website notice. Continued use after modifications indicates acceptance of updated terms. If you disagree with changes, you may stop using our services.",
  },
  {
    title: "21. Severability & Entire Agreement",
    content:
      "If any provision of these terms is found invalid or unenforceable, it will be modified to the minimum extent necessary or severed, while remaining provisions stay in effect. These Terms & Conditions, together with our Privacy Policy, constitute the entire agreement between you and KIRU DATA and supersede all prior understandings.",
  },
  {
    title: "22. Contact & Support",
    content:
      "For questions, concerns, or disputes regarding these Terms & Conditions, contact us at: Email: support@kirudata.com | In-app WhatsApp Support: Available 24/7.",
  },
];

export default function TermsPage() {
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
            G
          </div>
          <span style={{ fontWeight: 800, color: "white", fontSize: "1.1rem" }}>
            KIRU<span style={{ color: "#38bdf8" }}>DATA</span>
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
          Terms & Conditions
        </h1>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".9rem" }}>
          Last Updated: June 2026 | Effective Immediately
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem" }}>
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
            KIRU DATA is committed to transparent and fair service delivery. These Terms and Conditions outline the rights, responsibilities, and legal obligations of all users. By accessing our mobile app or website, you agree to comply with these terms in full. Please read them carefully.
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
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "rgba(255,255,255,.4)",
          fontSize: ".8rem",
          borderTop: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <div style={{ marginBottom: "1.5rem", lineHeight: 1.8 }}>
          <p style={{ marginBottom: ".75rem" }}>
            © {new Date().getFullYear()} KIRU DATA. All rights reserved.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", fontSize: ".8rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <Link href="/privacy" style={{ color: "rgba(255,255,255,.5)", textDecoration: "none", borderRight: "1px solid rgba(255,255,255,.2)", paddingRight: ".75rem" }}>Privacy Policy</Link>
            <Link href="/home" style={{ color: "rgba(255,255,255,.5)", textDecoration: "none" }}>Home</Link>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,.3)", fontSize: ".7rem", marginTop: "1rem" }}>
          Developed by <a href="https://zedrotech.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.5)", textDecoration: "underline" }}>ZEDROTECH</a> | For support or legal inquiries: support@kirudata.com
        </p>
      </footer>
    </div>
  );
}
