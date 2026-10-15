"use client";
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Phone,
  Wifi,
  Tv,
  Zap,
  GraduationCap,
  RefreshCcw,
  MessageSquare,
  Wallet,
  CreditCard,
  Repeat,
  Copy,
  Share2,
  ShieldCheck,
  Loader2,
  Hash,
  Calendar,
  FileText,
  MapPin,
  User,
  Package,
  Info,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const SVC_MAP = {
  airtime: { color: "#f97316", bg: "#fff7ed", Icon: Phone, label: "Airtime" },
  atc: { color: "#0d9488", bg: "#ccfbf1", Icon: Repeat, label: "Airtime to Cash" },
  data: { color: "#4f46e5", bg: "#eff6ff", Icon: Wifi, label: "Data" },
  cable: { color: "#7c3aed", bg: "#f5f3ff", Icon: Tv, label: "Cable TV" },
  electricity: { color: "#d97706", bg: "#fffbeb", Icon: Zap, label: "Electricity" },
  exam: { color: "#059669", bg: "#ecfdf5", Icon: GraduationCap, label: "Exam Pin" },
  sms: { color: "#0369a1", bg: "#f0f9ff", Icon: MessageSquare, label: "Bulk SMS" },
  wallet: { color: "#0891b2", bg: "#ecfeff", Icon: Wallet, label: "Wallet" },
  card: { color: "#16a34a", bg: "#f0fdf4", Icon: CreditCard, label: "Card" },
  pin: { color: "#db2777", bg: "#fdf2f8", Icon: CreditCard, label: "Pin" },
  other: { color: "#0891b2", bg: "#ecfeff", Icon: RefreshCcw, label: "Transaction" },
};

const ROW_ICON_MAP = {
  Reference: Hash,
  "Transaction ID": Hash,
  Service: Package,
  Description: FileText,
  Amount: Wallet,
  Date: Calendar,
  Token: Zap,
  Meter: Hash,
  "Meter Type": Info,
  "Customer Name": User,
  "Customer Address": MapPin,
  Product: Package,
  Status: CheckCircle2,
};

const ROW_ICON_COLOR = {
  Reference: "#6366f1",
  "Transaction ID": "#6366f1",
  Service: "#8b5cf6",
  Description: "#a78bfa",
  Amount: "#4f46e5",
  Date: "#64748b",
  Token: "#d97706",
  Meter: "#0891b2",
  "Meter Type": "#0891b2",
  "Customer Name": "#7c3aed",
  "Customer Address": "#6366f1",
  Product: "#8b5cf6",
  Status: "#10b981",
};

export function getSvcMeta(category, servicename = "") {
  if (SVC_MAP[category]) return SVC_MAP[category];
  const l = (servicename || "").toLowerCase();
  for (const [k, v] of Object.entries(SVC_MAP))
    if (l.includes(k)) return v;
  return SVC_MAP.other;
}

export function SvcStatus(s) {
  if (s === 1 || s === "success" || s === "successful")
    return { cls: "badge-success", label: "Successful" };
  if (s === 0 || s === "failed") return { cls: "badge-failed", label: "Failed" };
  return { cls: "badge-pending", label: "Pending" };
}

function fmtNaira(n) {
  const v = Math.abs(parseFloat(n || 0));
  return "\u20A6" + v.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function parseServicedesc(desc, servicename, apiResponseLog) {
  if (!desc || desc === "\u2014") return { description: desc || "\u2014" };
  let token;
  if (apiResponseLog && servicename === "Electricity") {
    try {
      const parsed = typeof apiResponseLog === "string" ? JSON.parse(apiResponseLog) : apiResponseLog;
      if (parsed.token) token = parsed.token;
    } catch {}
  }
  if (servicename !== "Electricity") return { description: desc };
  const parts = desc.split(" | ").map((p) => p.trim());
  const first = parts[0] || desc;
  const rest = parts.length > 1 ? parts.slice(1) : [];
  const meterTypes = ["Prepaid", "Postpaid"];
  let meterType = "";
  let providerName = first;
  for (const mt of meterTypes) {
    if (first.toLowerCase().includes(mt.toLowerCase())) {
      meterType = mt;
      providerName = first.replace(new RegExp(mt, "i"), "").replace(/\s*-\s*\d+/, "").trim();
      break;
    }
  }
  const meterMatch = first.match(/(\d{10,})/);
  const meterNumber = meterMatch ? meterMatch[1] : undefined;
  if (!providerName || providerName === first) {
    providerName = first.replace(/\d{10,}/, "").replace(/\s*-\s*$/, "").trim();
  }
  return {
    description: providerName || undefined,
    meterNumber,
    meterType: meterType || undefined,
    customerName: rest[0] || undefined,
    address: rest[1] || undefined,
    token,
  };
}

function drawReceiptCanvas(tx, siteName, label, st, isDebit, details, token, logoImg) {
  const dpr = 2;
  const W = 440;
  const PAD = 24;
  const HEADER_H = token ? 280 : 250;
  const ROW_H = 44;
  const TOKEN_H = token ? 64 : 0;
  const FOOTER_H = 48;
  const totalH = HEADER_H + TOKEN_H + ROW_H * details.length + FOOTER_H + 32;

  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = totalH * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, totalH);

  const cardX = 16;
  const cardW = W - 32;
  let y = 16;

  roundRect(ctx, cardX, y, cardW, HEADER_H, 20);
  const grad = ctx.createLinearGradient(cardX, y, cardX + cardW, y + HEADER_H);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cardX + cardW - 20, y - 20, 60, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245,158,11,0.06)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + 20, y + HEADER_H + 20, 45, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245,158,11,0.04)";
  ctx.fill();
  ctx.restore();

  const logoSize = 48;
  const logoX = W / 2 - logoSize / 2;
  const logoY = y + 24;

  if (logoImg) {
    ctx.save();
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 12);
    ctx.clip();
    ctx.fillStyle = "#fff";
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    ctx.drawImage(logoImg, logoX + 2, logoY + 2, logoSize - 4, logoSize - 4);
    ctx.restore();
  } else {
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 12);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(siteName.charAt(0), W / 2, logoY + logoSize / 2);
  }

  y = logoY + logoSize + 8;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 13px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(siteName, W / 2, y);

  y += 18;
  ctx.fillStyle = "#f59e0b";
  ctx.font = "700 10px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("TRANSACTION RECEIPT", W / 2, y);

  y += 24;
  ctx.fillStyle = "#f59e0b";
  ctx.font = "900 30px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText((isDebit ? "-" : "+") + fmtNaira(tx.amount), W / 2, y);

  y += 20;
  const badgeColor = st.cls === "badge-success" ? "#10b981" : st.cls === "badge-failed" ? "#ef4444" : "#f59e0b";
  const badgeBg = st.cls === "badge-success" ? "rgba(16,185,129,0.15)" : st.cls === "badge-failed" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)";
  ctx.font = "700 11px -apple-system, BlinkMacSystemFont, sans-serif";
  const badgeW = ctx.measureText(st.label).width + 36;
  const badgeH = 24;
  roundRect(ctx, W / 2 - badgeW / 2, y, badgeW, badgeH, 12);
  ctx.fillStyle = badgeBg;
  ctx.fill();
  ctx.fillStyle = badgeColor;
  ctx.textBaseline = "middle";
  ctx.fillText("\u2713  " + st.label, W / 2, y + badgeH / 2);

  y += badgeH + 14;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "500 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(fmtDate(tx.date || tx.createdAt), W / 2, y);

  y = 16 + HEADER_H + 10;

  if (token) {
    const tokH = 56;
    roundRect(ctx, cardX, y, cardW, tokH, 14);
    ctx.fillStyle = "#fffbeb";
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#92400e";
    ctx.font = "700 9px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PREPAID TOKEN", W / 2, y + 16);
    ctx.fillStyle = "#09090b";
    ctx.font = "700 13px 'Courier New', monospace";
    ctx.fillText(token, W / 2, y + 38);
    y += tokH + 10;
  }

  const rowsH = ROW_H * details.length;
  roundRect(ctx, cardX, y, cardW, rowsH + 8, 16);
  ctx.fillStyle = "#fff";
  ctx.fill();

  details.forEach((d, i) => {
    const ry = y + 4 + i * ROW_H;
    const iconColor = ROW_ICON_COLOR[d.label] || "#6366f1";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#71717a";
    ctx.font = "500 12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(d.label, cardX + PAD, ry + ROW_H / 2);

    ctx.textAlign = "right";
    if (d.highlight) {
      ctx.fillStyle = "#09090b";
      ctx.font = "800 13px -apple-system, BlinkMacSystemFont, sans-serif";
    } else if (d.mono) {
      ctx.fillStyle = "#09090b";
      ctx.font = "600 11px 'Courier New', monospace";
    } else {
      ctx.fillStyle = "#09090b";
      ctx.font = "600 12px -apple-system, BlinkMacSystemFont, sans-serif";
    }
    let val = d.value;
    const maxW = cardW - PAD * 2 - 110;
    while (ctx.measureText(val).width > maxW && val.length > 5) val = val.slice(0, -1);
    if (val !== d.value) val += "\u2026";
    ctx.fillText(val, cardX + cardW - PAD, ry + ROW_H / 2);

    if (i < details.length - 1) {
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + PAD, ry + ROW_H);
      ctx.lineTo(cardX + cardW - PAD, ry + ROW_H);
      ctx.stroke();
    }
  });

  y += rowsH + 18;
  ctx.textAlign = "center";
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "600 10px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("\u{1F6E1}\uFE0F  Secured & verified by " + siteName, W / 2, y);

  const finalH = Math.max(y + 16, 400);
  const trimmed = document.createElement("canvas");
  trimmed.width = canvas.width;
  trimmed.height = finalH * dpr;
  const tCtx = trimmed.getContext("2d");
  tCtx.drawImage(canvas, 0, 0, canvas.width, finalH * dpr, 0, 0, canvas.width, finalH * dpr);
  return trimmed;
}

async function canvasToPdfBlob(canvas) {
  const jpegBlob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const w = canvas.width;
  const h = canvas.height;
  const scale = 0.75;
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  const enc = new TextEncoder();
  const parts = [];
  let offset = 0;
  const offsets = {};
  const push = (s) => { const b = enc.encode(s); parts.push(b); offset += b.length; };
  const pushB = (b) => { parts.push(b); offset += b.length; };
  push("%PDF-1.4\n");
  offsets[1] = offset;
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  offsets[2] = offset;
  push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  offsets[3] = offset;
  push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>\nendobj\n`);
  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  offsets[4] = offset;
  push(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  offsets[5] = offset;
  push(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  pushB(jpegBytes);
  push("\nendstream\nendobj\n");
  const xrefOffset = offset;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const part of parts) { result.set(part, pos); pos += part.length; }
  return new Blob([result], { type: "application/pdf" });
}

async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if (e.name === "AbortError" || e.name === "NotAllowedError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export default function ReceiptView({ tx, showPrint = true }) {
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const settings = useSiteSettings();
  const siteName = settings.sitename || "Gwarzo Data Sub";

  const category = tx.category || "other";
  const { label } = getSvcMeta(category, tx.servicename);
  const st = SvcStatus(tx.status);
  const isDebit = true;
  const parsed = parseServicedesc(tx.servicedesc || "", tx.servicename, tx.apiResponseLog);
  const isElectricity = tx.servicename === "Electricity";

  const details = isElectricity
    ? [
        { label: "Transaction ID", value: tx.transref || tx.ref || "\u2014", mono: true },
        { label: "Status", value: st.label },
        parsed.description && { label: "Product", value: parsed.description },
        { label: "Amount", value: fmtNaira(tx.amount), highlight: true },
        parsed.meterNumber && { label: "Meter", value: parsed.meterNumber, mono: true },
        parsed.meterType && { label: "Meter Type", value: parsed.meterType },
        parsed.customerName && { label: "Customer Name", value: parsed.customerName },
        parsed.address && { label: "Customer Address", value: parsed.address },
        { label: "Date", value: fmtDate(tx.date || tx.createdAt) },
      ].filter(Boolean)
    : [
        { label: "Reference", value: tx.transref || tx.ref || "\u2014", mono: true },
        { label: "Service", value: tx.servicename || label },
        { label: "Description", value: tx.servicedesc || "\u2014" },
        { label: "Amount", value: fmtNaira(tx.amount), highlight: true },
        { label: "Date", value: fmtDate(tx.date || tx.createdAt) },
      ];

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const generateCanvas = async () => {
    let logoImg = null;
    if (settings.logoUrl) logoImg = await loadImage(settings.logoUrl);
    return drawReceiptCanvas(tx, siteName, label, st, isDebit, details, parsed.token, logoImg);
  };

  const shareImage = async () => {
    setBusy(true);
    setMenuOpen(false);
    try {
      const canvas = await generateCanvas();
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      await shareOrDownload(blob, `receipt-${tx.transref || "transaction"}.png`, "Receipt");
      toast.success("Receipt shared!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate receipt");
    } finally {
      setBusy(false);
    }
  };

  const sharePdf = async () => {
    setBusy(true);
    setMenuOpen(false);
    try {
      const canvas = await generateCanvas();
      const blob = await canvasToPdfBlob(canvas);
      await shareOrDownload(blob, `receipt-${tx.transref || "transaction"}.pdf`, "Receipt");
      toast.success("Receipt shared!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(tx.transref || tx.ref || "").then(() => toast.success("Copied!"));
  };

  return (
    <div className="receipt-sheet">
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "1.25rem",
          padding: "2rem 1.25rem 1.5rem",
          textAlign: "center",
          marginBottom: "1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(245,158,11,.06)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(245,158,11,.04)" }} />

        {settings.logoUrl ? (
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", padding: 4, position: "relative" }}>
            <img src={settings.logoUrl} alt={siteName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#fff", fontWeight: 900, fontSize: 20, position: "relative" }}>
            {siteName.charAt(0)}
          </div>
        )}

        <div style={{ color: "rgba(255,255,255,.9)", fontSize: ".85rem", fontWeight: 700, position: "relative" }}>{siteName}</div>
        <div style={{ color: "#f59e0b", fontSize: ".68rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", margin: "4px 0 12px", position: "relative" }}>
          Transaction Receipt
        </div>
        <div style={{ fontWeight: 900, fontSize: "2rem", letterSpacing: "-.03em", color: "#f59e0b", margin: "0 0 10px", position: "relative" }}>
          {fmtNaira(tx.amount)}
        </div>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: st.cls === "badge-success" ? "rgba(16,185,129,.15)" : st.cls === "badge-failed" ? "rgba(239,68,68,.15)" : "rgba(245,158,11,.15)",
            color: st.cls === "badge-success" ? "#34d399" : st.cls === "badge-failed" ? "#f87171" : "#fbbf24",
            padding: "5px 16px", borderRadius: 99, fontSize: ".75rem", fontWeight: 700, position: "relative",
          }}
        >
          <CheckCircle2 size={14} />
          {st.label}
        </div>
        <div style={{ color: "rgba(255,255,255,.45)", fontSize: ".72rem", marginTop: 10, position: "relative" }}>
          {fmtDate(tx.date || tx.createdAt)}
        </div>
      </div>

      {parsed.token && (
        <div style={{ border: "1.5px solid #f59e0b", background: "#fffbeb", borderRadius: "1rem", padding: ".85rem 1rem", textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: ".65rem", color: "#92400e", fontWeight: 700, letterSpacing: "1px", marginBottom: 4 }}>PREPAID TOKEN</div>
          <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#09090b", fontFamily: "'Courier New', monospace", letterSpacing: ".5px", wordBreak: "break-all" }}>
            {parsed.token}
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,.03)" }}>
        {details.map((d, i) => {
          const RowIcon = ROW_ICON_MAP[d.label] || Hash;
          const iconColor = ROW_ICON_COLOR[d.label] || "#6366f1";
          return (
            <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".85rem 1.1rem", borderBottom: i < details.length - 1 ? "1px solid #f4f4f5" : "none", gap: ".5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: iconColor + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RowIcon size={14} color={iconColor} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: ".8rem", color: "#71717a" }}>{d.label}</span>
              </div>
              <span
                style={{
                  fontSize: d.highlight ? ".95rem" : ".85rem",
                  fontWeight: d.highlight ? 900 : 600,
                  color: "#09090b",
                  textAlign: "right",
                  maxWidth: "55%",
                  wordBreak: "break-all",
                  fontFamily: d.mono ? "'Courier New', monospace" : "inherit",
                }}
              >
                {d.value}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: ".85rem", color: "#a1a1aa", fontSize: ".7rem", fontWeight: 600 }}>
        <ShieldCheck size={13} />
        Secured &amp; verified by {siteName}
      </div>

      {showPrint && (
        <div style={{ display: "flex", gap: ".625rem", marginTop: ".75rem" }}>
          <button
            onClick={copyRef}
            style={{
              flex: 1, background: "#fff", border: "1.5px solid #e4e4e7", borderRadius: "1rem",
              padding: ".85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem",
              fontWeight: 700, fontSize: ".82rem", color: "#4f46e5", cursor: "pointer",
            }}
          >
            <Copy size={16} /> Copy Ref
          </button>
          <div ref={menuRef} style={{ position: "relative", flex: 1 }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={busy}
              style={{
                width: "100%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: "1rem",
                padding: ".85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem",
                fontWeight: 700, fontSize: ".82rem", color: "#fff", cursor: busy ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(79,70,229,.3)", opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Share2 size={16} /> Share Receipt</>
              )}
            </button>
            {menuOpen && !busy && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
                <div
                  style={{
                    position: "absolute", bottom: "110%", left: 0, right: 0,
                    background: "#fff", borderRadius: "1rem", border: "1px solid #e4e4e7",
                    boxShadow: "0 8px 30px rgba(0,0,0,.12)", overflow: "hidden", zIndex: 999,
                  }}
                >
                  <button
                    onClick={shareImage}
                    style={{
                      width: "100%", padding: ".75rem 1rem", display: "flex", alignItems: "center", gap: ".6rem",
                      background: "none", border: "none", cursor: "pointer", fontSize: ".82rem", fontWeight: 600,
                      color: "#09090b",
                    }}
                  >
                    <ImageIcon size={16} color="#4f46e5" /> Share as Image
                  </button>
                  <div style={{ height: 1, background: "#f4f4f5" }} />
                  <button
                    onClick={sharePdf}
                    style={{
                      width: "100%", padding: ".75rem 1rem", display: "flex", alignItems: "center", gap: ".6rem",
                      background: "none", border: "none", cursor: "pointer", fontSize: ".82rem", fontWeight: 600,
                      color: "#09090b",
                    }}
                  >
                    <FileText size={16} color="#dc2626" /> Share as PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
