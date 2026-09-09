import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)",
        fontFamily: "Inter, sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "1.5rem",
          padding: "3rem 2.5rem",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            fontSize: "5rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #2563eb, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
            marginBottom: "1rem",
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: ".5rem",
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: ".95rem",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".5rem",
            padding: ".875rem 2rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "white",
            fontWeight: 700,
            fontSize: ".95rem",
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
