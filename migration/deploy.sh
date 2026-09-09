#!/usr/bin/env bash
# ============================================================
# Deploy Script — Guchor Data
# Run on VPS: bash deploy.sh [full|backend|frontend|schema]
# ============================================================
set -euo pipefail

APP_DIR="/var/www/guchor-monie"
MODE="${1:-full}"

cd "$APP_DIR"

echo "=== Guchor Data — Deploy ($MODE) ==="
echo "Pulling latest code..."
git pull origin main

case "$MODE" in
  full)
    echo "Running full deploy (backend + frontend)..."
    cd backend
    npx prisma db push --skip-generate && npx prisma generate
    cd ../frontend
    npm run build
    cd ..
    pm2 restart frontend
    pm2 restart guchor-backend
    ;;

  backend)
    echo "Restarting backend only..."
    pm2 restart guchor-backend
    ;;

  frontend)
    echo "Rebuilding frontend..."
    cd frontend
    npm run build
    cd ..
    pm2 restart frontend
    ;;

  schema)
    echo "Pushing schema changes + rebuilding frontend..."
    cd backend
    npx prisma db push --skip-generate && npx prisma generate
    cd ../frontend
    npm run build
    cd ..
    pm2 restart frontend
    pm2 restart guchor-backend
    ;;

  *)
    echo "Unknown mode: $MODE"
    echo "Usage: bash deploy.sh [full|backend|frontend|schema]"
    exit 1
    ;;
esac

echo ""
echo "=== Deploy Complete ==="
pm2 list
