# LeaveDesk Project Context

## What This Project Is

LeaveDesk is a leave request management dashboard. Employees log in, submit leave requests, and track their own requests. A manager reviews requests and approves or rejects them. The system sends Microsoft Teams notifications through n8n webhooks.

## Current Requirement Interpretation

The instructor's latest requirements are:

- Employees choose a leave type when submitting a request.
- Employees should only see their own leave requests.
- The manager should be notified when a new leave request is submitted.
- The employee should be notified when the manager approves or rejects the request.
- Notifications should use Microsoft Teams.
- The automation should still use n8n and webhooks.

The safest interpretation is:

```text
Employee submits request
  -> app saves request in Supabase
  -> app calls n8n webhook
  -> n8n notifies manager in Microsoft Teams

Manager approves or rejects request
  -> app updates request in Supabase
  -> app calls n8n webhook
  -> n8n notifies employee in Microsoft Teams
```

Whether the Teams notification must be a 1:1 private chat or can be a Teams channel notification should be confirmed with the instructor. Direct 1:1 Teams messages usually require Microsoft Graph or Microsoft 365 credentials in n8n. A Teams incoming webhook is simpler, but usually posts to a channel.

## Tech Stack

- React 19
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui and Radix UI primitives
- react-router-dom
- TanStack React Query
- react-hook-form
- zod
- Supabase Auth and Postgres
- Supabase Row Level Security
- n8n Cloud webhooks
- Microsoft Teams notifications
- Vercel deployment

## Important Files

- `src/App.tsx`: app routing, protected routes, QueryClient provider, toaster.
- `src/main.tsx`: environment variable guard before loading the app.
- `src/pages/LoginPage.tsx`: sign-in and sign-up forms.
- `src/pages/DashboardPage.tsx`: request table, filters, manager approval/rejection actions.
- `src/pages/NewRequestPage.tsx`: employee request form.
- `src/pages/CalendarPage.tsx`: approved leave calendar.
- `src/components/layout/ProtectedRoute.tsx`: redirects unauthenticated users to login.
- `src/components/layout/Navbar.tsx`: navigation, user menu, theme toggle.
- `src/hooks/useAuth.ts`: current Supabase session and user.
- `src/hooks/useProfile.ts`: current user's profile from Supabase.
- `src/hooks/useLeaveRequests.ts`: React Query hooks for requests and mutations.
- `src/lib/queries/leaveRequests.ts`: Supabase query functions for leave requests.
- `src/lib/queries/profiles.ts`: Supabase query function for profiles.
- `src/lib/supabase/client.ts`: Supabase client.
- `src/lib/supabase/types.ts`: database TypeScript types and leave type constants.
- `src/lib/schemas/auth.ts`: auth form validation.
- `src/lib/schemas/leaveRequest.ts`: leave request form validation.
- `src/lib/webhook.ts`: calls n8n webhooks.
- `supabase/migration.sql`: original schema and RLS.
- `supabase/migration_v2.sql`: adds email, leave types, tighter RLS, approved calendar view.
- `n8n/workflows.json`: n8n workflow export.

## Data Model

### `profiles`

Stores app user profile data linked to Supabase Auth.

Fields:

- `id`: same id as `auth.users.id`
- `full_name`
- `email`
- `role`: `employee` or `manager`
- `created_at`

The signup trigger creates a profile automatically when a new auth user signs up.

### `leave_requests`

Stores each leave request.

Fields:

- `id`
- `employee_id`
- `leave_type`
- `start_date`
- `end_date`
- `reason`
- `status`
- `decided_by`
- `decided_at`
- `created_at`

Allowed leave types:

- `annual`
- `sick`
- `personal`
- `unpaid`
- `bereavement`
- `other`

Allowed statuses:

- `pending`
- `approved`
- `rejected`

## Security Model

Authentication is handled by Supabase email and password auth.

Expected RLS behavior:

- Authenticated users can read profiles.
- Users can update only their own profile.
- Employees can insert only their own pending leave requests.
- Employees can see only their own leave requests.
- Managers can see all leave requests.
- Managers can update leave requests to approve or reject them.

Frontend filtering is not enough for privacy. Supabase RLS must enforce employee-only visibility.

## Main User Flows

### Employee Sign Up

```text
User signs up with email, password, and full name
  -> Supabase creates auth user
  -> database trigger creates profile
  -> profile defaults to employee role
```

### Employee Submit Leave

```text
Employee opens New Request page
  -> selects leave type
  -> selects start and end dates
  -> writes reason
  -> app validates form with zod
  -> app inserts request into Supabase
  -> app calls new request n8n webhook
  -> n8n notifies manager in Teams
```

### Manager Decision

```text
Manager opens Dashboard
  -> sees pending requests
  -> approves or rejects
  -> app updates status, decided_by, and decided_at
  -> app calls decision n8n webhook
  -> n8n notifies employee in Teams
```

### Calendar

```text
Approved requests
  -> displayed on calendar
  -> non-approved requests should not be exposed through calendar data
```

## n8n Webhook Payloads

### New Request

Expected payload:

```json
{
  "employee_name": "Jane Smith",
  "employee_email": "jane@company.com",
  "leave_type": "annual",
  "start_date": "2026-06-01",
  "end_date": "2026-06-05",
  "reason": "Family trip",
  "request_id": "uuid"
}
```

### Decision

Expected payload:

```json
{
  "employee_name": "Jane Smith",
  "employee_email": "jane@company.com",
  "leave_type": "annual",
  "start_date": "2026-06-01",
  "end_date": "2026-06-05",
  "decided_by": "Manager Name",
  "status": "approved",
  "request_id": "uuid"
}
```

Both webhook calls should include:

```text
Content-Type: application/json
X-Webhook-Secret: <shared secret>
```

## Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_N8N_NEW_REQUEST_WEBHOOK`
- `VITE_N8N_DECISION_WEBHOOK`
- `VITE_N8N_WEBHOOK_SECRET`
- `VITE_APP_URL`

Never expose or commit a Supabase service role key.

## Development Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Known Notes

- The original project allowed all authenticated users to see all requests.
- `migration_v2.sql` tightens visibility so employees only see their own requests while managers can see all.
- `migration_v2.sql` adds `profiles.email` so n8n can identify the employee for Teams notification.
- If direct Teams messages are required, n8n likely needs Microsoft Graph or Microsoft 365 credentials.
- If channel notifications are accepted, n8n can use Teams incoming webhooks more simply.
- Keep the n8n webhook flow in the project because the requirement explicitly mentions n8n integration and webhook automation.
