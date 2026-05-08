# GuestWorker — Product Requirements

## Original problem statement
Imported from GitHub repo `socialdesignzy/GuestWorker0`. Existing FastAPI + React + MongoDB SaaS for Indian contractors managing daily-wage workers. Subscriptions powered by Razorpay.

## Personas
- **Contractor** (paid): manages workers, employers, daily attendance, bookings, payments, advances, rooms, extra charges, commissions, reports.
- **Admin** (super-user): manages contractors, plans, activation keys, promotions, security logs, payment orders, platform revenue, deletion requests, broadcast notifications.

## Tech stack
FastAPI · MongoDB (motor) · React (CRA) · TailwindCSS · shadcn/ui · React Router · Razorpay subscriptions · JWT cookie auth (httponly).

## Modules / Routes
Contractor: `/dashboard`, `/workers`, `/employers`, `/attendance`, `/booking`, `/payments`, `/advance`, `/rooms`, `/extra-charges`, `/commissions`, `/attendance-report`, `/work-history`, `/account`, `/manage-subscription`, `/help`.
Admin: `/admin/dashboard`, `/admin/contractors`, `/admin/deletion-requests`, `/admin/deleted-users`, `/admin/activation-keys`, `/admin/security-logs`, `/admin/plans`, `/admin/trial-settings`, `/admin/payment-orders`, `/admin/platform-revenue`, `/admin/notifications`, `/admin/promotions`, `/admin/site-offers`, `/admin/messages`, `/admin/contact-messages`, `/admin/gateway-settings`.

## Implemented (changelog)
- **2026-05-07** (later)
  - **Default subscription plans seeder** — Idempotent `seed_default_plans()` runs at every backend startup. Creates any missing canonical plan (Contractor Plus / Contractor Pro / Enterprise) and back-fills the `features` / `description` / `trial_eligible` / `coming_soon` fields when sparse, **without** disturbing admin-set price, duration, or limits.
  - **Pro & Enterprise plan features** now seeded with full feature lists (10 each); admins see + can edit them in `/admin/plans`.
  - **Trial bug fix** — `/api/subscription/activate-trial` now reads `plan_name` from the request body and activates that plan (Contractor Plus or Contractor Pro). Previously every trial silently fell back to Plus regardless of the plan the user clicked. Enterprise correctly rejects trial activation with `400`.
- **2026-05-07**
  - Imported codebase from GitHub; environment booted (FastAPI + React + MongoDB).
  - Admin seeded: `admin@guestworker.in` / `Qwerty0981` (see `/app/memory/test_credentials.md`).
  - Added **Work History** entry under "Reports" group in contractor sidebar (`/work-history`).
  - Removed duplicate page-internal "Back" button from Work History page (only the Layout's "Back to Dashboard" remains).
  - Rebranded `/api/reports/work-history/export` outputs (CSV / Excel / PDF):
    - Brand banner with GuestWorker wordmark + URL
    - Contractor name, email, phone, plan, period, scope (filtered worker/employer)
    - IST timestamp
    - KPI cards (PDF), summary table, totals row
    - Brand-coloured headers (#3B2ED0), zebra rows, bordered cells
    - Print-ready: landscape A4, repeat header rows, freeze pane (Excel), page numbers + footer (PDF)
    - Filenames now `GuestWorker_WorkHistory_<scope>_<period>.{csv|xlsx|pdf}`

## Backlog (priority order)
- **P1** Provide live Razorpay test/live keys to enable subscription/payment flows (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in `/app/backend/.env`).
- **P1** Apply same branded export look to other downloads: payments employer/worker history exports, all-reports export (`/api/reports/export-*`), worker/employer invoice HTML.
- **P2** Add a logo image asset (svg/png) and embed in PDF instead of "GW" placeholder mark.
- **P2** Capture optional contractor business name / GSTIN on the User profile to surface on exported invoices.
- **P3** Localise CSV/Excel column headers (Hindi) and i18n the report titles.

## Key files
- `/app/backend/server.py` — single-file FastAPI app (~14k lines).
- `/app/backend/.env` — `MONGO_URL`, `DB_NAME`, JWT secret, CORS, Razorpay keys (empty).
- `/app/frontend/src/App.js` — all routing + Layout (sidebar with grouped nav).
- `/app/frontend/src/pages/WorkHistory.js` — work history report page.
- `/app/frontend/src/utils/api.js` — axios wrapper, relative `/api` baseURL.
