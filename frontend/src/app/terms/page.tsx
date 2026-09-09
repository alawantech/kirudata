import type { Metadata } from "next";
import TermsContent from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions - Kiru Data",
  description:
    "Read Kiru Data's terms and conditions for using our VTU platform, wallet services, and bill payment features.",
  keywords: [
    "terms and conditions",
    "terms of service",
    "Kiru Data terms",
    "VTU terms Nigeria",
  ],
  openGraph: {
    title: "Terms & Conditions - Kiru Data",
    description:
      "Read Kiru Data's terms and conditions for using our VTU platform, wallet services, and bill payment features.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms & Conditions - Kiru Data",
    description:
      "Read Kiru Data's terms and conditions for using our VTU platform, wallet services, and bill payment features.",
  },
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <TermsContent />;
}
