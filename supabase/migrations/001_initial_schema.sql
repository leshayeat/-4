-- Financial tracker schema for Supabase/PostgreSQL.
-- Apply via Supabase SQL Editor or Supabase CLI.
create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null check (char_length(category) between 1 and 80),
  description text check (description is null or char_length(description) <= 120),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (char_length(category) between 1 and 80),
  month date not null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_month_first_day check (extract(day from month) = 1),
  constraint budgets_user_category_month_unique unique (user_id, category, month)
);

create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month);

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- Each signed-in user can access only rows whose user_id matches their JWT subject.
drop policy if exists "Users read own transactions" on public.transactions;
create policy "Users read own transactions" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own transactions" on public.transactions;
create policy "Users insert own transactions" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own transactions" on public.transactions;
create policy "Users update own transactions" on public.transactions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own transactions" on public.transactions;
create policy "Users delete own transactions" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read own budgets" on public.budgets;
create policy "Users read own budgets" on public.budgets
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own budgets" on public.budgets;
create policy "Users insert own budgets" on public.budgets
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own budgets" on public.budgets;
create policy "Users update own budgets" on public.budgets
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own budgets" on public.budgets;
create policy "Users delete own budgets" on public.budgets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Note: users should not be able to write a different user_id.
-- RLS above enforces this even if a client submits a forged user_id.
