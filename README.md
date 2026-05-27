# LeaveDesk — Leave Request Management System

## Overview

LeaveDesk is a production-quality leave request management application that allows employees to submit leave requests and a single manager to approve or reject them. All authenticated users can see every request on a shared dashboard and calendar. Automated notifications are sent to a shared Microsoft Teams channel via n8n Cloud whenever a request is submitted or decided.

---

## Live Demo

| Resource | URL |
|---|---|
| Production app | _Set after Vercel deploy_ |
| Manager account | `manager@demo.com` / `Demo1234!` |
| Employee account | `employee@demo.com` / `Demo1234!` |

> **Note:** Demo credentials are for local development only. Rotate them before any real use.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React 19)                       │
│  Login → Dashboard → New Request → Calendar                      │
│  React Query (server state) · react-hook-form + zod (forms)     │
│  react-router-dom v6 (routing) · shadcn/ui (components)         │
└───────────────────┬────────────────────┬────────────────────────┘
                    │  Supabase SDK       │  fetch (webhook)
                    ▼                     ▼
         ┌──────────────────┐    ┌────────────────────┐
         │   Supabase Cloud  │    │    n8n Cloud        │
         │  ─────────────── │    │  ──────────────── │
         │  Postgres DB      │    │  Workflow A        │
         │  Auth (email+pwd) │    │   POST /leave-new  │
         │  Row Level Security│   │  Workflow B        │
         └──────────────────┘    │   POST /leave-decision│
                                 └──────────┬───────────┘
                                            │ MS Teams Incoming Webhook
                                            ▼
                                   ┌────────────────┐
                                   │  Teams Channel  │
                                   └────────────────┘
```

---

## Tech Stack

- **Framework:** React 19 + TypeScript (strict mode) via Vite 5
- **Styling:** TailwindCSS v3 + shadcn/ui (Radix UI primitives)
- **Routing:** react-router-dom v7
- **Server state:** @tanstack/react-query v5
- **Forms:** react-hook-form v7 + zod v4
- **Backend:** Supabase (Postgres + Auth + RLS)
- **SDK:** @supabase/supabase-js v2
- **Calendar:** react-big-calendar v1 + date-fns v4
- **Icons:** lucide-react
- **Toasts:** sonner
- **Error boundaries:** react-error-boundary
- **Hosting:** Vercel
- **Automation:** n8n Cloud
- **Notifications:** Microsoft Teams Incoming Webhook

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd leave-dashboard
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_NEW_REQUEST_WEBHOOK=https://your-workspace.app.n8n.cloud/webhook/leave-new
VITE_N8N_DECISION_WEBHOOK=https://your-workspace.app.n8n.cloud/webhook/leave-decision
VITE_N8N_WEBHOOK_SECRET=<generate with: openssl rand -hex 32>
VITE_APP_URL=http://localhost:5173
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run the full contents of [`supabase/migration.sql`](supabase/migration.sql)
3. In **Authentication → Providers → Email**, ensure "Enable Email" is on
4. In **Authentication → Policies**, confirm RLS is enabled (the migration does this automatically)
5. After creating the manager account, promote it:
   ```sql
   update profiles set role = 'manager' where id = '<manager-user-id>';
   ```

### 4. Run the dev server

```bash
npm run dev
```

---

## Database

Full schema: [`supabase/migration.sql`](supabase/migration.sql)

**Tables:**
- `profiles` — extends `auth.users`, stores `full_name` and `role` (`employee` | `manager`)
- `leave_requests` — employee, dates, reason, status, decided_by, decided_at

**Constraints:**
- `start_date <= end_date`
- `reason` between 10–500 characters
- `status` in `('pending', 'approved', 'rejected')`

**Trigger:** `on_auth_user_created` auto-creates a `profiles` row on signup.

---

## n8n Setup

1. Import [`n8n/workflows.json`](n8n/workflows.json) into n8n Cloud via **Workflows → Import**
2. Create two credentials in n8n:
   - **Header Auth** named `WEBHOOK_SECRET` — value must match `VITE_N8N_WEBHOOK_SECRET`
   - **Generic Credential** named `TEAMS_WEBHOOK_URL` — paste your Teams Incoming Webhook URL
3. Set `APP_URL` in n8n environment variables (used in the "Open Dashboard" link)
4. **Activate** both workflows in production view (not test mode)

**Webhook paths:**
- `POST /webhook/leave-new` — triggered on new request
- `POST /webhook/leave-decision` — triggered on approve/reject

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all `VITE_*` environment variables in the Vercel dashboard
4. Deploy — `vercel.json` handles SPA rewrites and security headers automatically

---

## Testing

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# React Doctor quality gate (target ≥ 85)
npx react-doctor@latest . --verbose
```

### Manual smoke test

1. Sign up as employee → profile auto-created in `profiles` table
2. Submit a request → appears on dashboard as `pending` → Teams gets notification
3. Sign in as manager → approve a request → status updates optimistically → Teams notified → calendar shows event
4. Reject flow same as approve
5. Test bad webhook secret:
   ```bash
   curl -X POST https://your-n8n-url/webhook/leave-new \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Secret: wrong-secret" \
     -d '{"test":true}'
   # Should return 401
   ```

---

## Security Model

### Authentication
- Supabase email + password auth
- Password policy: min 8 chars, must contain letter + number (enforced client-side via zod AND in Supabase Auth settings)
- Sessions auto-refresh via `@supabase/supabase-js`
- All routes except `/login` wrapped in `<ProtectedRoute>` (redirects to `/login` if unauthenticated)

### Row Level Security
| Table | Policy |
|---|---|
| `profiles` | SELECT: any authenticated user; UPDATE: own row only |
| `leave_requests` | SELECT: any authenticated user; INSERT: own requests, status='pending'; UPDATE: managers only |

### Webhook Security
- React app sends `X-Webhook-Secret` header with every n8n POST
- n8n IF node validates the secret before any action; returns 401 if invalid
- Secret stored in Vercel env (`VITE_N8N_WEBHOOK_SECRET`) and n8n credentials — never in the repo
- Teams Incoming Webhook URL lives only inside n8n — never reaches the browser

### Frontend Hardening
- No `dangerouslySetInnerHTML` anywhere
- React's default XSS protection on all text rendering
- Security headers via `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- HTTPS enforced by Vercel

---

## Tradeoffs & Next Steps

What I'd do with more time:

- **DM notifications via Microsoft Graph** — per-user notifications rather than shared channel
- **Leave balances** — track annual entitlement and warn when exceeded
- **Half-day support** — morning/afternoon granularity in requests
- **Manager delegation** — allow the manager to delegate approval rights temporarily
- **Audit log** — immutable history of every status change with timestamp and actor
- **Email fallback** — if Teams webhook fails, email the manager directly
- **Supabase Realtime** — push new requests to the manager's dashboard instantly
- **Leave type categories** — annual, sick, personal, unpaid
- **CSV/PDF export** — download filtered leave data for HR reporting
