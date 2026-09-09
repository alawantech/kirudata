#!/usr/bin/env bash
# ============================================================
# Final Setup — Guchor Data (SSL + Nginx)
# Run after DNS is pointing to this server
# Usage:   bash final-setup.sh
# ============================================================
set -euo pipefail

echo "=== Guchor Data — Final Setup ==="

# 1. Generate self-signed cert (for Cloudflare Full mode)
echo "Generating SSL certificate..."
mkdir -p /etc/ssl/private /etc/ssl/certs
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/guchor-selfsigned.key \
  -out /etc/ssl/certs/guchor-selfsigned.crt \
  -subj "/CN=guchordata.com" 2>/dev/null || echo "SSL cert already exists, skipping."

# 2. Setup nginx
echo "Configuring nginx..."
cp /var/www/guchor-monie/migration/nginx-guchor /etc/nginx/sites-available/guchor

# Enable site
ln -sf /etc/nginx/sites-available/guchor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx

# 3. Push schema + generate Prisma client
echo "Pushing database schema..."
cd /var/www/guchor-monie/backend
npx prisma db push --skip-generate && npx prisma generate

# 4. Build frontend
echo "Building frontend..."
cd /var/www/guchor-monie/frontend
npm run build

# 5. Create super admin (interactive)
echo ""
echo "Creating super admin..."
cd /var/www/guchor-monie/backend
node scripts/create-admin.js

# 6. Start PM2 processes
echo "Starting PM2 processes..."
cd /var/www/guchor-monie
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "=== Setup Complete ==="
echo "Check: pm2 list"
echo "Check: curl -I http://localhost:5000/api/v2/public/settings"
echo "Check: curl -I https://guchordata.com"
echo ""
echo "Cloudflare setup:"
echo "  1. Add A record: guchordata.com → 162.35.162.189 (DNS only, gray cloud)"
echo "  2. SSL/TLS → Overview → Full (not Flexible)"
echo "  3. SSL/TLS → Edge Certificates → Always Use HTTPS = ON"
echo "  4. Speed → Caching → Standard (or custom rules)"
