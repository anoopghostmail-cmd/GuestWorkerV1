# GuestWorker — PRD / Project Memory

## Original problem statement
> Repo: https://github.com/emergenty/guestworkerV3 — workforce management SaaS for India's contractor economy (FastAPI + React 19 + MongoDB, Razorpay subscriptions). Goal: deploy to production on Emergent.

## Stack
- **Backend:** FastAPI (single ~14k LoC `server.py`) on port 8001, all routes prefixed `/api`
- **Frontend:** React 19 (CRA via CRACO), runs on port 3000, same-origin relative `/api` requests
- **Database:** MongoDB Atlas (`cluster0.oxmciqt.mongodb.net`), DB `guestworker`
- **Auth:** JWT in HttpOnly cookies (Secure=true, SameSite=none for HTTPS)
- **Payments:** Razorpay subscriptions (keys to be added post-deploy)

## Personas
- **Contractor** (paid): manages workers, employers, daily attendance, bookings, payments, advances, rooms, extra charges, commissions, reports.
- **Admin** (super-user): manages contractors, plans, activation keys, promotions, security logs, payment orders, platform revenue, deletion requests, broadcast notifications.

## Core modules
Contractor: `/dashboard`, `/workers`, `/employers`, `/attendance`, `/booking`, `/payments`, `/advance`, `/rooms`, `/extra-charges`, `/commissions`, `/attendance-report`, `/work-history`, `/account`, `/manage-subscription`, `/help`, `/pricing`.
Admin: `/admin/dashboard`, `/admin/contractors`, `/admin/deletion-requests`, `/admin/deleted-users`, `/admin/activation-keys`, `/admin/security-logs`, `/admin/plans`, `/admin/trial-settings`, `/admin/payment-orders`, `/admin/platform-revenue`, `/admin/notifications`, `/admin/promotions`, `/admin/site-offers`, `/admin/messages`, `/admin/contact-messages`, `/admin/gateway-settings`.

## Implemented (changelog)
- **2026-05-08** — Cloned repo from `emergenty/guestworkerV3` into `/app`, installed backend (Python deps from requirements.txt incl. bleach, slowapi, reportlab, etc.) + frontend deps (yarn add react-datepicker), wired up env vars (Atlas Mongo URI, JWT secret, COOKIE_SECURE/SameSite=none for cross-origin HTTPS, ALLOWED_ORIGINS includes `guestworker.in` / `guestworker.app` / preview), seeded super-admin (`admin@guestworker.in` / `Qwerty0981`, must-change-password=true) and 3 default plans (Contractor Plus / Pro / Enterprise) into Atlas. Verified end-to-end via curl: admin login, user register/login, /auth/me, trial activation, worker create. App ready for deploy.

## Deployment readiness
- ✅ Backend runs cleanly on Atlas
- ✅ Frontend builds and renders landing/login
- ✅ All API endpoints respond
- ✅ CORS, JWT cookies, rate-limiting, brute-force protection active
- ✅ Admin & default plans seeded
- ⚠️ **Razorpay keys empty** — payment flows inactive; add `RAZORPAY_KEY_ID`/`SECRET`/`WEBHOOK_SECRET` post-deploy
- ⚠️ Atlas IP allowlist must include `0.0.0.0/0` (done by user) for Emergent's rotating pod IPs

## Backlog (priority order)
- **P1** Add live Razorpay keys after deploy (Dashboard → Settings → API Keys)
- **P1** Map custom domains `guestworker.in` / `guestworker.app` to the deployed app and update DNS / CORS if hostnames change
- **P2** Optional: tighten the rooms-list endpoint (N+1 worker count) and attendance scheduler with aggregation pipelines once user count grows
- **P2** Apply same branded export look to other downloads (payments employer/worker history, all-reports export, invoices)
- **P2** Add a logo image asset (svg/png) and embed in PDF instead of "GW" placeholder mark
- **P3** Localise CSV/Excel column headers (Hindi)

## Key files
- `/app/backend/server.py` — main FastAPI app
- `/app/backend/.env` — Atlas URI, JWT, CORS, admin creds, Razorpay placeholders
- `/app/backend/seed_default_plan.py`, `seed_plans.py` — plan seeders (called on startup)
- `/app/backend/attendance_analytics.py`, `attendance_report_endpoints.py`, `promotions_endpoints.py`, `rooms_endpoints.py` — modular endpoint files included in `server.py`
- `/app/frontend/src/App.js` — routing + Layout
- `/app/frontend/src/utils/api.js` — axios wrapper, relative `/api` baseURL
- `/app/frontend/src/context/AuthContext.js` — auth state via `/auth/me`
