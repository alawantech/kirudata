import type { Metadata } from "next";
import HomeContent from "./HomeContent";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  FaqPageJsonLd,
} from "@/components/SeoJsonLd";

export const metadata: Metadata = {
  title:
    "Kiru Data - Buy Airtime, Data, Cable TV & Pay Bills Online Nigeria",
  description:
    "Nigeria's cheapest VTU platform. Buy airtime, data bundles, pay electricity bills, cable TV subscriptions. Fast, reliable, 24/7. Airtime to cash available.",
  keywords: [
    "buy data online Nigeria",
    "buy airtime online",
    "VTU Nigeria",
    "cheapest data plan",
    "MTN data",
    "Airtel data",
    "Glo data",
    "9mobile data",
    "cable TV subscription",
    "DSTV",
    "GOTV",
    "electricity bill payment",
    "airtime to cash Nigeria",
    "Kiru Data",
    "data top up Nigeria",
    "virtual top up Nigeria",
  ],
  openGraph: {
    title: "Kiru Data - Buy Airtime, Data, Cable TV & Pay Bills Online Nigeria",
    description:
      "Nigeria's cheapest VTU platform. Buy airtime, data bundles, pay electricity bills, cable TV subscriptions. Fast, reliable, 24/7.",
    type: "website",
    url: "https://kirudata.com/home",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiru Data - Buy Airtime, Data, Cable TV & Pay Bills Online Nigeria",
    description:
      "Nigeria's cheapest VTU platform. Buy airtime, data bundles, pay electricity bills, cable TV subscriptions. Fast, reliable, 24/7.",
  },
  alternates: {
    canonical: "/home",
  },
};

const FAQS = [
  {
    question: "How fast are purchases delivered?",
    answer:
      "Most purchases are confirmed within seconds. If a provider is slow, the transaction stays traceable and support can step in quickly.",
  },
  {
    question: "Can I use it for resale?",
    answer:
      "Yes. The platform is suitable for personal use and for resellers who need repeat purchases, margin visibility and stable wallet operations.",
  },
  {
    question: "Do I need to wait for business hours?",
    answer:
      "No. The platform is available around the clock for airtime, data, cable and utility purchases.",
  },
  {
    question: "What happens if a transaction fails?",
    answer:
      "Failed or interrupted transactions can be traced from your dashboard, and support can verify the provider response with you.",
  },
];

export default function HomePage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "https://kirudata.com";

  return (
    <>
      <OrganizationJsonLd
        siteName="Kiru Data"
        siteUrl={baseUrl}
        phone="+2348032230464"
        email="support@kirudata.com"
      />
      <WebSiteJsonLd siteName="Kiru Data" siteUrl={baseUrl} />
      <FaqPageJsonLd faqs={FAQS} />
      <HomeContent />
    </>
  );
}
