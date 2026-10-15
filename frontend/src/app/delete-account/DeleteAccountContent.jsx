"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const h2 = {
  fontWeight: 800,
  color: "#0f172a",
  fontSize: "1.05rem",
  marginBottom: ".875rem",
  letterSpacing: "-.01em",
};
const body = { color: "#64748b", lineHeight: 1.8, fontSize: ".9rem" };
const card = {
  background: "white",
  borderRadius: "1.25rem",
  padding: "1.75rem",
  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
  border: "1px solid #f1f5f9",
  marginBottom: "1rem",
};
const li = { color: "#64748b", lineHeight: 1.9, fontSize: ".9rem" };

export default function DeleteAccountContent() {
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
            Kiru Data
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
          Delete Your Account
        </h1>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".9rem" }}>
          Kiru Data | Account &amp; Data Deletion Requests
        </p>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={card}>
          <p style={body}>
            You can request deletion of your <strong>Kiru Data</strong>{" "}
            account and all associated personal data at any time, free of
            charge. This page explains the exact steps to request deletion,
            what data is deleted, what data is retained and for how long, and
            how to reach us with questions. Deletion requests are processed
            within <strong>7 business days</strong> and you will receive a
            confirmation once it is complete.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Method 1: From the Website Dashboard (Recommended)</h2>
          <ol style={{ ...li, paddingLeft: "1.25rem" }}>
            <li>Sign in to your account at kirudata.com</li>
            <li>
              Go to <strong>Dashboard → Support</strong> (
              <Link href="/dashboard/support" style={{ color: "#2563eb" }}>
                kirudata.com/dashboard/support
              </Link>
              )
            </li>
            <li>
              Create a new request with the subject{" "}
              <strong>&quot;Delete My Account&quot;</strong>
            </li>
            <li>
              Include the email address and phone number registered to your
              account, then submit
            </li>
          </ol>
          <p style={body}>
            We will verify the request and email you a confirmation when your
            account and personal data have been deleted.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Method 2: Email Request</h2>
          <p style={body}>
            Send an email to{" "}
            <a
              href="mailto:info@kirudata.com"
              style={{ color: "#2563eb" }}
            >
              info@kirudata.com
            </a>{" "}
            (or{" "}
            <a
              href="mailto:support@kirudata.com"
              style={{ color: "#2563eb" }}
            >
              support@kirudata.com
            </a>
            ) with the subject line <strong>&quot;Delete My Account&quot;</strong>{" "}
            and include:
          </p>
          <ul style={{ ...li, paddingLeft: "1.25rem", listStyle: "disc" }}>
            <li>Your full name</li>
            <li>
              The email address and phone number associated with your account
            </li>
          </ul>
          <p style={body}>
            We will process your request and delete your account within{" "}
            <strong>7 business days</strong>.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Method 3: WhatsApp</h2>
          <p style={body}>
            Message us on{" "}
            <a
              href="https://wa.me/2349069375050"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb" }}
            >
              WhatsApp (+234 906 937 5050)
            </a>{" "}
            with the message <strong>&quot;Delete My Account&quot;</strong> and
            the email address registered to your account. Our team will confirm
            your identity and process the deletion.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>What Is Deleted</h2>
          <ul style={{ ...li, paddingLeft: "1.25rem", listStyle: "disc" }}>
            <li>
              Your profile: full name, email address, phone number, and
              password
            </li>
            <li>
              Your wallet profile, linked reserved account details, and account
              settings
            </li>
            <li>
              Your BVN/NIN and date of birth, if you completed KYC verification
            </li>
            <li>
              Device recognition records, login history, and OTP verification
              records
            </li>
            <li>Your notifications and support/issue messages</li>
            <li>
              Any other personal data not listed under &quot;Data We
              Retain&quot; below
            </li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2}>Data We Retain (and Retention Periods)</h2>
          <ul style={{ ...li, paddingLeft: "1.25rem", listStyle: "disc" }}>
            <li>
              <strong>Transaction records</strong> (service type, amounts,
              dates, transaction references, status, and wallet balance
              changes) are retained for up to <strong>5 years</strong> after
              account deletion as required by Central Bank of Nigeria
              regulations, the Nigeria Data Protection Act (NDPA 2023), and tax
              record-keeping obligations. After the retention period they are
              permanently deleted.
            </li>
            <li>
              <strong>Fraud prevention and security records</strong> may be
              retained for as long as necessary to comply with legal
              obligations and to prevent abuse of our platform.
            </li>
          </ul>
          <p style={{ ...body, marginTop: ".75rem" }}>
            Retained records are used only for legal, accounting, and
            fraud-prevention purposes — they are never used for marketing.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Before You Delete — Important</h2>
          <ul style={{ ...li, paddingLeft: "1.25rem", listStyle: "disc" }}>
            <li>
              If your wallet still has a balance, contact us first so we can
              process any outstanding payout — balances cannot be refunded
              after deletion.
            </li>
            <li>
              Complete or cancel any pending transactions (including
              airtime-to-cash requests) before requesting deletion.
            </li>
            <li>
              Deletion is permanent and cannot be undone — you will need to
              create a new account to use Kiru Data again.
            </li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2}>Questions?</h2>
          <p style={body}>
            Contact us at{" "}
            <a
              href="mailto:info@kirudata.com"
              style={{ color: "#2563eb" }}
            >
              info@kirudata.com
            </a>{" "}
            or via{" "}
            <a
              href="https://wa.me/2349069375050"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563eb" }}
            >
              WhatsApp
            </a>
            . We typically respond to deletion requests within 7 business days.
          </p>
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
        © {new Date().getFullYear()} Kiru Data. All rights reserved. |
        Developed by{" "}
        <a
          href="https://zedrotech.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "rgba(255,255,255,.6)",
            textDecoration: "underline",
          }}
        >
          ZEDROTECH
        </a>{" "}
        |{" "}
        <Link
          href="/privacy"
          style={{ color: "rgba(255,255,255,.4)", textDecoration: "underline" }}
        >
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
