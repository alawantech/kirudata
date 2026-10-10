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
