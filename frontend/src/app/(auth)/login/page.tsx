import type { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = {
  title: "Login - Kiru Data",
  description:
    "Login to your Kiru Data account to buy airtime, data, and pay bills.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return <LoginContent />;
}
