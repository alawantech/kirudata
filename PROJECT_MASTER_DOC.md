# Guchor Data — Project Master Documentation

> **Single source of truth for the entire project.**
> Any AI agent working on this project MUST read this file first.
> After completing any task that changes behavior, commands, routes, schema, or deployment — update this file.

---

## 0) Purpose of this file

This file is the single source of truth for:
- What the project is
- What we aim to build
- What is currently implemented
- How the codebase is structured
- How to run the app locally
- How to push changes to GitHub
- How to deploy changes to the VPS (PM2)
- The exact commands used
- How an AI coding agent must update this file whenever any relevant project detail changes

**AI-Agent Rule:** Any change made by an AI coding agent that affects any section below (commands, file locations, routes, environment variables, deployment steps, process manager config, app start/build behavior, or UI behavior) must be followed by an update to this file so the documentation stays accurate.
If behavior changes, add an "Update Log" entry and update the relevant "Currently Achieved" section(s).

---

## 1) High-level goal (What we want to achieve)

**GUCHOR DATA** is a multi-surface VTU (Virtual Top-Up) fintech platform where users buy airtime, data, cable TV, electricity, exam pins, bulk SMS, data cards, recharge cards, and convert airtime to cash.

### Platforms
| Platform | Tech Stack | Location |
|----------|-----------|----------|
| Web App | Next.js 16 (React) | `frontend/` |
| Mobile App | React Native (Expo) | `mobile/` |
| Backend API | Node.js + Express + Prisma | `backend/` |
| Admin Panel | Next.js (part of frontend) | `frontend/src/app/admin/` |

### Live URL
- **Production**: `https://guchordata.com`

---

## 2) Architecture

```
Browser/Mobile → Cloudflare (DDoS/WAF) → Nginx (SSL/Proxy)
  ├── /api/* → http://localhost:5000/api/v2/*  (Express backend)
  ├── /webhook/* → http://localhost:5000/webhook/*
  ├── /uploads/* → static files
  └── /* → http://localhost:3000  (Next.js frontend)
```

### PM2 Processes
| Name | Port | Start Command |
|------|------|---------------|
| `frontend` | 3000 | `next start` (in `frontend/`) |
| `guchor-backend` | 5000 | `node server.js` (in `backend/`) |

---

## 3) Repository structure

### Backend (`backend/`)
- `server.js` — starts Express server
- `ecosystem.config.js` — PM2 config (unused, manual PM2 used)
- `src/app.js` — Express app wiring, middleware, routes
- `src/routes/` — All API route definitions
- `src/controllers/` — Route handlers (business logic)
- `src/middleware/` — Auth, rate limiting
- `src/services/` — External service integrations (MailerSend, mySubwallet, session, audit)
- `src/utils/` — Utilities (token blacklist, etc.)
- `prisma/schema.prisma` — Database schema

### Frontend (`frontend/`)
- `src/app/` — Next.js App Router pages
  - `home/` — Landing page
  - `(auth)/login/`, `(auth)/register/` — Auth flows
  - `(dashboard)/dashboard/` — User dashboard + all service pages
  - `admin/` — Admin panel (29+ pages)
- `src/components/` — Shared UI components (NumericPasswordInput, NumericPinInput, AppLogo, etc.)
- `src/context/` — React contexts (AuthContext, AdminContext, SiteSettingsContext)
- `src/lib/api.js` — Axios instance (baseURL, withCredentials)

### Mobile (`mobile/`)
- `src/screens/` — All screens (auth, services, profile, home)
- `src/navigation/` — AppNavigator with floating WhatsApp button
- `src/api/client.js` — Axios client
- `app.json` — Expo config
- `assets/` — Icons, splash images (compressed)

---

## 4) What has been achieved (Complete checklist)

### User Authentication
- [x] 3-step registration (details → password → confirm password)
- [x] 2-step login (email/phone → password) with custom numeric keyboard
- [x] Device recognition via browser fingerprint (SHA-256)
- [x] OTP email on unrecognized device (6-digit, 10min expiry, 90s cooldown)
- [x] Forgot password: email → OTP → set new password → auto-login
- [x] Forgot PIN: logged in → OTP → set new PIN
- [x] Forced PIN setup after registration (unskippable ForcedPinModal)
- [x] Logout clears all recognized devices → forces OTP on next login
- [x] Email masking in OTP dialogs (first 3 + *** + last 3)
- [x] WhatsApp floating button on all authenticated screens

### Services (mySubwallet API)
- [x] Data (VTU) — 4 networks, dynamic filtering
- [x] Airtime — 4 networks, dynamic filtering
- [x] Cable TV — 23 plans (GOTV/DSTV/Startimes), IUC verification
- [x] Electricity — 12 DISCOs, meter verification, min ₦1,000
- [x] Exam/Result Checker — WAEC/NECO/NABTEB, pin+serial display
- [x] Bulk SMS — User-provided sender name, comma-separated numbers, bulk pricing
- [x] Data Card — User-provided card name, dynamic networks
- [x] Recharge Card — User-provided card name, dynamic networks
- [x] Airtime to Cash — 4-step manual flow, admin verification, WhatsApp contact with dynamic message

### Admin Panel
- [x] Secure auth: email/password → mandatory OTP on EVERY login
- [x] httpOnly cookies (30-min access + 7-day refresh, rotated)
- [x] Session binding (SHA-256 of IP+UA in JWT)
- [x] Admin management: super admin can CRUD other admins with 28 permission checkboxes
- [x] Change password: requires current password (no forgot password)
- [x] Active sessions page: view/revoke all devices
- [x] Audit logs: all admin actions recorded
- [x] Login notifications: email on new device
- [x] CSP/HSTS/Frame protection headers via Helmet
- [x] All sections: Dashboard, Users, Transactions, Networks, Data Plans, Cable Plans, Electricity Providers, Exam Providers, API Configs, Settings, Blacklist, KYC, Upgrade Requests, Data Card Plans, Recharge Card Plans, Airtime Discounts, Airtime to Cash, Manage Admins, Change Password, Active Sessions, Audit Logs

### Landing Page
- [x] Hero with animated counters, decorative orbs
- [x] Service showcase grid (11 services)
- [x] AI-generated hero background image
- [x] Store download buttons (placeholder links)
- [x] Terms & Privacy Policy linked from WelcomeScreen
- [x] Footer with 5-column grid

### Mobile App
- [x] 14 screens fixed for keyboard handling (KeyboardAvoidingView)
- [x] Android adjustResize in app.json
- [x] Icon padded for adaptive safe zone (55% of canvas)
- [x] Removed unused deps (react-native-vector-icons, eas-cli, expo-image-picker)
- [x] newArchEnabled: false for smaller APK
- [x] Hero image restored (white background, compressed)
- [x] Custom keyboards with no empty gaps (zero key fills remaining space)
- [x] WhatsApp contact support on login/register/welcome screens

### Server Hardening
- [x] Fail2Ban (SSH jail: 3 retries → 24h ban)
- [x] UFW firewall (SSH + Cloudflare IPs for 80/443)
- [x] SSH key-only auth (no root password)
- [x] Ports bound to localhost (Nginx reverse proxy)
- [x] Deploy user with passwordless sudo
- [x] Global rate limiter (1000/15min)

### Cloudflare
- [x] Free plan, SSL Full
- [x] 5 WAF rules (skip admin routes, bot filtering)
- [x] DNS A record → 162.35.162.189

---

## 5) Authentication System (Detailed)

### User Authentication
- Token: `auth_token` in httpOnly cookie (web) or Bearer header (mobile)
- Device fingerprint: SHA-256 of navigator attributes (not IP, not biometric)
- OTP: 6-digit code, expires 10 min, resend cooldown 90 sec, max 5 attempts
- After registration: device is recognized → no OTP on next login
- After logout: ALL devices cleared → forces OTP on next login

### Admin Authentication
- **Access Token**: `admin_token` cookie, httpOnly/Secure/SameSite=Lax, 30-minute expiry
- **Refresh Token**: `admin_refresh` cookie, httpOnly/Secure/SameSite=Lax, 7-day expiry
- **Session Binding**: SHA-256(IP + User-Agent) embedded in JWT, checked on every request
- **OTP on Every Login**: No device recognition for admins
- **Password Change**: Requires current password, revokes all other sessions
- **No Forgot Password for Admins**

### Admin Permissions (28 total)
`dashboard_view`, `users_view`, `users_edit`, `users_credit`, `users_debit`, `users_reset_pin`, `users_reset_password`, `transactions_view`, `transactions_edit`, `notifications_manage`, `issues_manage`, `messages_manage`, `networks_manage`, `data_plans_manage`, `provider_data_plans_manage`, `data_card_plans_manage`, `recharge_card_plans_manage`, `cable_plans_manage`, `electricity_manage`, `exam_providers_manage`, `airtime_discounts_manage`, `airtime_to_cash_manage`, `api_configs_manage`, `api_links_manage`, `settings_manage`, `blacklist_manage`, `upgrade_requests_manage`, `kyc_manage`, `admin_manage`

### Super Admin
- **Email**: `guchordata90@gmail.com`
- **Password**: `Admin@12345`
- **Role**: `super_admin` (bypasses all permission checks)

---

## 6) Database

### Connection
- **Host**: `localhost:5432`
- **Database**: `guchor_monie`
- **User**: `guchor_user`
- **Password**: `GuchorDB2026Secure`

### Schema Location
`backend/prisma/schema.prisma`

### Push Schema to DB
```bash
ssh root@162.35.162.189 "cd /var/www/guchor-monie/backend && npx prisma db push --skip-generate && npx prisma generate"
```

### Key Models
| Model | Purpose |
|-------|---------|
| `User` | Platform users (customers) |
| `Admin` | Admin panel users with roles and permissions |
| `AdminSession` | Active admin sessions (refresh tokens, IP, fingerprint) |
| `AdminAuditLog` | All admin actions (login, logout, CRUD, etc.) |
| `Transaction` | All purchase transactions |
| `Network` | Network settings (MTN, Airtel, Glo, 9mobile) |
| `DataPlan` | Data bundle plans |
| `CableProvider` / `CablePlan` | Cable TV providers and plans |
| `ElectricityProvider` | Electricity distribution companies |
| `ExamProvider` | Exam/result checker providers (WAEC, NECO, NABTEB) |
| `DataCardPlan` / `RechargeCardPlan` | Data/recharge card plans |
| `AirtimeToCash` | Airtime-to-cash conversion requests |
| `SiteSetting` | All platform settings (single row) |
| `EmailOtp` | Email OTPs for user password/PIN reset |
| `RecognizedDevice` | User device fingerprints (skip OTP on known devices) |
| `ApiConfig` / `ApiLink` | API provider configurations |

---

## 7) Key Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://guchor_user:GuchorDB2026Secure@localhost:5432/guchor_monie
JWT_SECRET=<secret>
MAILERSEND_API_KEY=<key>
MAILERSEND_FROM_EMAIL=noreply@guchordata.com
ADMIN_REFRESH_SECRET=<secret>
COOKIE_SECRET=<secret>
FRONTEND_URL=https://guchordata.com
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=https://guchordata.com/api
```

---

## 8) Deployment

### Server
- **IP**: `162.35.162.189`
- **SSH**: `ssh root@162.35.162.189`
- **App Directory**: `/var/www/guchor-monie`
- **Deploy User**: `deploy` (passwordless sudo)

### Deploy Commands

**Full deploy (backend + frontend + schema):**
```bash
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && cd backend && npx prisma db push --skip-generate && npx prisma generate && cd ../frontend && npm run build && pm2 restart frontend && pm2 restart guchor-backend"
```

**Backend only (no schema change):**
```bash
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && pm2 restart guchor-backend"
```

**Frontend only:**
```bash
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && cd frontend && npm run build && pm2 restart frontend"
```

**After schema change:**
```bash
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && cd backend && npx prisma db push --skip-generate && npx prisma generate && cd ../frontend && npm run build && pm2 restart frontend && pm2 restart guchor-backend"
```

### **CRITICAL: Frontend requires `npm run build`**
The frontend runs `next start` (production build). Every frontend change MUST:
1. `git pull`
2. `cd frontend && npm run build`
3. `pm2 restart frontend`

Backend changes only need `pm2 restart guchor-backend` (plain Node.js).

### Nginx Config
```nginx
location /api/ {
    proxy_pass http://localhost:5000/api/v2/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Cookie $http_cookie;
    proxy_cookie_path / /;
    proxy_read_timeout 60s;
}
```

---

## 9) Git Workflow

### Branch Strategy
- `main` — production branch, directly deployed to VPS

### Commit Convention
```
feat: <description>    — new feature
fix: <description>     — bug fix
chore: <description>   — maintenance
```

### Standard Workflow
```bash
git add -A
git commit -m "feat: description"
git push origin main
# Then deploy to server
```

---

## 10) Third-Party Services

### mySubwallet API
- **Base URL**: `https://api.mysubwallet.ng/api/`
- **Auth**: POST Basic auth (`guchordata:4632Je#@!$`) → `AccessToken` → `Token ${AccessToken}`
- **Data format**: Auth token in header, string `plan_type` for data/recharge cards
- **API Key (Base64)**: `Z3dhcnpvZGF0YTo0NjMySmVAIyQ=`

### MailerSend
- **API**: `https://api.mailersend.com/v1/email`
- **From**: `noreply@guchordata.com`
- **Purpose**: OTP emails (login, password reset, PIN reset, login notifications)

### Cloudflare
- **Plan**: Free
- **SSL**: Full
- **WAF**: 5 rules (skip admin routes, bot filtering)
- **DNS**: A record → `162.35.162.189`

### Monnify
- **Purpose**: Dedicated virtual accounts for wallet funding
- **Status**: Optional (BVN/NIN)

---

## 11) Known Issues & Limitations

| Issue | Status | Notes |
|-------|--------|-------|
| mySubwallet recharge card | ⚠️ | Provider-side "MTN Recharge Card is currently unavailable" |
| APK size | ⚠️ | ~55MB after removing unused deps |
| Cloudflare WAF | ⚠️ | PUT/DELETE/PATCH methods required manual WAF rule configuration |

---

## 12) Key Service Details

### Cable TV
- **Verification**: GET `.../cable/cable-validation?iuc=...&cable=1`
- **Cable Map**: GOTV=1, DSTV=2, STARTIMES=3
- **23 plans**: GOTV (smallie→supa-plus), DSTV (padi→asian-addon), Startimes (nova/basic/smart/classic/super)
- **Pricing**: `buyingPrice` = what user pays; flat platform fee added from SiteSetting `cableFee`

### Electricity
- **Verification**: GET `.../bill/bill-validation?meter_number=...&disco=1&meter_type=...`
- **DISCO Map** (12 entries): ikeja=1, eko=2, kano=3, ph=4, jos=5, ibadan=6, kaduna=7, abuja=8, benin=9, enugu=10, aba=11, yola=12
- **Minimum**: ₦1,000 (mySubwallet rejects below that)
- **Pricing**: flat platform fee from SiteSetting `electricityFee`

### Exam/Result Checker
- **API**: POST `.../exam` with `{ exam, quantity, "request-id" }`
- **Response**: `{ status, pin: "pin<=>serial" }` — parsed into `{ pin, serial }` objects
- **Providers**: WAEC (5350/5000), NECO (2200/2000), NABTEB (1000/900)

### Bulk SMS
- **API**: POST `.../bulksms` with `{ sender, number, message, "request-id" }`
- **Sender name**: User-provided (not admin-configured)
- **Numbers**: Comma-separated, max 10,000
- **Cost**: price × count

### Airtime to Cash
- **Manual process**: user transfers airtime → admin verifies → credits wallet
- **Networks**: Only MTN and Airtel supported
- **Phone validation**: Detects all 4 Nigerian networks, rejects Glo/9Mobile
- **Config**: Stored in `site_settings` (atcEnabled, atcRate, atcMtnNumber, atcAirtelNumber, atcMinAmount, atcMaxAmount)
- **Step 4**: Step-by-step guide → copy number → "Mark as Transferred" → WhatsApp contact with dynamic message

---

## 13) Nigerian Phone Prefixes
- **MTN**: 0803,0806,0816,0903,0906,0810,0813,0908,0916,0814,0703,0706,0913
- **AIRTEL**: 0802,0808,0812,0708,0701,0907,0901
- **GLO**: 0805,0807,0811,0815,0905,0705,0819
- **9MOBILE**: 0809,0817,0818,0909

---

## 14) Documentation Update Policy (MOST IMPORTANT)

An AI coding agent MUST update this file when any of the following changes:
1. **Commands**: build/start/deploy commands change or new steps are required.
2. **Paths**: ecosystem config location, project directories, VPS directories change.
3. **Process manager**: PM2 app list changes, instances/modes change, or new ecosystem entries added.
4. **Routes/Flows**: new pages or steps added to auth flows.
5. **API Endpoints**: new endpoints added or existing ones modified.
6. **Schema**: database model changes.
7. **Security**: auth system, middleware, or security features change.
8. **Environment variables**: `.env` keys required for production change.
9. **Project structure**: file moves/renames that another agent needs.
10. **Known Issues**: new issues discovered or old ones resolved.

#### When to update
- Immediately after merging code changes (or at end of the task in a single cohesive update).
- If uncertainty exists, update a "Work In Progress / Pending Verification" section, then reconcile after verification.

#### How to update
- Add a concise entry in **Update Log** (Section 15)
- Update the relevant sections above with the corrected info

---

## 15) Update Log (append-only)

| Date | Change | Sections Updated |
|------|--------|-----------------|
| 2026-06-13 | Initial numeric keyboard + auto-submit + deployment verification | §14 |
| 2026-06-14 | Full rewrite: VTU platform, all services, admin panel, security, mobile | All |
| 2026-06-14 | Implemented httpOnly cookies, refresh rotation, session binding, audit logs | §5, §8 |
| 2026-06-14 | Added CSP/HSTS/Frame protection headers | §8 |
| 2026-06-14 | Fixed admin session creation (unique token bug) | §5, §11 |
| 2026-06-15 | Created AGENTS.md alongside this file | §14 |
| 2026-06-15 | Fixed admin token refresh: added adminApi.js with 401 interceptor, all 26 admin pages now use adminApi | §5, §11 |

*(This file should be kept accurate; treat it as production-grade documentation.)*
