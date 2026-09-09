// Must be required before any route or middleware definitions so that
// rejected promises in async route handlers propagate to the global
// error handler instead of crashing the process (Express 4 does not
// do this automatically).
require("express-async-errors");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const authRoutes = require("./routes/auth.routes");
const otpRoutes = require("./routes/otp.routes");
const userRoutes = require("./routes/user.routes");
const airtimeRoutes = require("./routes/airtime.routes");
const dataRoutes = require("./routes/data.routes");
const cableRoutes = require("./routes/cable.routes");
const electricityRoutes = require("./routes/electricity.routes");
const examRoutes = require("./routes/exam.routes");
const smsRoutes = require("./routes/sms.routes");
const datacardRoutes = require("./routes/datacard.routes");
const rechargecardRoutes = require("./routes/rechargecard.routes");
const adminRoutes = require("./routes/admin.routes");
const adminAuthRoutes = require("./routes/adminAuth.routes");
const contactRoutes = require("./routes/contact.routes");
const forgotRoutes = require("./routes/forgot.routes");
const webhookRoutes = require("./routes/webhook.routes");
const publicRoutes = require("./routes/public.routes");
const airtimeToCashRoutes = require("./routes/airtimeToCash.routes");

const path = require("path");

const app = express();

// Disable ETag to prevent 304 Not Modified responses on mobile
app.set("etag", false);

// ---------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------
// Trust the first proxy (Nginx). Without this, every request appears to
// come from 127.0.0.1 when behind Nginx, meaning ALL users share one
// rate-limit bucket and req.ip is always the proxy, not the real client.
app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.mailersend.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Global rate limiter — 1000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", msg: "Too many requests, please slow down." },
});
app.use(globalLimiter);

// ---------------------------------------------------------
// Body Parsing & Compression
// ---------------------------------------------------------
// Gzip-compress all JSON/text responses — reduces response size by ~70%
// on mobile connections. Nginx can also do this; if it does, this is a no-op.
app.use(compression());

// Webhooks must capture raw body BEFORE any JSON parsing
app.use("/webhook", webhookRoutes);

// Serve uploaded logo/favicon as static files
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Prevent Cloudflare from caching API responses
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------
// Routes
// ---------------------------------------------------------
app.use("/api/v2/auth", authRoutes);
app.use("/api/v2/auth/otp", otpRoutes);
app.use("/api/v2/auth/forgot", forgotRoutes);
app.use("/api/v2/user", userRoutes);
app.use("/api/v2/airtime", airtimeRoutes);
app.use("/api/v2/data", dataRoutes);
app.use("/api/v2/cable", cableRoutes);
app.use("/api/v2/electricity", electricityRoutes);
app.use("/api/v2/exam", examRoutes);
app.use("/api/v2/sms", smsRoutes);
app.use("/api/v2/data-card", datacardRoutes);
app.use("/api/v2/recharge-card", rechargecardRoutes);
app.use("/api/v2/airtime-to-cash", airtimeToCashRoutes);
app.use("/api/v2/admin/auth", adminAuthRoutes);
app.use("/api/v2/admin", adminRoutes);
app.use("/api/v2/contact", contactRoutes);
// Public (no auth) — site settings for frontend
app.use("/api/v2/public", publicRoutes);

// Health check
app.get("/api/v2/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ status: "error", msg: "Route not found." });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    msg: statusCode === 500 ? "Internal server error." : err.message,
  });
});

module.exports = app;
