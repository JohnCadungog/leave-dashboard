-- Migration v2 — Adds leave types, employee email, and tightens RLS for employees.
-- Run this in the Supabase SQL Editor AFTER the original migration.sql.

-- 1. Add email column to profiles (for Teams @mentions on decisions)
alter table profiles add column if not exists email text;

-- Backfill email for existing profiles from auth.users
update profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- 2. Update the signup trigger to also persist email
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'employee'
  );
  return new;
end;
$$;

-- 3. Add leave_type to leave_requests
alter table leave_requests
  add column if not exists leave_type text
  check (leave_type in (
    'annual',
    'sick',
    'personal',
    'unpaid',
    'bereavement',
    'other'
  ));

-- Backfill any existing rows with 'other' so the NOT NULL constraint below can be added
update leave_requests set leave_type = 'other' where leave_type is null;

-- Make leave_type required for future inserts
alter table leave_requests alter column leave_type set not null;

-- 4. Tighten employee SELECT policy — employees see only their own requests; managers see all
drop policy if exists "Leave requests readable by authenticated users" on leave_requests;

create policy "Employees see own requests, managers see all"
  on leave_requests for select to authenticated
  using (
    employee_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

-- 5. Approved-leaves view for the shared calendar (everyone can read approved leaves only)
create or replace view approved_leaves_calendar as
  select id, employee_id, start_date, end_date, leave_type, status
  from leave_requests
  where status = 'approved';

-- Grant select on the view
grant select on approved_leaves_calendar to authenticated;
