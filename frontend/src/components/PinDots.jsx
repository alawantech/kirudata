"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const PIN_LENGTH = 8;
const PRIMARY = "#4f46e5";

const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "back"],
];

/**
 * 8-digit PIN input for web.
 * Uses a fully custom built-in keypad — no device keyboard, no hidden input.
 * Desktop users can also type with the physical keyboard while the keypad is open.
 */
export default function PinDots({ value = "", onChange, label, error }) {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  const handleKey = useCallback(
    (key) => {
      if (key === "back") {
        onChange(value.slice(0, -1));
      } else if (key && value.length < PIN_LENGTH) {
        onChange(value + key);
      }
    },
    [value, onChange]
  );

  // Close when all 8 digits entered
  useEffect(() => {
    if (value.length === PIN_LENGTH && focused) {
      const t = setTimeout(() => setFocused(false), 250);
      return () => clearTimeout(t);
    }
  }, [value.length, focused]);

  // Physical keyboard support while keypad is open
  useEffect(() => {
    if (!focused) return;
    const onKey = (e) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      else if (e.key === "Backspace") handleKey("back");
      else if (e.key === "Enter" || e.key === "Escape") setFocused(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focused, handleKey]);

  // Click-outside to close
  useEffect(() => {
    if (!focused) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [focused]);

  return (
    <div ref={containerRef} style={{ marginBottom: 4 }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "0.375rem",
          }}
        >
          {label}
        </label>
      )}

      {/* ── Tap target: 8 dot indicators ── */}
      <div
        onClick={() => setFocused(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFocused(true); }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          background: focused ? "#fff" : "#f8fafc",
          border: "1.5px solid " + (error ? "#ef4444" : focused ? PRIMARY : "#e2e8f0"),
          borderRadius: 12,
          cursor: "pointer",
          userSelect: "none",
          transition: "border-color 0.15s, background 0.15s",
          outline: "none",
        }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: i < value.length ? PRIMARY : "transparent",
              border: "2px solid " + (i < value.length ? PRIMARY : "#cbd5e1"),
              flexShrink: 0,
              transition: "background 0.12s, border-color 0.12s",
            }}
          />
        ))}
      </div>

      {/* Hint text */}
      <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 5, marginBottom: 0, textAlign: "center" }}>
        {value.length === 0
          ? "Click to enter your PIN"
          : value.length < PIN_LENGTH
          ? value.length + " / " + PIN_LENGTH + " digits"
          : "\u2713 PIN complete"}
      </p>

      {/* ── Custom numeric keypad ── */}
      {focused && (
        <div
          style={{
            marginTop: 8,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 12,
            boxShadow: "0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)",
          }}
        >
          {ROWS.map((row, ri) => (
            <div
              key={ri}
              style={{ display: "flex", gap: 8, marginBottom: 8 }}
            >
              {row.map((key, ki) => (
                <KeyButton key={ki} keyVal={key} onPress={() => handleKey(key)} />
              ))}
            </div>
          ))}

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setFocused(false); }}
            onTouchStart={(e) => { e.preventDefault(); setFocused(false); }}
            style={{
              width: "100%",
              padding: "13px 0",
              background: PRIMARY,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: "0.88rem",
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            Done
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function KeyButton({ keyVal, onPress }) {
  const [hovered, setHovered] = useState(false);

  if (keyVal === "") {
    return <div style={{ flex: 1 }} />;
  }

  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        height: 58,
        border: "1.5px solid " + (hovered ? "#c7d2fe" : "#e2e8f0"),
        borderRadius: 10,
        background: hovered ? "#eff6ff" : "#f8fafc",
        fontSize: keyVal === "back" ? "1.15rem" : "1.3rem",
        fontWeight: keyVal === "back" ? 400 : 700,
        color: keyVal === "back" ? "#ef4444" : "#0f172a",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.1s, border-color 0.1s",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        backgroundColor: keyVal === "back" ? (hovered ? "#fee2e2" : "#fff1f2") : (hovered ? "#eff6ff" : "#f8fafc"),
        borderColor: keyVal === "back" ? (hovered ? "#fca5a5" : "#fecdd3") : (hovered ? "#c7d2fe" : "#e2e8f0"),
      }}
    >
      {keyVal === "back" ? "⌫" : keyVal}
    </button>
  );
}
