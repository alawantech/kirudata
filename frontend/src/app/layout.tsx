import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

// Fetch site name/description from backend at request time so metadata stays
// in sync with whatever the admin has set.
async function fetchSiteSettings() {
  try {
    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v2";
    const res = await fetch(`${base}/public/settings`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return data.data?.settings ?? {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await fetchSiteSettings();

  const siteName = s.sitename || "KIRU DATA";
  // sitetitle = browser-tab-specific title; falls back to sitename
  const browserTitle = s.sitetitle?.trim() ? s.sitetitle.trim() : siteName;
  const desc =
    s.sitedesc ||
    "Nigeria's most reliable VTU platform. Buy airtime, data, pay bills and more.";
  const siteUrl = s.siteurl || "";
  const faviconUrl = s.faviconUrl?.trim() || undefined;
  const logoUrl = s.logoUrl?.trim() || undefined;
  const v = s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now();

  const bust = (url?: string) => url ? `${url}${url.includes('?') ? '&' : '?'}v=${v}` : url;

  return {
    // ── Core ──────────────────────────────────────────────────────────────────
    title: browserTitle,
    description: desc,
    applicationName: siteName,

    // ── Favicon / Icons ───────────────────────────────────────────────────────
    icons: {
      icon: bust(faviconUrl) ?? "/favicon.ico",
      ...(logoUrl && { apple: bust(logoUrl) }),
    },

    // ── Canonical / base URL ──────────────────────────────────────────────────
    ...(siteUrl && {
      metadataBase: new URL(siteUrl),
      alternates: { canonical: "/" },
    }),

    // ── Open Graph (WhatsApp, Facebook, Telegram link previews) ──────────────
    openGraph: {
      type: "website",
      siteName,
      title: browserTitle,
      description: desc,
      ...(siteUrl && { url: siteUrl }),
      ...(logoUrl && { images: [{ url: bust(logoUrl) }] }),
    },

    // ── Twitter / X cards ─────────────────────────────────────────────────────
    twitter: {
      card: logoUrl ? "summary_large_image" : "summary",
      title: browserTitle,
      description: desc,
      ...(logoUrl && { images: [bust(logoUrl)] }),
    },

    // ── Robots ────────────────────────────────────────────────────────────────
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <SiteSettingsProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
          </AuthProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
