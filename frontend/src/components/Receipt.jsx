"use client";
import { useState } from "react";
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
  Download,
  ShieldCheck,
  Loader2,
  Hash,
  Calendar,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  User,
  Package,
  Info,
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
  "Reference": Hash,
  "Transaction ID": Hash,
  "Service": Package,
  "Description": FileText,
  "Amount": Wallet,
  "Old Balance": ArrowDownLeft,
  "New Balance": ArrowUpRight,
  "Date": Calendar,
  "Token": Zap,
  "Meter": Hash,
  "Meter Type": Info,
  "Customer Name": User,
  "Customer Address": MapPin,
  "Product": Package,
  "Status": CheckCircle2,
};

const ROW_ICON_COLOR = {
  "Reference": "#6366f1",
  "Transaction ID": "#6366f1",
  "Service": "#8b5cf6",
  "Description": "#a78bfa",
  "Amount": "#4f46e5",
  "Old Balance": "#f97316",
  "New Balance": "#10b981",
  "Date": "#64748b",
  "Token": "#d97706",
  "Meter": "#0891b2",
  "Meter Type": "#0891b2",
  "Customer Name": "#7c3aed",
  "Customer Address": "#6366f1",
  "Product": "#8b5cf6",
  "Status": "#10b981",
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x + r, y + r);
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

function drawReceiptCanvas(tx, siteName, label, st, isDebit, details, logoImg) {
  const dpr = 2;
  const W = 440;
  const PADDING = 32;
  const CONTENT_W = W - PADDING * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = 900 * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  let y = 0;

  ctx.fillStyle = "#f5f5f7";
  ctx.fillRect(0, 0, W, 900);

  const cardX = 16;
  const cardW = W - 32;
  const cardStartY = 16;
  y = cardStartY;

  const headerH = 260;
  roundRect(ctx, cardX, y, cardW, headerH, 20);
  const grad = ctx.createLinearGradient(cardX, y, cardX + cardW, y + headerH);
  grad.addColorStop(0, "#4f46e5");
  grad.addColorStop(1, "#7c3aed");
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cardX + cardW - 30, y - 30, 60, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + 20, y + headerH + 20, 45, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.restore();

  const logoSize = 48;
  const logoX = W / 2 - logoSize / 2;
  const logoY = y + 24;

  if (logoImg) {
    ctx.save();
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 12);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  } else {
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 12);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(siteName.charAt(0), W / 2, logoY + logoSize / 2);
  }

  y = logoY + logoSize + 10;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "800 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(siteName, W / 2, y);

  y += 22;
  const checkR = 26;
  ctx.beginPath();
  ctx.arc(W / 2, y + checkR, checkR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px -apple-system, sans-serif";
  ctx.fillText("\u2713", W / 2, y + checkR + 2);

  y += checkR * 2 + 14;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(label + " Receipt", W / 2, y);

  y += 24;
  ctx.fillStyle = "#fff";
  ctx.font = "900 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const amtText = (isDebit ? "-" : "+") + fmtNaira(tx.amount);
  ctx.fillText(amtText, W / 2, y);

  y += 20;
  const badgeText = st.label;
  ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const badgeW = ctx.measureText(badgeText).width + 28;
  const badgeH = 22;
  roundRect(ctx, W / 2 - badgeW / 2, y, badgeW, badgeH, 11);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, W / 2, y + badgeH / 2);

  y = cardStartY + headerH + 12;
  const rowPad = 14;
  const rowH = 44;
  const iconCircleSize = 28;

  roundRect(ctx, cardX, y, cardW, rowH * details.length, 16);
  ctx.fillStyle = "#fff";
  ctx.fill();

  details.forEach((d, i) => {
    const ry = y + i * rowH;
    ctx.textBaseline = "middle";

    const iconColor = ROW_ICON_COLOR[d.label] || "#6366f1";
    const iconBg = iconColor + "12";
    const iconCx = cardX + rowPad + iconCircleSize / 2;
    const iconCy = ry + rowH / 2;

    ctx.beginPath();
    ctx.arc(iconCx, iconCy, iconCircleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = iconBg;
    ctx.fill();

    ctx.fillStyle = iconColor;
    ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    const iconChar = d.label.charAt(0);
    ctx.fillText(iconChar, iconCx, iconCy + 1);

    ctx.textAlign = "left";
    ctx.fillStyle = "#71717a";
    ctx.font = "500 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(d.label, cardX + rowPad + iconCircleSize + 10, ry + rowH / 2);

    ctx.textAlign = "right";
    if (d.highlight) {
      ctx.fillStyle = d.color || "#09090b";
      ctx.font = "900 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    } else {
      ctx.fillStyle = "#09090b";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    }
    if (d.mono) ctx.font = "600 12px 'Courier New', monospace";

    let val = d.value;
    let maxW = CONTENT_W - rowPad * 2 - 100 - iconCircleSize - 10;
    if (ctx.measureText(val).width > maxW) {
      while (ctx.measureText(val + "\u2026").width > maxW && val.length > 5) {
        val = val.slice(0, -1);
      }
      val += "\u2026";
    }
    ctx.fillText(val, cardX + cardW - rowPad, ry + rowH / 2);

    if (i < details.length - 1) {
      ctx.strokeStyle = "#f4f4f5";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + rowPad + iconCircleSize + 10, ry + rowH);
      ctx.lineTo(cardX + cardW - rowPad, ry + rowH);
      ctx.stroke();
    }
  });

  y += rowH * details.length + 14;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("\u{1F6E1}\uFE0F Secured & verified by " + siteName, W / 2, y);

  y += 24;
  const finalH = Math.max(y + 16, 400);
  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = canvas.width;
  trimmedCanvas.height = finalH * dpr;
  const tCtx = trimmedCanvas.getContext("2d");
  tCtx.drawImage(canvas, 0, 0, canvas.width, finalH * dpr, 0, 0, canvas.width, finalH * dpr);

  return trimmedCanvas;
}

function parseServicedesc(desc, servicename, apiResponseLog) {
  if (!desc || desc === "\u2014") return { description: desc || "\u2014" };

  let token = undefined;
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

export default function ReceiptView({ tx, showPrint = true }) {
  const [downloading, setDownloading] = useState(false);
  const settings = useSiteSettings();
  const siteName = settings.sitename || "Gwarzo Data Sub";

  const category = tx.category || "other";
  const { color, bg, Icon, label } = getSvcMeta(category, tx.servicename);
  const st = SvcStatus(tx.status);
  const isDebit = parseFloat(tx.oldbal || 0) > parseFloat(tx.newbal || 0);

  const parsedDesc = parseServicedesc(tx.servicedesc || "", tx.servicename, tx.apiResponseLog);
  const isElectricity = tx.servicename === "Electricity";
  const details = isElectricity
    ? [
        parsedDesc.token && { label: "Token", value: parsedDesc.token },
        { label: "Transaction ID", value: tx.transref || tx.ref || "\u2014", mono: true },
        { label: "Status", value: st.label },
        parsedDesc.description && { label: "Product", value: parsedDesc.description },
        {
          label: "Amount",
          value: fmtNaira(tx.amount),
          highlight: true,
          color: "#09090b",
        },
        parsedDesc.meterNumber && { label: "Meter", value: parsedDesc.meterNumber, mono: true },
        parsedDesc.meterType && { label: "Meter Type", value: parsedDesc.meterType },
        parsedDesc.customerName && { label: "Customer Name", value: parsedDesc.customerName },
        parsedDesc.address && { label: "Customer Address", value: parsedDesc.address },
        {
          label: "Date",
          value: new Date(tx.date || tx.createdAt).toLocaleString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ].filter(Boolean)
    : [
        { label: "Reference", value: tx.transref || tx.ref || "\u2014", mono: true },
        { label: "Service", value: tx.servicename || label },
        { label: "Description", value: tx.servicedesc || "\u2014" },
        {
          label: "Amount",
          value: `${isDebit ? "-" : "+"}${fmtNaira(tx.amount)}`,
          highlight: true,
          color: isDebit ? "#dc2626" : "#059669",
        },
        showPrint && tx.oldbal != null && {
          label: "Old Balance",
          value: fmtNaira(tx.oldbal),
        },
        showPrint && tx.newbal != null && {
          label: "New Balance",
          value: fmtNaira(tx.newbal),
        },
        {
          label: "Date",
          value: new Date(tx.date || tx.createdAt).toLocaleString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ].filter(Boolean);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvasDetails = details.filter((d) => d.label !== "Old Balance" && d.label !== "New Balance");
      let logoImg = null;
      if (settings.logoUrl) {
        logoImg = await loadImage(settings.logoUrl);
      }
      const canvas = drawReceiptCanvas(tx, siteName, label, st, isDebit, canvasDetails, logoImg);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${tx.transref || "transaction"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      toast.success("Receipt downloaded!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="receipt-sheet">
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          borderRadius: "1.25rem",
          padding: "1.5rem 1.25rem 1.25rem",
          textAlign: "center",
          marginBottom: "1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt={siteName} style={{ height: 48, width: "auto", objectFit: "contain", marginBottom: 4, filter: "brightness(0) invert(1)", position: "relative" }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: -1, backdropFilter: "blur(4px)", position: "relative" }}>
            {siteName.charAt(0)}
          </div>
        )}
        <div style={{ color: "rgba(255,255,255,.9)", fontSize: ".82rem", fontWeight: 800, letterSpacing: ".3px", marginBottom: 14, position: "relative" }}>
          {siteName}
        </div>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", backdropFilter: "blur(4px)", position: "relative" }}>
          <CheckCircle2 size={28} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: ".75rem", fontWeight: 600, marginBottom: 4, position: "relative" }}>
          {label} Receipt
        </div>
        <div style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-.04em", color: "#fff", margin: "0 0 10px", position: "relative" }}>
          {isDebit ? "-" : "+"}{fmtNaira(tx.amount)}
        </div>
        <span style={{ display: "inline-block", background: "rgba(255,255,255,.18)", color: "#fff", padding: "5px 18px", borderRadius: 99, fontSize: ".72rem", fontWeight: 700, backdropFilter: "blur(4px)", position: "relative" }}>
          {st.label}
        </span>
      </div>

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
              <span style={{ fontSize: ".85rem", fontWeight: d.highlight ? 900 : 600, color: d.color || "#09090b", textAlign: "right", maxWidth: "55%", wordBreak: "break-all", fontFamily: d.mono ? "monospace" : "inherit" }}>{d.value}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: ".85rem", color: "#a1a1aa", fontSize: ".7rem", fontWeight: 600 }}>
        <ShieldCheck size={13} />
        Secured &amp; verified by {siteName}
      </div>

      <div style={{ display: "flex", gap: ".625rem", marginTop: ".75rem" }}>
        <button onClick={() => copy(tx.transref || tx.ref || "")} style={{ flex: 1, background: "#fff", border: "1.5px solid #e4e4e7", borderRadius: "1rem", padding: ".85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem", fontWeight: 700, fontSize: ".82rem", color: "#4f46e5", cursor: "pointer" }}>
          <Copy size={16} /> Copy Ref
        </button>
        {showPrint && (
          <button onClick={handleDownload} disabled={downloading} style={{ flex: 1, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: "1rem", padding: ".85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem", fontWeight: 700, fontSize: ".82rem", color: "#fff", cursor: downloading ? "wait" : "pointer", boxShadow: "0 4px 14px rgba(79,70,229,.3)", opacity: downloading ? 0.7 : 1 }}>
            {downloading ? (<><Loader2 size={16} className="animate-spin" /> Saving...</>) : (<><Download size={16} /> Download Receipt</>)}
          </button>
        )}
      </div>
    </div>
  );
}
