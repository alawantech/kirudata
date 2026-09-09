import type { Metadata } from "next";
import ForgotPasswordContent from "./ForgotPasswordContent";

export const metadata: Metadata = {
  title: "Forgot Password - Kiru Data",
  description:
    "Reset your Kiru Data account password. Fast and secure password recovery.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
