"use client";
import { createContext, useContext, useEffect, useState } from "react";

const DEFAULT = {
  sitename: "KIRU DATA",
  sitetitle: "",
  sitedesc:
    "Nigeria's most reliable VTU platform. Buy airtime, data, pay bills and more.",
  siteurl: "",
  address: "",
  logoUrl: "",
  faviconUrl: "",
  phone: "",
  email: "",
  whatsapp: "",
  telegram: "",
  facebook: "",
  instagram: "",
  twitter: "",
  accountName: "",
  accountNo: "",
  bankName: "",
};

const SiteSettingsContext = createContext(DEFAULT);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT);

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v2";
    fetch(`${base}/public/settings`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.settings) {
          const s = d.data.settings;
          const v = s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now();
          const bust = (url) =>
            url && typeof url === "string"
              ? `${url}${url.includes("?") ? "&" : "?"}v=${v}`
              : url || "";
          s.logoUrl = bust(s.logoUrl);
          s.faviconUrl = bust(s.faviconUrl);
          setSettings((prev) => ({ ...prev, ...s }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
