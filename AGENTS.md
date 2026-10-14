# AGENTS.md — Guchor Data Platform

> **Single source of truth for the entire project.**
> Any AI agent working on this project MUST read this file first.
> After completing any task that changes behavior, commands, routes, schema, or deployment — update this file.

---

## 1. Project Overview

**Guchor Data** is a VTU (Virtual Top-Up) fintech platform where users buy airtime, data, cable TV, electricity, exam pins, bulk SMS, data cards, recharge cards, and convert airtime to cash.

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

## 2. Architecture

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

### Key Environment Variables (Backend `.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Auth JWT secret
- `MAILERSEND_API_KEY` — Email service API key
- `MAILERSEND_FROM_EMAIL` — Sender email (`noreply@guchordata.com`)
- `ADMIN_REFRESH_SECRET` — Refresh token JWT secret (falls back to `JWT_SECRET + "-refresh"`)
- `COOKIE_SECRET` — Cookie parser secret
- `FRONTEND_URL` — CORS origin (`https://guchordata.com`)

### Key Environment Variables (Frontend `.env.local`)
- `NEXT_PUBLIC_API_URL` — Backend API URL (`https://guchordata.com/api`)

---

## 3. Database

### Connection
- **Host**: `localhost:5432`
- **Database**: `guchor_data`
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
| `RecognizedDevice` | User device fingerprints (skip OTP on recognized devices) |
| `ApiConfig` / `ApiLink` | API provider configurations |

---

## 4. API Endpoints

### Base URL
All backend routes are mounted under `/api/v2/`. Nginx maps `/api/` → `/api/v2/`.

### Auth Routes (`/api/v2/auth/`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/phone + password |
| GET | `/me` | Get current user (requires auth) |
| POST | `/logout` | Logout (clears recognized devices) |

### OTP Routes (`/api/v2/auth/otp/`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/verify` | Verify OTP for new device login |
| POST | `/resend` | Resend OTP |

### Forgot Routes (`/api/v2/auth/forgot/`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/password/request` | Request password reset OTP |
| POST | `/password/verify` | Verify OTP + set new password |
| POST | `/pin/request` | Request PIN reset OTP (logged in) |
| POST | `/pin/verify` | Verify OTP + set new PIN |

### User Routes (`/api/v2/user/`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/me` | Get user profile |
| PUT | `/me` | Update profile |
| POST | `/change-password` | Change password |
| POST | `/change-pin` | Change transaction PIN |
| POST | `/fund-wallet` | Fund wallet (manual) |
| GET | `/transactions` | Transaction history |
| GET | `/notifications` | User notifications |

### Service Routes
| Prefix | Purpose | mySubwallet Endpoint |
|--------|---------|---------------------|
| `/api/v2/airtime/` | Buy airtime | `/api/airtime` |
| `/api/v2/data/` | Buy data | `/api/data` |
| `/api/v2/cable/` | Cable TV | `/api/cable` |
| `/api/v2/electricity/` | Electricity | `/api/bill` |
| `/api/v2/exam/` | Result checker | `/api/exam` |
| `/api/v2/sms/` | Bulk SMS | `/api/bulksms` |
| `/api/v2/data-card/` | Data cards | `/api/data_card` |
| `/api/v2/recharge-card/` | Recharge cards | `/api/recharge_card` |
| `/api/v2/airtime-to-cash/` | Airtime to cash | Manual process |

### Airtime to Cash Routes (`/api/v2/airtime-to-cash/`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/config` | Get ATC settings (numbers, rate, limits) |
| POST | `/submit` | Submit ATC request |
| GET | `/history` | Get user's ATC history |

### Admin Auth Routes (`/api/v2/admin/auth/`)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/login` | No | Step 1: email/password → sends OTP |
| POST | `/verify-otp` | No | Step 2: verify OTP → sets cookies |
| POST | `/resend-otp` | No | Resend OTP |
| POST | `/refresh` | Cookie | Rotate access token |
| GET | `/me` | Cookie | Get current admin |
| POST | `/logout` | Cookie | Logout + revoke session |
| POST | `/change-password` | Cookie | Change password (requires current) |
| GET | `/sessions` | Cookie | List active sessions |
| DELETE | `/sessions/:id` | Cookie | Revoke a session |
| GET | `/audit-logs` | Cookie | View audit trail |
| GET | `/admins` | Cookie | List all admins (super_admin) |
| POST | `/admins` | Cookie | Create admin (super_admin) |
| PUT | `/admins/:id` | Cookie | Update admin (super_admin) |
| DELETE | `/admins/:id` | Cookie | Delete admin (super_super) |

### Old Admin Routes (`/api/v2/admin/`)
These use `protectAdmin` from `auth.js` (cookie or Bearer fallback).
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/stats` | Dashboard statistics |
| GET | `/users` | List users |
| PUT | `/users/:id` | Update user |
| GET | `/transactions` | All transactions |
| GET | `/networks` | Network settings |
| PUT | `/networks/:id` | Update network |
| ... | ... | Many more CRUD endpoints |

### Public Routes (`/api/v2/public/`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/settings` | Site settings (whatsapp, phone, fees, etc.) |

---

## 5. Authentication System

### User Authentication
- **Registration**: 3-step (details → password → confirm password) → redirect to dashboard → ForcedPinModal
- **Login**: 2-step (email/phone → password with custom keyboard)
- **Device Recognition**: Browser fingerprint (SHA-256 of navigator attributes). New device → OTP email
- **Logout**: Clears ALL recognized devices → forces OTP on next login
- **Forgot Password**: Email → OTP → set new password → auto-login
- **Forgot PIN**: Already logged in → OTP → set new PIN
- **OTP**: 6-digit, expires 10 min, resend cooldown 90 sec, max 5 attempts per code
- **Token**: `auth_token` in httpOnly cookie (regular users) or Bearer header (mobile)

### Admin Authentication
- **Login Flow**: email/password → OTP email → verify OTP → two httpOnly cookies set
- **Access Token**: `admin_token` cookie, 30-minute expiry, contains IP+UA fingerprint
- **Refresh Token**: `admin_refresh` cookie, 7-day expiry, rotated on each refresh
- **Session Binding**: SHA-256 hash of IP + User-Agent embedded in JWT. If IP/UA changes mid-session → 401
- **Session Management**: Admin can view/revoke all active sessions at `/admin/sessions`
- **Audit Logging**: Every admin action logged to `admin_audit_logs` table
- **Login Notifications**: Email sent when admin logs in from new device
- **OTP on Every Login**: No device recognition for admins — always requires OTP
- **Password Change**: Requires current password, revokes all other sessions
- **No Forgot Password for Admins**

### Admin Permissions (28 total)
`dashboard_view`, `users_view`, `users_edit`, `users_credit`, `users_debit`, `users_reset_pin`, `users_reset_password`, `transactions_view`, `transactions_edit`, `notifications_manage`, `issues_manage`, `messages_manage`, `networks_manage`, `data_plans_manage`, `provider_data_plans_manage`, `data_card_plans_manage`, `recharge_card_plans_manage`, `cable_plans_manage`, `electricity_manage`, `exam_providers_manage`, `airtime_discounts_manage`, `airtime_to_cash_manage`, `api_configs_manage`, `api_links_manage`, `settings_manage`, `blacklist_manage`, `upgrade_requests_manage`, `kyc_manage`, `admin_manage`

### Super Admin
- **Email**: `guchordata90@gmail.com`
- **Password**: `Admin@12345`
- **Role**: `super_admin` (bypasses all permission checks)
- **Session Timeout**: 30 minutes

---

## 6. Frontend Pages

### Public Pages
| Path | Purpose |
|------|---------|
| `/home` | Landing page (hero, animated counters, services, footer) |
| `/login` | User login (2-step) |
| `/register` | User registration (3-step) |
| `/forgot-password` | Password reset flow |
| `/about` | About page |
| `/contact` | Contact page |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

### User Dashboard (`/dashboard/`)
| Path | Purpose |
|------|---------|
| `/dashboard` | Main dashboard with ForcedPinModal |
| `/dashboard/services` | All services grid |
| `/dashboard/airtime` | Buy airtime |
| `/dashboard/data` | Buy data |
| `/dashboard/cable` | Cable TV |
| `/dashboard/electricity` | Electricity |
| `/dashboard/exam` | Result checker |
| `/dashboard/sms` | Bulk SMS |
| `/dashboard/data-card` | Data cards |
| `/dashboard/recharge-card` | Recharge cards |
| `/dashboard/airtime-to-cash` | Airtime to cash |
| `/dashboard/fund-wallet` | Fund wallet |
| `/dashboard/transactions` | Transaction history |
| `/dashboard/notifications` | Notifications |
| `/dashboard/profile` | User profile |
| `/dashboard/change-password` | Change password |
| `/dashboard/change-pin` | Change PIN |
| `/dashboard/support` | Support/Issues |

### Admin Panel (`/admin/`)
| Path | Purpose |
|------|---------|
| `/admin/login` | Admin login (2-step with OTP) |
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/transactions` | Transaction management |
| `/admin/networks` | Network settings |
| `/admin/provider-data-plans` | Data plans |
| `/admin/data-card-plans` | Data card plans |
| `/admin/recharge-card-plans` | Recharge card plans |
| `/admin/cable-plans` | Cable TV plans |
| `/admin/electricity-providers` | Electricity providers |
| `/admin/exam-providers` | Exam providers |
| `/admin/airtime-discounts` | Airtime discounts |
| `/admin/airtime-to-cash` | ATC management |
| `/admin/api-links` | API providers |
| `/admin/api-configs` | API configurations |
| `/admin/blacklist` | Blacklist management |
| `/admin/admins` | Manage admins (super_admin only) |
| `/admin/sessions` | Active sessions |
| `/admin/audit-logs` | Audit trail |
| `/admin/change-password` | Change admin password |
| `/admin/settings` | Site settings |
| `/admin/notifications` | Notifications |
| `/admin/issues` | Support issues |
| `/admin/messages` | Contact messages |
| `/admin/upgrade-requests` | Upgrade requests |

---

## 7. Mobile App

### Key Screens
| Screen | Purpose |
|--------|---------|
| `WelcomeScreen` | First screen: 3-slide onboarding carousel (Welcome / We are Automated / Customer Support) with Get Started → Register + Login |
| `LoginScreen` | Email/phone → password (2-step) |
| `RegisterScreen` | Details → password → confirm (3-step) |
| `ForgotPasswordScreen` | Email → OTP → new password |
| `HomeScreen` | 4-column services grid |
| `DataScreen`, `AirtimeScreen`, etc. | Service screens |
| `CableScreen`, `ElectricityScreen` | Bill payment screens |
| `SmsScreen` | Bulk SMS with sender name, comma-separated numbers |
| `Airtime2CashScreen` | 4-step ATC flow with WhatsApp contact |
| `ExamScreen` | Result checker |
| `ChangePasswordScreen` | Password change |

### Mobile Configuration
- **app.json**: `adjustResize` soft input, `newArchEnabled: false`, black icon/splash
- **Icon**: Padded adaptive icon (logo at 55% of canvas)
- **WhatsApp**: Floating button on all authenticated screens
- **Keyboard**: `KeyboardAvoidingView` with `behavior="height"` on Android

---

## 8. Security Features

### Implemented
| Feature | Status | Details |
|---------|--------|---------|
| httpOnly cookies | ✅ | Admin tokens stored as httpOnly/Secure/SameSite=Lax cookies |
| Refresh token rotation | ✅ | 30-min access + 7-day refresh, rotated on each refresh |
| Session binding | ✅ | SHA-256(IP+UA) fingerprint in JWT, rejected if changed |
| CSP headers | ✅ | Strict Content-Security-Policy via Helmet |
| HSTS | ✅ | `maxAge: 31536000`, `includeSubDomains`, `preload` |
| Frame protection | ✅ | `X-Frame-Options: DENY` via Helmet |
| Audit logging | ✅ | All admin actions logged to `admin_audit_logs` |
| Login notifications | ✅ | Email when admin logs in from new device |
| Active session management | ✅ | View/revoke sessions at `/admin/sessions` |
| OTP brute-force protection | ✅ | Max 5 attempts per OTP code |
| Account enumeration prevention | ✅ | Generic error messages |
| Rate limiting | ✅ | Global (1000/15min) + auth-specific |
| Token blacklisting | ✅ | In-memory blacklist on logout |
| Device recognition (users) | ✅ | Fingerprint-based, skip OTP on known devices |

---

## 9. Third-Party Services

### mySubwallet API
- **Base URL**: `https://api.mysubwallet.ng/api/`
- **Auth**: POST Basic auth (`guchordata:4632Je#@!$`) → `AccessToken` → `Token ${AccessToken}`
- **Data format**: Auth token in header, string `plan_type` for data/recharge cards

### MailerSend
- **API**: `https://api.mailersend.com/v1/email`
- **From**: `noreply@guchordata.com`
- **Purpose**: OTP emails (login, password reset, PIN reset, login notifications)

### Cloudflare
- **Plan**: Free
- **SSL**: Full
- **WAF**: 5 rules (skip admin routes, bot filtering, etc.)
- **DNS**: A record → `162.35.162.189`

### Monnify
- **Purpose**: Dedicated virtual accounts for wallet funding (requires BVN/NIN)
- **Status**: Optional

### Aspfiy (PalmPay Reserved Accounts)
- **Purpose**: No-KYC virtual accounts at user registration
- **APIs**: `POST /reserve-paga/`, `POST /reserve-palmpay/`
- **Webhook URL**: `POST /webhook/aspfiy`
- **Admin Config**: API Key + Base URL in `/admin/api-configs` (Payment tab)
- **Status**: Active (fire-and-forget on registration, non-blocking)

---

## 10. Deployment

### Server
- **IP**: `162.35.162.189`
- **SSH**: `ssh root@162.35.162.189`
- **Provider**: InterServer
- **App Directory**: `/var/www/guchor-monie`
- **Deploy User**: `root`

### First-Time Server Setup
```bash
ssh root@162.35.162.189
bash /var/www/guchor-monie/migration/setup-new-server.sh
# Then edit .env: nano /var/www/guchor-monie/backend/.env
# Then run: bash /var/www/guchor-monie/migration/final-setup.sh
```

### Deploy Commands
```bash
# Full deploy (backend + frontend)
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && cd backend && npx prisma db push --skip-generate && npx prisma generate && cd ../frontend && npm run build && pm2 restart frontend && pm2 restart guchor-backend"

# Backend only (no frontend rebuild)
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && pm2 restart guchor-backend"

# Frontend only
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && cd frontend && npm run build && pm2 restart frontend"

# After schema changes
ssh root@162.35.162.189 "cd /var/www/guchor-monie && git pull && cd backend && npx prisma db push --skip-generate && npx prisma generate && cd ../frontend && npm run build && pm2 restart frontend && pm2 restart guchor-backend"
```

### **CRITICAL: Frontend requires `npm run build`**
The frontend runs `next start` (production build). Every frontend change MUST:
1. `git pull`
2. `cd frontend && npm run build`
3. `pm2 restart frontend`

Backend changes only need `pm2 restart guchor-backend` (plain Node.js).

### Mobile App — OTA Updates (EAS Update)
Published under Expo account/project `kiru-data` (project ID `ff5e6b07-f55a-4814-9db7-1446b013d7d6`, Android package `com.kirudata.app`). `expo-updates` is configured in `mobile/app.json` with `runtimeVersion.policy = "appVersion"` and `updates.url = https://u.expo.dev/<projectId>`. `mobile/eas.json` binds each profile to a channel: `development` / `preview` / `production`. Build auth for the `kiru-data` account is a session token (`EXPO_TOKEN`) — the default local CLI login may point at a different Expo account, so always export `EXPO_TOKEN` for Kiru commands.

**JS-only changes ship OTA** (no Play Store, no reinstall, no review):
```bash
cd mobile && EXPO_TOKEN=<kiru token> npx eas-cli update --channel preview --platform android --environment preview --message "<what changed>" --non-interactive
```

**Native changes need a fresh build** (new native deps, config plugins such as `withStartupSplash.js`, app icons, Expo SDK upgrades):
```bash
cd mobile && EXPO_TOKEN=<kiru token> npx eas-cli build --platform android --profile preview --non-interactive
```

**Rules**
- OTA only reaches installs whose `runtimeVersion` matches (currently `1.0.0`, derived from `appVersion`). Native changes require bumping `app.version` and shipping a new build — never OTA them.
- `--environment <name>` is mandatory when `--non-interactive` is set, and must match the channel.
- Publish to `preview` for directly-installed APKs and to `production` for Play Store releases — both channels already have a baseline update, so either works the moment a build exists for it.
- Never commit EAS tokens; pass them via env for the session only.

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

## 11. Git Workflow

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

## 12. Known Issues & Limitations

| Issue | Status | Notes |
|-------|--------|-------|
| mySubwallet recharge card | ⚠️ | Provider-side "MTN Recharge Card is currently unavailable" |
| APK size | ⚠️ | ~55MB after removing unused deps. Further reduction possible with asset optimization |
| Cloudflare WAF | ⚠️ | PUT/DELETE/PATCH methods required manual WAF rule configuration |

---

## 13. Update Log

| Date | Change | Sections Updated |
|------|--------|-----------------|
| 2026-06-14 | Created comprehensive AGENTS.md | All |
| 2026-06-14 | Fixed admin session creation (unique token bug) | §5, §12 |
| 2026-06-14 | Implemented httpOnly cookies, refresh rotation, session binding, audit logs, login notifications, active sessions | §5, §8 |
| 2026-06-14 | Added CSP/HSTS/Frame protection headers | §8 |
| 2026-06-15 | Fixed Bug 1 & 2: created `frontend/src/lib/adminApi.js` with Axios 401-refresh interceptor; all 26 admin pages now use `adminApi` instead of `api`; `AdminContext` updated to use `adminApi` | §5, §12 |
| 2026-06-15 | Fixed ReferenceError: api is not defined in admin pages by replacing remaining api references with adminApi | §4, §6, §13 |
| 2026-06-15 | Fixed admin session timeout by setting refresh token to strict 30 minutes, removing rotation race conditions, and relaxing fingerprinting to User-Agent only | §5, §8, §13 |
| 2026-06-18 | Migrated all provider data plans from guessed to correct planCodes based on 60 provider screenshots. Dorosub: 69 plans, MBC Data: 111 plans, First-sub: 106 plans. Total: 344 plans (was 258) | §3, §14 |
| 2026-06-19 | Added password show/hide eye icon to admin login, sort data plans by userPrice, create missing purchaseGuard.js, add no-cache headers for Cloudflare | §5, §6, §13 |
| 2026-06-24 | Migrated from Hostinger VPS to InterServer. Fixed all Dorosub SME buying prices (planCodes 1-6). Updated server IP to 68.168.218.173. Pulled latest code from GitHub to new server, rebuilt frontend, installed missing dependencies (bcrypt). | §2, §10, §13 |
| 2026-07-05 | Implemented Aspfiy PalmPay reserved accounts: no-KYC virtual accounts at user registration (fire-and-forget), webhook handler for wallet funding, admin API config section, getMe/getVirtualAccounts updated | §4, §9, §12, §13 |
| 2026-07-17 | Added beautiful downloadable Receipts: backend `GET /user/transactions/:ref` now returns derived `category`; web success purchase redirects to `/dashboard/transactions/[ref]?new=1` which renders a celebratory Receipt (print/download via popup, copy ref, Buy Another). Web transactions list gained a service-category filter chip row. Mobile: new `TransactionReceiptScreen` reachable after purchase and from history (tap any transaction); receipt shows full details, copy ref, share. All 8 purchase screens wired to navigate to Receipt on success. | §4, §6, §13 |
| 2026-07-17 | Wallet funding visibility: admin transactions page gained a "Wallet Funding" service filter so admin can see manual (Wallet Credit) + automatic (Monnify/Paystack Wallet Funding) funding. Airtime-to-Cash now creates a PENDING transaction in the user's history on submit ("Mark as Transferred"); admin Verify & Credit flips it to Successful (wallet payout also credits wallet + updates balances; bank payout marked successful without credit); Reject flips to Failed. Added `atc` category + Airtime→Cash filter chip on web and mobile. | §4, §6, §13 |
| 2026-07-17 | Branded logos for all services: MTN/Glo/Airtel/9mobile real brand logos on airtime + data screens (web SVGs + mobile styled circles); DStv/GoTV/StarTimes cable logos; WAEC/NECO/NABTEB exam logos; all 12 electricity DISCO logos. New components: `NetworkIcon.jsx` (web, updated with SVGs), `NetworkLogo.js` (mobile), `ProviderIcon.jsx` (web), `ProviderLogo.js` (mobile). Backend `logoUrl` field exposed on networks. | §4, §6, §13 |
| 2026-07-24 | Refactored web data page to 2-step flow: Step 1 (network → plan type → plan → phone number → Continue), Step 2 (order summary + transaction PIN with "Forgot PIN?" link using `ForgotPinOverlay`). Added `ArrowRight` icon import, step indicator progress bar. | §6, §13 |
| 2026-10-07 | Paystack LIVE keys seeded encrypted in `api_configs` (`paystack_secret_key`/`paystack_public_key`) on local + production DB via gitignored `backend/fix-paystack-keys.js`. Keys verified via `/balance` and live `/api/v2/public/paystack-key` endpoint. Whitelist server IP `163.245.204.115` in Paystack dashboard. Fund-wallet page replaced with Gwarzo's version: virtual-accounts section (polling + dvaFailed retry), Automatic + Dynamic tabs, reference prefix `KIR-` (was Guchor's `GCH-`). Registration DVA flow confirmed identical to Gwarzo (fire-and-forget `ensureAllAccounts` + lazy retry on getMe). | §5, §6, §13 |
| 2026-10-07 | Fixed existing-user dedicated account generation (no manual backfill): `ensureAllAccounts` now self-heals stale/foreign customer codes (detects Paystack `customer_not_found`, recreates the customer under Kiru's Paystack account, retries DVA) with a 15s per-user throttle (was a permanent block); removed the `if (!dvaFailed)` gate in `GET /user/virtual-accounts` so fund-wallet always triggers generation and returns `pending:true` while creating; web fund-wallet already polls (3s×10). Mobile: `FundWalletScreen` now tracks `pending` and polls every 3s (plus "Creating your account numbers…" empty state); `HomeScreen` auto-refetches the virtual-account strip while pending. Verified end-to-end with a synthetic user holding a fake foreign code: `GET /auth/me` healed the code and created both accounts automatically; backend deployed (`1b749df`). Deleted one-off `backfill-dvas.js` (manual approach rejected). Mobile changes ship with the first EAS build (projectId still TBD). | §5, §6, §13 |
| 2026-10-07 | Fixed existing-user DVA generation for real: Paystack requires the customer record to have a phone number — healed customers were created with empty phone so DVA failed with `validation_error`/`Customer phone number is required`. `ensureAllAccounts` now syncs the user's phone onto the customer before DVA creation (`syncCustomerPhone`, PUT /customer/:id) and retries on phone-missing errors; `healCustomer` falls back to email lookup when create hits a duplicate. Verified live: user #71 healed + phone synced → Wema 9818069346 / Titan 9625073159 generated via GET /auth/me background path; fund-wallet endpoint returns both. | §5, §13 |
| 2026-10-07 | Replaced ALL copied API keys (from Guchor/main dump) across admin configs with a single key generated from Kiru's own provider credentials: `base64(kirudata:kirudata4632Je@#$&+=)` = `a2lydWRhdGE6a2lydWRhdGE0NjMySmVAIyQmKz0=`. Updated: api_links (all rows), api_providers (MBC+Dorosub), data_providers (MBC, stored encrypted), api_configs (44 key entries incl. mtn*/glo* Api/Key, meterApi, meterVerificationApi, rechargeCardApi — decrypt-match-reencrypt since values are stored `enc:`). Paystack keys untouched. Verified: no copied keys remain (full scan) + live balance endpoints on MBC Data, Dorosub, MySubwallet all accept the new key (username kirudata). Backend restarted. | §4, §13 |
| 2026-10-07 | Fixed admin dashboard sidebar scroll freeze (`admin/layout.jsx`): (1) wheel events over non-scrollable sidebar areas (logo header, section labels, footer) are forwarded to the nav list via `aside.onWheel` so scrolling never dead-ends; (2) stale mobile-drawer overlay auto-closes at >=1024px viewport (resize listener) and dismisses on wheel, so a lingering overlay can no longer block page scrolling; (3) nav gets `minHeight:0` + `overscroll-behavior:contain` (flexbox/Safari shrink + scroll-chain stalls) and main gets `minHeight:0`; iOS momentum scrolling enabled. File is identical across all four projects (gwarzo, kiru, guchor, hamij). | §6, §13 | Deployed to Kiru VPS (frontend rebuild).
| 2026-10-10 | Admin transactions detail: replaced confusing "API Error:" raw-JSON dump + "API Response" code block with a human-readable **Result** line — parses apiResponseLog, shows green "Successful" / red "Failed" / amber "Processing" + the provider's own message (e.g. "Result: Successful — Dear Customer, You have successfully shared 1GB Data to …"), raw JSON kept behind a collapsible "View technical details" link for support. If only apiResponse (friendly msg) exists it is shown as plain "Result" text. File identical across all four projects. | §6, §13 | Deployed to Kiru VPS (frontend rebuild).
| 2026-10-10 | Mobile app upgraded Expo SDK 54 → 57 (expo ~57.0.21, react 19.2.3, react-native 0.86.3) so it runs in the current Expo Go (SDK 57) — fixes "Project is incompatible with this version of Expo Go". Added explicit `@expo/vector-icons` (no longer a transitive dep), `expo install --fix` aligned all expo-* packages (expo-sharing/expo-status-bar config plugins auto-added to app.json). Verified: `expo export --platform android` bundles clean (756+ modules). Same upgrade applied to all four data-sub projects (abubakardev mobile was already SDK 57). | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile contact picker fixed for SDK 57: `PhoneInput.js` migrated from `presentContactPickerAsync()` (now a deprecation stub that throws at runtime — picker failed silently with WARN logs) to the new class-based API `Contact.presentPicker()` + `getPhones()`, per Expo's expo-contacts migration guide. iOS permission path unchanged (root `requestPermissionsAsync`). Applied to all four data-sub mobile apps; `expo export` bundles clean. | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile data type chips fixed (corporate gifting invisible on app): `DataScreen.js` discovered available types with a client-side `TYPE_STATUS_MAP` keyed `Corporate`, but plans store type `Cooperate Gifting` — the match never hit, so the chip never appeared (web derives types straight from the API response and showed fine; backend already gates by network status flags server-side). Mobile now derives type chips from the response (`[...new Set(p.type)]`), exactly like web. Applied to all four data-sub mobile apps; `expo export` bundles clean. | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile onboarding redesigned to match reference screenshots: `WelcomeScreen` rebuilt in all four data-sub apps as a 3-slide swipeable carousel — centered logo+brand header, dark rounded card with pulsing glow illustration (rocket / robot / headset icons), per-slide title+subtitle ("Welcome to <brand>" / "We are Automated" / "Customer Support"), pagination dots with brand-colored active pill, brand-colored "Get Started" → Register + plain "Login" button. Replaced the old single-screen hero (orbiting badges, service pills, WhatsApp button, dead Terms/Privacy links — those routes never existed in the navigator). Per-app brand strings only (Gwarzo/Kiru/Guchor/Hamij). `expo export` bundles clean. | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile onboarding v2 (user feedback on new carousel): slides now **auto-advance every 4s** (timer resets on manual swipe, loops back to slide 1); header redesigned — actual logo only on the LEFT (fetched from /public/settings logoUrl with AsyncStorage cache + bundled fallback, white chip background so the light-blue logo is visible on dark, brand TEXT shown only if the image errors) and the WhatsApp **Contact support** pill restored on the RIGHT (wa.me deep-link from settings whatsapp/phone). Removed brand name/subtitle text from header. `expo export` bundles clean, all four data-sub mobile apps. | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile onboarding v3: (1) **crash fixed** — RN 0.86 removed `FlatList.scrollTo()` (ref method was undefined → `TypeError: undefined is not a function` on every 4s auto-advance tick); now uses `scrollToOffset`. (2) Recolored to brand palette per user feedback: light `COLORS.surface` background, signature `#0f172a → #1e3a8a → #4f46e5` gradient card (same hero gradient as login/dashboard), Get Started = `#4f46e5 → #6366f1` pill gradient (same as the shared Button component), indigo-tinted Contact support pill with WhatsApp-green icon, white icons/dots on the gradient card. All four data-sub apps; `expo export` bundles clean. | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile onboarding header logo fixed per user feedback: removed the white chip/border behind the logo (background is already light — logo now sits directly on it) and enlarged it 42 → 58 → **76px** (radius 18) to match the reference's prominent logo; text fallback is now plain brand name (no chip). All four data-sub apps; `expo export` bundles clean. | §7, §13 | Repo pushed (mobile not server-deployed).
| 2026-10-10 | Mobile splash + launcher branding (per-app logos): SplashScreen beautified — light surface bg with soft indigo glows, brand-gradient loading bar, **logo-only** center (no app-name text, no black background), wordmark fallback; app icons regenerated as 1024×1024 white-bg PNGs (EAS/App-Store compliant, no alpha), adaptive-icon bg `#ffffff`, splash `backgroundColor` `#ffffff`. Kiru now uses its real uploaded logo (`assets/logo-kiru.png`, cropped to content + composed icon/adaptive/splash); Gwarzo keeps `logo-gsub.png`; Guchor/Hamij show styled black+indigo name wordmarks (Login/Home/Splash/Welcome) until logos are uploaded via admin (fetched `logoUrl` still wins at runtime). | §6, §7, §13 |
| 2026-10-10 | Mobile register T&C checkbox removed (all four data-sub apps): `RegisterScreen` no longer requires ticking a box — replaced with a static consent line "By clicking **Create Account**, you agree to our Terms & Conditions and Privacy Policy" (links still tappable, per-app domains); `tosAccepted` state + validation gate + checkbox styles deleted. | §7, §13 |
| 2026-10-10 | Mobile startup/auth overhaul ×4 data-sub apps (5 reported issues): **1)** Welcome Back screen redesigned — content vertically centered (was bottom-pinned absolute), white card now shows the user's **first name** instead of the brand ("KIRU"/"GWARZODATA"/"GUCHOR"/"HAMIJ"), and a centered WhatsApp **Contact Support** card sits below the login card (per user's mySubwallet reference); **2)** `RootNavigator` dark `ActivityIndicator` replaced with an animated branded logo loader (pulsing logo/wordmark + indeterminate brand-gradient bar on light surface); **3)** SplashScreen routes `lastUser ? "Login" : "Welcome"` so returning accounts land on Welcome Back, never the onboarding carousel; **4)** faster startup — `AuthContext` restores instantly from a `cached_user` AsyncStorage profile and validates `/auth/me` in the background (12s boot timeout), splash duration 2500→1800ms; **5)** only HTTP 401/403 deletes the token now (network/timeout errors no longer force logout → onboarding), and the 30-min session timeout + explicit logout keep `last_user`. Gray concentric-grid screen at app open identified as Expo Go's own dev loading overlay (not app code — gone in the standalone preview APK). `expo export` bundles clean ×4. | §7, §13 | Repo pushed (mobile not server-deployed). |
| 2026-10-10 | Cold-start re-auth gate (user feedback, ×4 apps): fully closing the app and reopening now **always lands on Welcome Back** for a known account — the dashboard is never auto-entered on cold start, even with a still-valid token/session. Only a fresh login/register/OTP sets `sessionStarted` (new AuthContext flag) and enters the dashboard; RootNavigator gates `user && lastUser && !sessionStarted → AuthStack`. AuthContext boot is now fully local/offline (no blocking `/auth/me` on launch — instant open from `cached_user`, `last_user` synthesised from cache if the stored record was missing). 30-min session lock + explicit logout / "Not my Account" / forgot-password / change-password flows unchanged (they keep `last_user`, so re-login lands on Welcome Back with the new password). `expo export` bundles clean ×4. | §7, §13 | Repo pushed (mobile not server-deployed). |
| 2026-10-13 | Fingerprint login finally works (×4 apps) — root cause: `useBiometric.checkAvailability()` snapshot was cached for the whole screen and `isEnrolledAsync()` (native `BiometricManager.canAuthenticate(BIOMETRIC_WEAK)`) can report `false` on a device that authenticates fine. That single boolean gated **both** `saveCredentials` (credentials never written → `SecureStore biometric_credentials = null` → `no_credentials`) and `canShowBiometric` (button never shown) — a self-perpetuating lock, so the feature stayed dead once the snapshot read false. Fix: `saveCredentials` now only requires `isSupported` (hardware); `canShowBiometric = isReturning && isSupported && isEnabled`; enrollment re-read once after 400ms; the system prompt is the authority at scan time (explicit "Fingerprint not available" toast for `not_enrolled`, plus a guard that clears stale credentials when they belong to a different account); removed the misleading grey "No fingerprint enrolled" placeholder and all debug logs. Also fixed a separate silent build break: commits `23b49d1`/`b52700f`/`e99e8b0` had copied kiru's `LoginScreen.js` over zedro/guchor/hamij, replacing their `LOCAL_LOGO` with `require("assets/logo-kiru.png")` — a missing asset in those 3 repos made `expo export` emit an empty `dist` **with exit code 0**, so it went unnoticed. Restored `logo-gsub.png` (Gwarzo) and `null` (Guchor/Hamij). `expo export` bundles clean ×4 (and `Exported: dist` is now actually printed). | §7, §13 | Repo pushed. |
| 2026-10-13 | Fingerprint pre-enable hint is now tappable (×4 apps): before the first password login the Welcome Back screen shows a grey fingerprint placeholder reading "Log in with password first to enable fingerprint" — it was a plain `View`, so tapping it did nothing and the user got no feedback. It is now a `TouchableOpacity` that toasts "Log in with your password once to enable fingerprint login". `expo export` bundles clean ×4. | §7, §13 | Repo pushed. |
| 2026-10-13 | Logout now actually signs out to the fresh Login screen (×4 apps) — two reported bugs: (1) Welcome Back's **"Not my Account? Logout"** did nothing visible, because `logout()` only cleared the session/token while deliberately keeping `last_user`, so `isReturning` stayed true and the same LoginScreen instance just stayed on Welcome Back; (2) **Profile → Logout** landed on Welcome Back, because `SplashScreen` routed on `lastUser ? "Login" : "Welcome"`. Split the two meanings: `_clearSession()` (30-min timeout / lock) still keeps `last_user` → Welcome Back; `logout()` is now an EXPLICIT sign-out that also removes `last_user` + `cached_user`, wipes the stored biometric password (it would be stale after a password change) and sets a new `onboarded` flag; `SplashScreen` routes to `Login` when a `lastUser` exists or `onboarded` is set, so the onboarding carousel stays first-run-only. `handleNotYou` also resets the form state and toasts "Logged out". Also fixed two more kiru-copy brand artifacts: `LoginScreen`'s "Sign in to **Kiru Data**" banner and `RegisterScreen`'s "Welcome to Kiru Data" toast were wrong in Gwarzo/Guchor/Hamij (the Register one predates the clobber). `expo export` bundles clean ×4. | §7, §13 | Repo pushed. |
| 2026-10-13 | Welcome Back password reveal toggle changed from the words "Show"/"Hide" to an **eye icon** (`eye-outline` while hidden → `eye-off-outline` while shown), matching every other password field in the app (`LoginPasswordInput`, `PinInput`, `Input`, and the regular login password step, which already used an eye). Removed the now-unused `wbShowToggle` style. `expo export` bundles clean ×4. | §7, §13 | Repo pushed. |
| 2026-10-13 | Native startup flash (×4 apps): between the system splash and React Native's first frame, Android drew its own **default grey starting-window placeholder** — Expo's generated `MainActivity` swaps the manifest splash theme for `AppTheme` before the window is laid out, and `AppTheme` had no `android:windowBackground` (confirmed by diffing `expo prebuild` output with and without the plugin: the baseline has none). Native folders are gitignored, so the fix had to be a config plugin: added `mobile/plugins/withStartupSplash.js`, registered last in `app.json` `plugins`, which sets `android:windowBackground` to `@drawable/ic_launcher_background` (white + centered logo) on both `AppTheme` and `Theme.App.SplashScreen`, and pins `splashscreen_background` to `#ffffff` so the native splash is white and blends into the light JS splash instead of cutting black to light. Also normalised `Theme.App.SplashScreen`, which Expo had pointing at the raw `@drawable/splashscreen_logo` bitmap (stretched to fill the window = distorted logo). Gotcha: `AndroidConfig.Styles.setStylesItem` takes a single object `{ xml, parent, item }` — calling it as `(xml, opts)` silently no-ops. Verified generated `styles.xml`/`colors.xml` for all 4 with `npx expo prebuild --platform android --no-install`; `expo export` bundles clean ×4. Native-only change — needs a fresh EAS build. | §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Kiru Data only** — new launcher/app icon: `assets/icon.png` and `assets/adaptive-icon.png` replaced with the blue K + WiFi mark (source `~/Downloads/app-icon-1024.png`, 1024x1024 RGB, no alpha; `icon.png` is a byte-identical copy). The source artwork sits at **38.9% radial** from centre, but Android's adaptive-icon safe zone is only **33.3%** (72dp of the 108dp canvas), so circular/squircle launcher masks would have clipped the top-right WiFi arc — the adaptive foreground and the new monochrome are therefore scaled to **0.845** (giving 32.9%) and re-centred on white. Also added a real `monochromeImage` (it previously pointed at the full-colour adaptive PNG, which renders garbage as an Android 13+ themed icon): a pure-white silhouette on transparency, aligned to the same bounding box. `android.adaptiveIcon.backgroundColor` stays `#ffffff`. Verified the generated `mipmap-*` launcher / foreground / monochrome webps and `mipmap-anydpi-v26/ic_launcher.xml` with `npx expo prebuild --platform android`; `expo export` bundles clean. Native-only change, needs a fresh EAS build; the other 3 apps are untouched. | §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Gwarzo Data Sub only** — Welcome carousel + splash logo are now clearly visible and much bigger. Root cause was the **source image, not the styling**: `/uploads/logo.png` (and the bundled `assets/logo-gsub.png`) were 3264x979 / 800x239 with ~70% transparent **horizontal** padding, so every mobile screen's square box + `resizeMode="contain"` shrank the artwork to ~30% of the box (Welcome showed it at a mere 23px, Splash at 45px); the artwork is also near-white (mean RGB 207,234,176), so it disappeared against the white background. Fixed at the source: cropped the transparent side margins only (kept full height, 8% side padding -> 1125x979 and 276x239, aspect ~1.15) — this is **web-safe** because every web usage is `height: N, width: auto` and the artwork height is unchanged. Then doubled the boxes as requested — Welcome header `LOGO_STYLE` 76 -> **152** (plus `flexShrink:1` so 320dp phones still fit the Contact pill), SplashScreen and RootNavigator `LoadingView` 150 -> **300** — and placed both on a **`#0f172a` rounded tile** so the white logo finally has contrast. Server backup kept at `uploads/logo.png.bak-20261013`; `expo export` bundles clean. | §6, §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **All 4 apps** — fixed the `GO_BACK` warning on the login screen. Root cause: `SplashScreen` finishes with `navigation.replace(target)`, which **removes Splash from the stack**, so `Login` becomes the **root route**; the banner back arrow in `LoginScreen` then called `navigation.goBack()` unconditionally and React Navigation logged `The action GO_BACK was not handled by any navigator`. The screen already had correct in-flow back buttons (the OTP Back button and `handleBackToIdentifier`) but the banner arrow bypassed all of them, and it also skipped the password step (popping out of Login instead of returning to the identifier step). Added `handleBannerBack` — OTP step resets OTP state and mirrors the inline Back button, password step calls `handleBackToIdentifier()`, identifier step does `navigation.canGoBack() ? goBack() : navigate("Welcome")`, so it can never dispatch a GO_BACK with nothing behind it. Verified no other screen can ever be a root: Receipt and every service screen are always pushed onto a stack that has Main/Home beneath them, and `FundWalletScreen` already guards with `canGoBack`. `expo export` bundles clean x4. | §5, §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Data purchase — type order + smart default (web + mobile)** — when a network is picked on the Buy Data screen the data-type list now always shows **SME first, then Corporate Gifting, then Gifting** (it previously followed whatever order the backend happened to return, which put Gifting first). On top of that the right type is now **preselected** instead of making the user choose: SME if that network has SME plans on, else Corporate Gifting, else Gifting — and its plans render immediately. Implemented client-side in both the web data page and the mobile `DataScreen` (shared `TYPE_ORDER` / `orderTypes` / `defaultTypeFor` helpers), so the order is correct regardless of backend response order. Verified against live data: the only stored types are `SME`, `Cooperate Gifting` and `Gifting`, and all 4 networks have sme/gifting/corporate switched On. Unknown or future types still render (sorted after the known three, and used as the default if none of them exist). `expo export` bundles clean x4. | §6, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Gwarzo only — logo sizing follow-up** — the enlarged logos overshot, so they are now halved: Welcome header `LOGO_STYLE` 152 -> **76**, Splash + RootNavigator `LOGO_W/H` 300 -> **150** (radius 48 -> 24, Welcome radius 30 -> 18), and the fresh-login banner logos `<Logo size>` 180 -> **90** and 100 -> **50**. The square logo tile behind them is also no longer the near-black `#0f172a` — it is now a **blue-black `#172554`** on Welcome, Splash and the RootNavigator loader, which keeps the contrast for the white logo but reads as deep blue instead of black. Note the sizes are back to the pre-enlargement numbers but the **artwork is still 3x larger on screen** than before the transparent side-margins were cropped off the source image. Kiru/Guchor/Hamij were left alone on the Welcome/Splash changes — those apps use a wide wordmark layout (`170x52` / `250x77`) that was never enlarged and has no square tile. `expo export` bundles clean. | §6, §7, §13 | Repo pushed (AGENTS log only — no code change in this app). |
| 2026-10-13 | **Buy Data screen redesigned (all 4 mobile apps)** to match the requested flow. **Phone number is now at the top** (it previously only appeared *after* a plan was picked) and **no network is preselected** — typing a number **auto-selects its network** off the standard Nigerian prefixes via the existing `detectNetwork` helper (now exported from `PhoneInput`), while the Select Network row still lets you pick manually before or after typing and is only overridden when the number changes again. Once a network is chosen the data-type chips appear immediately and **default to SME**. Added a dark **hero card** and a **History** shortcut in the header. Choosing a plan now raises a fixed **Pay now bar** (price + plan + Pay now) in place of the old inline Continue buttons, which opens a new **Confirm Purchase modal** (amount card, Network / Data Type / Plan / Validity / Recipient rows, Data-is-delivered-instantly note, Confirm & Pay with lock, Cancel) — Confirm & Pay then hands off to the existing `TransactionPinModal`, which already supports fingerprint. New `OverlayContext` lifts the floating **WhatsApp button above the Pay now bar** so they never overlap; no call/contact icon was added — our WhatsApp FAB stays exactly where it was. `expo export` bundles clean x4. | §6, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Select Network row rebuilt as a horizontal card rail (Buy Data + Buy Airtime, all 4 apps)** — replaced the wrapping inline pills with a new shared `NetworkSelector` component: tall rounded cards (96x110) with the network logo in a circle on top and the name below, laid out in a single **horizontally scrolling row** with chevron buttons pinned to each edge (they step the list by two cards at a time and track contentOffset so they stay in sync). The selected card gets an indigo border/tint plus a small check badge in the corner. Old networkRow / networkPill / networkDot / networkLabel styles removed from both screens, and the now-unused `NetworkLogo` import was dropped from `AirtimeScreen`. `expo export` bundles clean x4. | §6, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Transaction PIN modal — fingerprint key is now always visible (all 4 apps)** — the slot left of `0` previously rendered only when `bio.ready` (hardware + enrolled fingerprint + fingerprint auth type), so first-time users saw an empty blank key and had no way to know the shortcut existed. It now **always renders** with the indigo key style and the finger-print icon. Tapping it with no saved transaction PIN shows an alert telling the user to **enter their transaction PIN once first before fingerprint can be enabled**; tapping it on a device with no enrolled fingerprint tells them to use their PIN instead. Only when a PIN is stored and the device is capable does it run authenticateAsync and submit. Removed the now-unused isHidden branch and keyInvisible style. `expo export` bundles clean x4. | §5, §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Network cards auto-fit so no horizontal scrolling (Buy Data + Buy Airtime, all 4 apps)** — `NetworkSelector` now measures its row width (onLayout) and derives each card width from `(width - padding - gaps) / count`, floored and clamped to 48-96px, with the logo (46% of card) and label (11-13px) scaling alongside card height (1.15x width). With the live 4 networks (MTN / GLO / 9MOBILE / AIRTEL) every card now fits on screen — at a 390pt viewport the cards land at 73px and the row totals 324pt inside a 326pt box — so all networks are visible at once with no swipe. The left/right chevron buttons are now rendered **only when the row genuinely cannot fit** (they were always on before) and the scroll step follows the computed card width. `expo export` bundles clean x4. | §6, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Header right slot no longer crushes the History pill (all 4 apps)** — `Header` had a hard `width: 36` on its right container, so the Buy Data History pill (~78px) was forced into a 36px box and wrapped one letter per line, rendering as a vertical H-i-s-t-o-r-y column. Rebuilt the header row as three flex columns (side flex 1 / title flexShrink 1 centered / side flex 1 with justifyContent flex-end), so the title stays perfectly centred while the right slot sizes to its content. The pill also gained flexShrink 0 and numberOfLines 1 so it can never wrap again. `expo export` bundles clean x4. | §6, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **Buy Airtime redesigned to match Buy Data (all 4 mobile apps)** — phone number moved to the top with live network auto-detect via `detectNetwork` (no network preselected), Select Network uses the auto-fitting NetworkSelector rail, new Quick Amount pills (100/200/500/1000) plus an "Or enter amount" field with a naira prefix, the discount banner, a fixed Pay now bar (cost + Pay now) and the shared ConfirmPurchaseModal now taking service=airtime — big amount is the discounted cost, rows are Recipient / Amount / Discount, note reads "Airtime is delivered instantly after payment". ConfirmPurchaseModal also gained a dark amount card, a network logo band and 2-decimal money formatting for BOTH services. History pill added to the airtime header. `expo export` bundles clean x4. | §6, §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-13 | **New USSD Codes screen + USSD Enquiry entry points (all 4 mobile apps)** — dedicated `src/screens/UssdCodesScreen.js` lists per-network codes (MTN / AIRTEL / GLO / 9MOBILE: check number, check balance, check data usage including Gifting and SME) grouped under logo + name sections; tapping a row copies the code to the clipboard (expo-clipboard, already a dependency) and toasts it. Registered as `UssdCodes` in ServicesStack, HomeStack and the root AppStack so `navigation.navigate("UssdCodes")` works from anywhere including the receipt. Reusable `UssdEnquiryRow` component added and placed at the bottom of Buy Data and Buy Airtime; the receipt gained a "Check balance with USSD" outline button between Save/Share and Buy Another. Codes were transcribed from the supplied reference screens — edit the USSD array in that file to correct any. `expo export` bundles clean x4. | §4, §6, §7, §13 | Repo pushed; needs a fresh EAS build. |
| 2026-10-14 | **Kiru mobile: EAS Update (OTA) enabled + SDK 57 preview APK + both channels baselined** — the earlier builds (2026-10-10 and 2026-10-13 14:48) had `channel: None` and `runtime: None`, so they could never receive an OTA update. Ran `eas update:configure` (adds `runtimeVersion.policy = appVersion` + `updates.url` for project `ff5e6b07-f55a-4814-9db7-1446b013d7d6`), de-duplicated the contacts permissions it re-added in `app.json`, added `channel` bindings in `eas.json` (development/preview/production), committed `45e1311`. Built the SDK 57 preview APK (build `6bf7532d`, versionCode 1, `updateChannel = preview`, `runtime = 1.0.0`): https://expo.dev/artifacts/eas/QqJEFhi69CKVDJH7WyUd1_Wg0Dat1mX4evuHxt1o6Xk.apk. Published baseline OTA updates to **both** channels so the pipeline is warm whenever Kiru reaches the Play Store — `preview` group `9e77feba-e369-40cc-9ac0-889f6d34fe9c`, `production` group `616480fc-d426-4bdf-8673-4282d7fcf55e`. Kiru is not on the Play Store yet: when it goes up, build the `production` profile (its OTA config is already committed) and thereafter publish every JS-only change with the same `eas update` command. | §7, §10, §13 | Auth is `EXPO_TOKEN`; no Play upload yet. |

---

## 14. AI Agent Instructions

### Before Starting Work
1. Read this entire file
2. Understand the current state of the project
3. Check relevant files in the codebase

### After Completing Work
1. Test your changes work
2. Deploy if ready
3. **UPDATE THIS FILE** — add entry to §13 (Update Log), update any changed sections

### What to Update
- New API endpoints → §4
- Schema changes → §3
- New pages → §6
- Security changes → §8
- Deployment changes → §10
- New services → §9
- Known issues → §12

### Do NOT
- Commit without testing
- Deploy without building frontend (if frontend changed)
- Skip documentation updates
- Assume old patterns — check the codebase first
