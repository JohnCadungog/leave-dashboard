-- Leave Request Management System — Database Migration
-- Run this in the Supabase SQL editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('employee','manager')) default 'employee',
  created_at timestamptz default now()
);

-- Leave requests
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null check (char_length(reason) between 10 and 500),
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  created_at timestamptz default now(),
  constraint valid_date_range check (start_date <= end_date)
);

create index idx_leave_requests_status on leave_requests(status);
create index idx_leave_requests_employee on leave_requests(employee_id);
create index idx_leave_requests_dates on leave_requests(start_date, end_date);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'employee');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable RLS
alter table profiles enable row level security;
alter table leave_requests enable row level security;

-- profiles policies
create policy "Profiles readable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- leave_requests policies
create policy "Leave requests readable by authenticated users"
  on leave_requests for select to authenticated using (true);

create policy "Users can create own leave requests"
  on leave_requests for insert to authenticated
  with check (employee_id = auth.uid() and status = 'pending');

create policy "Managers can update leave requests"
  on leave_requests for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager')
  );

-- Promote a user to manager (run manually after creating the manager account)
-- update profiles set role = 'manager' where id = '<manager-user-id>';
