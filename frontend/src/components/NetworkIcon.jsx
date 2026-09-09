/**
 * NetworkIcon — branded icon for Nigerian telecom carriers.
 * Shows the carrier logo if a URL is provided, otherwise renders
 * the real brand logo as an inline SVG, or a styled branded pill.
 */

const NETWORK_META = {
  mtn: { abbr: "MTN", bg: "#FFCC00", text: "#1a1a1a", ring: "#e6b800" },
  airtel: { abbr: "AIR", bg: "#FF0000", text: "#ffffff", ring: "#cc0000" },
  glo: { abbr: "GLO", bg: "#008000", text: "#ffffff", ring: "#006600" },
  "9mobile": { abbr: "9MB", bg: "#006E51", text: "#ffffff", ring: "#004d38" },
  etisalat: { abbr: "9MB", bg: "#006E51", text: "#ffffff", ring: "#004d38" },
  smile: { abbr: "SMI", bg: "#7c3aed", text: "#ffffff", ring: "#5b21b6" },
  ntel: { abbr: "NTL", bg: "#0ea5e9", text: "#ffffff", ring: "#0284c7" },
};

function getNetworkMeta(name = "") {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(NETWORK_META)) {
    if (lower.includes(key)) return val;
  }
  const hues = [231, 142, 271, 187, 38, 24];
  const hue = hues[name.length % hues.length];
  return {
    abbr: name.slice(0, 3).toUpperCase() || "NET",
    bg: `hsl(${hue}, 75%, 50%)`,
    text: "#ffffff",
    ring: `hsl(${hue}, 75%, 40%)`,
  };
}

/* ─── Inline SVG brand logos ─────────────────────────────── */

function MtnLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="50" fill="#FFCC00" />
      <ellipse cx="50" cy="52" rx="30" ry="18" fill="#0066B3" />
      <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fff" fontFamily="Arial,sans-serif">MTN</text>
    </svg>
  );
}

function GloLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="50" fill="#008000" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
      <text x="50" y="58" textAnchor="middle" fontSize="24" fontWeight="900" fill="#fff" fontFamily="Arial,sans-serif" fontStyle="italic">glo</text>
    </svg>
  );
}

function AirtelLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="50" fill="#FF0000" />
      <text x="50" y="44" textAnchor="middle" fontSize="16" fontWeight="400" fill="#fff" fontFamily="Arial,sans-serif" fontStyle="italic">airtel</text>
      <path d="M25 58 Q50 48 75 58" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 64 Q50 54 70 64" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NineMobileLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect x="0" y="0" width="100" height="100" rx="22" fill="#1C1C1C" />
      <circle cx="50" cy="44" r="16" fill="none" stroke="#97C93E" strokeWidth="4" />
      <circle cx="50" cy="44" r="8" fill="#97C93E" />
      <text x="50" y="78" textAnchor="middle" fontSize="11" fontWeight="700" fill="#97C93E" fontFamily="Arial,sans-serif">mobile</text>
    </svg>
  );
}

function getBrandLogo(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("mtn")) return MtnLogo;
  if (lower.includes("glo")) return GloLogo;
  if (lower.includes("airtel")) return AirtelLogo;
  if (lower.includes("9mobile") || lower.includes("etisalat")) return NineMobileLogo;
  return null;
}

export { getNetworkMeta };

export default function NetworkIcon({ logoUrl, name = "", size = 40 }) {
  const meta = getNetworkMeta(name);

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: meta.bg,
    border: "2px solid rgba(0,0,0,.08)",
    flexShrink: 0,
  };

  // 1. If admin uploaded a real logo URL, show it
  if (logoUrl) {
    return (
      <div style={circleStyle}>
        <img
          src={logoUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentNode.innerHTML = `<span style="font-size:${Math.round(size * 0.28)}px;font-weight:900;color:${meta.text};font-family:Inter,sans-serif;letter-spacing:-.03em">${meta.abbr}</span>`;
          }}
        />
      </div>
    );
  }

  // 2. Built-in branded SVG logo for known networks
  const BrandLogo = getBrandLogo(name);
  if (BrandLogo) {
    return (
      <div style={{ ...circleStyle, background: "transparent", border: "none" }}>
        <BrandLogo size={size} />
      </div>
    );
  }

  // 3. Fallback: colored pill with abbreviation
  return (
    <div style={circleStyle}>
      <span
        style={{
          fontSize: Math.round(size * 0.26) + "px",
          fontWeight: 900,
          color: meta.text,
          fontFamily: "Inter, sans-serif",
          letterSpacing: "-.03em",
          lineHeight: 1,
        }}
      >
        {meta.abbr}
      </span>
    </div>
  );
}
