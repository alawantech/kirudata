/**
 * PM2 Ecosystem Config — Production
 *
 * Usage on VPS:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save          ← persist across reboots
 *   pm2 startup       ← auto-start on system boot
 *
 * IMPORTANT — Single instance (instances: 1):
 *   Rate limiting and the token blacklist use in-memory state.
 *   Running multiple processes (cluster mode) would give each process
 *   its own counter, effectively multiplying your rate limits by the
 *   number of cores. Keep instances: 1 unless you add Redis.
 */
module.exports = {
  apps: [
    {
      name: "guchor-backend",
      script: "server.js",
      cwd: "/var/www/guchor-monie/backend", // ← change to your VPS path
      instances: 1,
      exec_mode: "fork",

      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // Restart if RAM usage exceeds 500 MB
      max_memory_restart: "500M",

      // Logging
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Give SIGTERM handler 12 s to drain (server.js allows 10 s)
      kill_timeout: 12000,

      // Crash recovery
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: "5s",
    },
  ],
};
