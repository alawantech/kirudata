#!/usr/bin/env bash
# ============================================================
# Fresh Server Setup — Guchor Data (InterServer)
# Run on: Ubuntu 22.04 / Debian 12
# Usage:   bash setup-new-server.sh
# ============================================================
set -euo pipefail

# ─── CONFIG ──────────────────────────────────────────────────
DB_NAME="guchor_data"
DB_USER="guchor_user"
DB_PASS="CHANGE_ME_TO_A_STRONG_PASSWORD"
APP_DIR="/var/www/guchor-monie"
APP_DOMAIN="guchordata.com"
ADMIN_EMAIL="your-email@gmail.com"
# ─────────────────────────────────────────────────────────────

echo "=== Guchor Data — Server Setup ==="

# 1. System updates
apt update && apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Install PostgreSQL 16
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# 4. Create database user and database
sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# 5. Install Nginx
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# 6. Install PM2 globally
npm install -g pm2

# 7. Install Git
apt install -y git

# 8. Install Certbot
apt install -y certbot python3-certbot-nginx

# 9. Install Fail2Ban
apt install -y fail2ban
systemctl enable fail2ban

# 10. Setup UFW firewall
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Allow Cloudflare IPs (important!)
ufw allow from 173.245.48.0/20 to any port 80
ufw allow from 103.21.244.0/22 to any port 80
ufw allow from 103.22.200.0/22 to any port 80
ufw allow from 103.31.4.0/22 to any port 80
ufw allow from 141.101.64.0/18 to any port 80
ufw allow from 108.162.192.0/18 to any port 80
ufw allow from 190.93.240.0/20 to any port 80
ufw allow from 188.114.96.0/20 to any port 80
ufw allow from 197.234.240.0/22 to any port 80
ufw allow from 198.41.128.0/17 to any port 80
ufw allow from 162.158.0.0/15 to any port 80
ufw allow from 104.16.0.0/13 to any port 80
ufw allow from 104.24.0.0/14 to any port 80
ufw allow from 172.64.0.0/13 to any port 80
ufw allow from 131.0.72.0/22 to any port 80
# HTTPS
ufw allow from 173.245.48.0/20 to any port 443
ufw allow from 103.21.244.0/22 to any port 443
ufw allow from 103.22.200.0/22 to any port 443
ufw allow from 103.31.4.0/22 to any port 443
ufw allow from 141.101.64.0/18 to any port 443
ufw allow from 108.162.192.0/18 to any port 443
ufw allow from 190.93.240.0/20 to any port 443
ufw allow from 188.114.96.0/20 to any port 443
ufw allow from 197.234.240.0/22 to any port 443
ufw allow from 198.41.128.0/17 to any port 443
ufw allow from 162.158.0.0/15 to any port 443
ufw allow from 104.16.0.0/13 to any port 443
ufw allow from 104.24.0.0/14 to any port 443
ufw allow from 172.64.0.0/13 to any port 443
ufw allow from 131.0.72.0/22 to any port 443
ufw --force enable

# 11. Create app directory
mkdir -p ${APP_DIR}
cd ${APP_DIR}

# 12. Clone the repo
git clone https://github.com/alawantech/guchor-monie.git .

# 13. Install backend dependencies
cd backend
npm install

# 14. Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# 15. Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
pm2 save

# 16. Generate SSL self-signed cert (for Cloudflare Full mode)
mkdir -p /etc/ssl/private /etc/ssl/certs
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/guchor-selfsigned.key \
  -out /etc/ssl/certs/guchor-selfsigned.crt \
  -subj "/CN=${APP_DOMAIN}"

# 17. Create nginx config
cat > /etc/nginx/sites-available/guchor << 'NGINX_EOF'
server {
    server_name guchordata.com www.guchordata.com;
    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://localhost:5000/api/v2/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        proxy_cookie_path / /;
        proxy_read_timeout 60s;
    }

    location /webhook/ {
        proxy_pass http://localhost:5000/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    location /uploads/ {
        alias /var/www/guchor-monie/backend/public/uploads/;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/guchor-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/guchor-selfsigned.key;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.guchordata.com) {
        return 301 https://$host$request_uri;
    }
    if ($host = guchordata.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name guchordata.com www.guchordata.com;
    return 404;
}
NGINX_EOF

# 18. Enable nginx site
ln -sf /etc/nginx/sites-available/guchor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Edit backend/.env: nano /var/www/guchor-monie/backend/.env"
echo "  2. Run: cd /var/www/guchor-monie/backend && npx prisma db push --skip-generate && npx prisma generate"
echo "  3. Run: cd /var/www/guchor-monie && pm2 start ecosystem.config.js --env production"
echo "  4. Run: pm2 save"
echo "  5. Cloudflare DNS A record: guchordata.com → 162.35.162.189"
echo "  6. Cloudflare SSL/TLS → Full (not Flexible)"
