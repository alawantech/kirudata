/**
 * ProviderIcon — branded icons for cable TV, exam, and electricity providers.
 * Uses inline SVGs for known providers, falls back to colored pill.
 */

const CABLE_BRANDS = {
  dstv: { bg: "#1a1a3e", text: "#ffffff", sub: "DStv", accent: "#e2001a" },
  gotv: { bg: "#f7941d", text: "#ffffff", sub: "GoTV", accent: "#c1272d" },
  startimes: { bg: "#00a0e1", text: "#ffffff", sub: "StarTimes", accent: "#004a8f" },
};

const EXAM_BRANDS = {
  waec: { bg: "#006b3f", text: "#ffffff", sub: "WAEC" },
  neco: { bg: "#1a3c8f", text: "#ffffff", sub: "NECO" },
  nabteb: { bg: "#cc0000", text: "#ffffff", sub: "NABTEB" },
};

const ELEC_BRANDS = {
  "ikeja": { bg: "#f57c00", text: "#fff", sub: "IKEDC", accent: "#e65100" },
  "eko": { bg: "#2e7d32", text: "#fff", sub: "EKEDC", accent: "#1b5e20" },
  "kano": { bg: "#00897b", text: "#fff", sub: "KANO", accent: "#004d40" },
  "port harcourt": { bg: "#c62828", text: "#fff", sub: "PHED", accent: "#b71c1c" },
  "jos": { bg: "#5d4037", text: "#fff", sub: "JED", accent: "#3e2723" },
  "ibadan": { bg: "#1565c0", text: "#fff", sub: "IBEDC", accent: "#0d47a1" },
  "kaduna": { bg: "#00695c", text: "#fff", sub: "KAEDCO", accent: "#004d40" },
  "abuja": { bg: "#283593", text: "#fff", sub: "AEDC", accent: "#1a237e" },
  "enugu": { bg: "#6a1b9a", text: "#fff", sub: "EEDC", accent: "#4a148c" },
  "benin": { bg: "#ef6c00", text: "#fff", sub: "BEDC", accent: "#e65100" },
  "yola": { bg: "#00796b", text: "#fff", sub: "YEDC", accent: "#004d40" },
  "aba": { bg: "#ad1457", text: "#fff", sub: "Aba", accent: "#880e4f" },
};

function getBrand(name = "") {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(CABLE_BRANDS))
    if (lower.includes(key)) return { ...val, type: "cable" };
  for (const [key, val] of Object.entries(EXAM_BRANDS))
    if (lower.includes(key)) return { ...val, type: "exam" };
  for (const [key, val] of Object.entries(ELEC_BRANDS))
    if (lower.includes(key)) return { ...val, type: "elec" };
  return null;
}

/* ─── Cable SVGs ──────────────────────────────────────────── */

function DstvLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill="#1a1a3e" />
      <circle cx="50" cy="40" r="16" fill="none" stroke="#e2001a" strokeWidth="3" />
      <circle cx="50" cy="40" r="6" fill="#e2001a" />
      <line x1="50" y1="56" x2="50" y2="70" stroke="#e2001a" strokeWidth="3" strokeLinecap="round" />
      <text x="50" y="82" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Arial,sans-serif">DStv</text>
    </svg>
  );
}

function GotvLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill="#f7941d" />
      <circle cx="50" cy="42" r="18" fill="#fff" />
      <text x="50" y="48" textAnchor="middle" fontSize="16" fontWeight="900" fill="#f7941d" fontFamily="Arial,sans-serif">Go</text>
      <text x="50" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Arial,sans-serif">GoTV</text>
    </svg>
  );
}

function StarTimesLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill="#00a0e1" />
      <polygon points="50,18 56,36 76,36 60,47 66,65 50,54 34,65 40,47 24,36 44,36" fill="#fff" />
      <text x="50" y="82" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Arial,sans-serif">StarTimes</text>
    </svg>
  );
}

/* ─── Exam SVGs ───────────────────────────────────────────── */

function WaecLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill="#006b3f" />
      <rect x="25" y="22" width="50" height="38" rx="4" fill="none" stroke="#fff" strokeWidth="2.5" />
      <line x1="35" y1="34" x2="65" y2="34" stroke="#fff" strokeWidth="2" />
      <line x1="35" y1="42" x2="60" y2="42" stroke="#fff" strokeWidth="2" />
      <line x1="35" y1="50" x2="55" y2="50" stroke="#fff" strokeWidth="2" />
      <text x="50" y="78" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Arial,sans-serif">WAEC</text>
    </svg>
  );
}

function NecoLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill="#1a3c8f" />
      <circle cx="50" cy="40" r="18" fill="none" stroke="#ffd700" strokeWidth="3" />
      <text x="50" y="46" textAnchor="middle" fontSize="12" fontWeight="900" fill="#ffd700" fontFamily="Arial,sans-serif">NECO</text>
      <text x="50" y="78" textAnchor="middle" fontSize="9" fontWeight="600" fill="rgba(255,255,255,.7)" fontFamily="Arial,sans-serif">Examination</text>
    </svg>
  );
}

function NabtebLogo({ size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill="#cc0000" />
      <rect x="22" y="24" width="56" height="36" rx="4" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M34 48 L50 32 L66 48" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="50" y="80" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="Arial,sans-serif">NABTEB</text>
    </svg>
  );
}

/* ─── Electricity SVGs ────────────────────────────────────── */

function ElecLogo({ brand, size }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" rx="20" fill={brand.bg} />
      <path d="M55 18 L38 52 L50 52 L44 82 L68 44 L54 44 Z" fill="#fff" />
      <text x="50" y="88" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(255,255,255,.85)" fontFamily="Arial,sans-serif">{brand.sub}</text>
    </svg>
  );
}

function getProviderLogo(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("dstv")) return DstvLogo;
  if (lower.includes("gotv")) return GotvLogo;
  if (lower.includes("startimes")) return StarTimesLogo;
  if (lower.includes("waec")) return WaecLogo;
  if (lower.includes("neco")) return NecoLogo;
  if (lower.includes("nabteb")) return NabtebLogo;
  // Electricity providers — all get the lightning bolt icon
  const brand = getBrand(name);
  if (brand && brand.type === "elec") return (props) => <ElecLogo brand={brand} {...props} />;
  return null;
}

export default function ProviderIcon({ name = "", size = 36, logoUrl }) {
  const brand = getBrand(name);

  const boxStyle = {
    width: size,
    height: size,
    borderRadius: size * 0.22,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: brand?.bg || "#f4f4f5",
    flexShrink: 0,
  };

  // 1. Real uploaded logo
  if (logoUrl) {
    return (
      <div style={boxStyle}>
        <img
          src={logoUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
    );
  }

  // 2. Built-in branded logo
  const Logo = getProviderLogo(name);
  if (Logo) {
    return <Logo size={size} />;
  }

  // 3. Fallback: colored pill with initials
  return (
    <div style={boxStyle}>
      <span
        style={{
          fontSize: Math.round(size * 0.24) + "px",
          fontWeight: 900,
          color: brand?.text || "#71717a",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "-.03em",
        }}
      >
        {(name || "?").slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}
