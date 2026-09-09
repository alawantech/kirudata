import type { Metadata } from "next";
import PrivacyContent from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy - Kiru Data",
  description:
    "Read Kiru Data's privacy policy. Learn how we protect your personal data under Nigeria Data Protection Act (NDPA 2023).",
  keywords: [
    "privacy policy",
    "data protection",
    "NDPA 2023",
    "Nigeria privacy law",
    "Kiru Data privacy",
  ],
  openGraph: {
    title: "Privacy Policy - Kiru Data",
    description:
      "Read Kiru Data's privacy policy. Learn how we protect your personal data under Nigeria Data Protection Act (NDPA 2023).",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy - Kiru Data",
    description:
      "Read Kiru Data's privacy policy. Learn how we protect your personal data under Nigeria Data Protection Act (NDPA 2023).",
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
