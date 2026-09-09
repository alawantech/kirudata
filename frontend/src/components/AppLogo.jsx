"use client";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/**
 * AppLogo — reusable brand logo component.
 *
 * Props:
 *   showBrandName  {boolean}  Show the site name next to the logo.
 *   logoHeight     {number}   Rendered height of the logo in px. Default: 52.
 *   dark           {boolean}  true = light background (dark ink).
 *                             false (default) = dark background (white ink +
 *                             white pill behind logo for contrast).
 *   subtitle       {string}   Optional small label under the brand name.
 */
export default function AppLogo({
  showBrandName = true,
  logoHeight = 64,
  dark = false,
  subtitle = null,
}) {
  const settings = useSiteSettings();
  const siteName = settings?.sitename || "KIRU DATA";
  const logoUrl = settings?.logoUrl || "";

  const tileRadius = Math.round(logoHeight * 0.22);
  const tileFont = Math.round(logoHeight * 0.42);

  const nameColor = dark ? "#0f172a" : "#ffffff";
  const subColor = dark ? "#64748b" : "rgba(255,255,255,.5)";

  // On dark backgrounds wrap the logo in a white rounded container so any
  // logo colour stays visible. Width is auto so wide/landscape logos are never
  // clipped — only the height is fixed.
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".75rem",
        flexShrink: 0,
      }}
    >
      {/* ── Logo image or fallback gradient tile ── */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={siteName}
          style={{
            height: logoHeight,
            width: "auto",
            display: "block",
            flexShrink: 0,
            // On dark backgrounds: drop-shadow traces the visible logo pixels
            // only (ignores transparent areas) — no white box artefact.
            filter: !dark
              ? "drop-shadow(0 0 10px rgba(255,255,255,1)) drop-shadow(0 0 22px rgba(255,255,255,0.75)) drop-shadow(0 0 40px rgba(255,255,255,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.7))"
              : "none",
          }}
        />
      ) : (
        <div
          style={{
            width: logoHeight,
            height: logoHeight,
            borderRadius: tileRadius,
            background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            color: "#ffffff",
            fontSize: tileFont,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          {siteName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* ── Brand name (+ optional subtitle) ── */}
      {showBrandName && (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              letterSpacing: "-.02em",
              color: nameColor,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: subtitle ? 1.2 : 1,
            }}
          >
            {siteName}
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: ".68rem",
                color: subColor,
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
