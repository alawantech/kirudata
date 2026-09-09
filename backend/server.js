require("dotenv").config();
const app = require("./src/app");
const prisma = require("./src/config/prisma");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[Server] GUCHOR DATA V2 backend running on port ${PORT} (${process.env.NODE_ENV})`,
  );
});

// ---------------------------------------------------------
// Graceful shutdown
// PM2 sends SIGTERM before restarting. Without this, in-flight requests
// (e.g. a purchase mid-API-call) are brutally killed and the user's money
// could be deducted with no API call made. We allow up to 10 s to drain.
// ---------------------------------------------------------
function gracefulShutdown(signal) {
  console.log(`[Server] ${signal} received — draining connections...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("[Server] All connections closed. Exiting.");
    process.exit(0);
  });
  // Force-exit after 10 s if some requests are still hanging
  setTimeout(() => {
    console.error("[Server] Forced exit after 10 s timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
