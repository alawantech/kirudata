import type { Metadata } from "next";
import RegisterContent from "./RegisterContent";

export const metadata: Metadata = {
  title: "Register - Kiru Data | Create Free Account",
  description:
    "Create a free Kiru Data account. Buy airtime, data, pay bills, and earn commissions. Fast registration.",
  keywords: [
    "register Kiru Data",
    "create account",
    "free VTU account Nigeria",
    "sign up airtime data",
  ],
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
