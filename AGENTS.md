# Agent Context

## Project
Leave Request Management System — React 19 + TypeScript + Supabase + n8n + Microsoft Teams.
Single manager approves/rejects employee leave requests. All authenticated users see all requests.
Approved leaves appear on a shared calendar. Teams notifications via n8n on submit and decision.

---

## Tech Stack

- React 19.x + TypeScript 6.x (strict mode, no `any`)
- Vite 5.x (build + dev server)
- TailwindCSS 3.x + shadcn/ui (Radix UI primitives)
- react-router-dom 7.x (client-side routing)
- @tanstack/react-query 5.x (server state)
- react-hook-form 7.x + zod 4.x (forms + validation)
- @supabase/supabase-js 2.x (auth + database)
- react-big-calendar 1.x + date-fns 4.x (calendar view)
- react-day-picker 10.x (date picker in forms)
- sonner 2.x (toasts)
- react-error-boundary 6.x (error boundaries)
- lucide-react (icons)
- n8n Cloud (webhook automation)

---

## Architecture

- **Client:** React 19 + TypeScript SPA, deployed to Vercel. Routes code-split with `React.lazy`.
- **DB + Auth:** Supabase Postgres with RLS. Auth via email + password.
- **Automation:** n8n Cloud — two webhook routes (`leave-new`, `leave-decision`) → Teams Incoming Webhook.
- **Server state:** React Query. No manual `useEffect` fetch loops.
- **Form state:** react-hook-form + zod. Validation matches DB constraints exactly.

---

## File Structure

```
src/
  components/
    ui/           # shadcn/ui primitives (button, card, badge, dialog, etc.)
    layout/
      Navbar.tsx          # Sticky top nav, mobile hamburger, user menu, theme toggle
      ProtectedRoute.tsx  # Redirects unauthenticated users to /login
    AppLayout.tsx         # Shell: Navbar + <main> container + <Outlet>
    ErrorFallback.tsx     # react-error-boundary fallback UI
    StatusBadge.tsx       # Colored badge for pending/approved/rejected
  hooks/
    useAuth.ts            # Supabase session listener
    useProfile.ts         # React Query hook for current user's profile
    useLeaveRequests.ts   # React Query hooks: list, create, decide
    useTheme.ts           # dark/light toggle, persisted to localStorage
  lib/
    supabase/
      client.ts           # createClient<Database>(...)
      types.ts            # Hand-written Database type + Profile, LeaveRequest aliases
    queries/
      leaveRequests.ts    # fetchLeaveRequests, createLeaveRequest, updateLeaveRequestStatus
      profiles.ts         # fetchProfile
    schemas/
      auth.ts             # signInSchema, signUpSchema (zod)
      leaveRequest.ts     # leaveRequestSchema (zod)
    webhook.ts            # notifyNewRequest, notifyDecision (fire-and-forget)
    utils.ts              # cn, formatDate, formatRelative, countDays, employeeColor, mapSupabaseError
  pages/
    LoginPage.tsx         # Tabs: Sign In / Sign Up
    DashboardPage.tsx     # Table + filter chips + approve/reject dialog
    NewRequestPage.tsx    # Form with date pickers and reason textarea
    CalendarPage.tsx      # react-big-calendar month/week/agenda
    NotFoundPage.tsx      # 404
  App.tsx                 # Router + QueryClientProvider + Toaster
  main.tsx                # React root
  index.css               # Tailwind directives + CSS variables + rbc overrides
```

---

## Conventions

- All components are TypeScript functional components with named exports
- One component per file; export name matches filename
- Hooks in `src/hooks/`, prefixed `use*`
- API/data layer in `src/lib/supabase/` and `src/lib/queries/`
- Forms always use react-hook-form + zod schema in `src/lib/schemas/`
- **Never** write raw fetch effects for server data — use React Query
- **No `any`** — prefer `unknown` and narrow, or `as unknown as T` for Supabase type workarounds
- React 19 pattern: ref as prop, no `forwardRef`
- URL search params for filter state (not `useState`) — enables deep links

---

## Data Model

Schema: [`supabase/migration.sql`](supabase/migration.sql)

**profiles:** `id` (FK auth.users) · `full_name` · `role` (employee|manager) · `created_at`

**leave_requests:** `id` · `employee_id` (FK profiles) · `start_date` · `end_date` · `reason` (10–500 chars) · `status` (pending|approved|rejected) · `decided_by` (FK profiles, nullable) · `decided_at` (nullable) · `created_at`

Constraint: `start_date <= end_date`

---

## Auth & RLS

- Supabase email+password auth. Session auto-refreshes.
- `profiles` → any authenticated user can SELECT; own row UPDATE only.
- `leave_requests` → any authenticated user can SELECT; INSERT own with status='pending'; UPDATE only by managers.
- `ProtectedRoute` redirects to `/login` if `session` is null.
- Manager role assigned manually in Supabase: `UPDATE profiles SET role='manager' WHERE id='...'`

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (safe to ship to client; RLS protects data) |
| `VITE_N8N_NEW_REQUEST_WEBHOOK` | n8n webhook URL for new requests |
| `VITE_N8N_DECISION_WEBHOOK` | n8n webhook URL for decisions |
| `VITE_N8N_WEBHOOK_SECRET` | Shared secret sent in `X-Webhook-Secret` header |
| `VITE_APP_URL` | App base URL (used in Teams notification links) |

Service role key is **never** used in client code and **never** committed.

---

## Webhook Contract

Both webhooks receive a `POST` with `Content-Type: application/json` and `X-Webhook-Secret: <secret>`.

**New request** (`/webhook/leave-new`):
```json
{
  "employee_name": "Jane Smith",
  "employee_email": "",
  "start_date": "2026-06-01",
  "end_date": "2026-06-05",
  "reason": "Annual family holiday",
  "request_id": "uuid"
}
```

**Decision** (`/webhook/leave-decision`):
```json
{
  "employee_name": "Jane Smith",
  "start_date": "2026-06-01",
  "end_date": "2026-06-05",
  "decided_by": "Bob Manager",
  "status": "approved",
  "request_id": "uuid"
}
```

n8n returns `{ "ok": true }` on success, `{ "error": "Unauthorized" }` with status 401 on bad secret.
The app fires webhooks fire-and-forget (`.catch` shows a non-blocking warning toast).

---

## Running Locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

---

## Quality Gates

```bash
npm run typecheck    # zero errors
npm run lint         # zero errors, zero warnings (--max-warnings 0)
npx react-doctor@latest . --verbose   # target ≥ 85, no Critical issues
```

---

## Known Gotchas

- **Supabase trigger:** `on_auth_user_created` creates the `profiles` row on signup. If you sign up and see no profile, check the Supabase trigger logs in the database functions view.
- **Manager role:** All signups default to `employee`. Manually run `UPDATE profiles SET role='manager'` after creating the manager account.
- **n8n activation:** Webhooks must be **activated** in production view (toggle in top-right). Test mode URLs are different and expire.
- **Vercel env vars:** After adding/changing env vars in the Vercel dashboard, you must redeploy for them to take effect.
- **Vite version:** Downgraded to v5 (from v8) due to Node.js 20.16.0 on the dev machine. Vite 8 requires Node.js ≥ 20.19. Update the engine when deploying to CI.
- **react-hook-form `watch()`:** Triggers a `react-hooks/incompatible-library` lint warning from the React Compiler plugin. Suppressed with `// eslint-disable-next-line` — the code is correct, the compiler just won't optimize that component.
- **Hand-written Supabase types:** `src/lib/supabase/types.ts` is manually maintained (not generated by `supabase gen types`). If you add columns, update this file. The `Relationships` array must match FK names exactly for the TypeScript client to accept insert/update calls.
