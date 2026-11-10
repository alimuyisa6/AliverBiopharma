create schema if not exists private;

create table if not exists public.ambassador_program_settings (
  id smallint primary key default 1 check (id = 1),
  is_active boolean not null default true,
  referral_reward_amount numeric(12,2) not null default 0.50 check (referral_reward_amount >= 0),
  referral_reward_currency text not null default 'USD' check (referral_reward_currency = 'USD'),
  withdrawal_eligibility_referrals integer not null default 10 check (withdrawal_eligibility_referrals > 0),
  commission_unlock_referrals integer not null default 50 check (commission_unlock_referrals >= withdrawal_eligibility_referrals),
  commission_rate_percent numeric(5,2) not null default 10.00 check (commission_rate_percent >= 0 and commission_rate_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.ambassador_program_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.referral_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  beneficiary_user_id uuid not null references auth.users(id) on delete restrict,
  referred_user_id uuid references auth.users(id) on delete set null,
  source_payment_id bigint references public.momo_donations(id) on delete restrict,
  reward_type text not null check (reward_type in ('premium_referral_reward','subscription_commission','payout_debit','reversal','adjustment')),
  amount numeric(18,6) not null check (amount <> 0),
  currency text not null check (currency = upper(currency) and length(currency) = 3),
  status text not null default 'available' check (status in ('pending','available','reversed','paid')),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create unique index if not exists uq_referral_ledger_payment_reward
  on public.referral_reward_ledger (source_payment_id, reward_type)
  where source_payment_id is not null and reward_type in ('subscription_commission','premium_referral_reward');
create unique index if not exists uq_referral_ledger_referred_reward
  on public.referral_reward_ledger (referred_user_id, reward_type)
  where referred_user_id is not null and reward_type = 'premium_referral_reward';
create index if not exists idx_referral_ledger_beneficiary_created
  on public.referral_reward_ledger (beneficiary_user_id, created_at desc);

create table if not exists public.referral_payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(18,6) not null check (amount > 0),
  currency text not null check (currency = upper(currency) and length(currency) = 3),
  payout_method text,
  payout_details jsonb not null default '{}'::jsonb,
  status text not null default 'requested' check (status in ('requested','under_review','approved','paid','rejected','cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_referral_payout_user_created
  on public.referral_payout_requests (user_id, created_at desc);

alter table public.ambassador_program_settings enable row level security;
alter table public.referral_reward_ledger enable row level security;
alter table public.referral_payout_requests enable row level security;

drop policy if exists ambassador_settings_no_client_access on public.ambassador_program_settings;
create policy ambassador_settings_no_client_access on public.ambassador_program_settings for all to anon, authenticated using (false) with check (false);
drop policy if exists referral_ledger_select_own on public.referral_reward_ledger;
create policy referral_ledger_select_own on public.referral_reward_ledger for select to authenticated using ((select auth.uid()) = beneficiary_user_id);
drop policy if exists referral_ledger_no_client_write on public.referral_reward_ledger;
create policy referral_ledger_no_client_write on public.referral_reward_ledger for all to anon, authenticated using (false) with check (false);
drop policy if exists referral_payout_select_own on public.referral_payout_requests;
create policy referral_payout_select_own on public.referral_payout_requests for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists referral_payout_no_client_write on public.referral_payout_requests;
create policy referral_payout_no_client_write on public.referral_payout_requests for all to anon, authenticated using (false) with check (false);

grant select on public.referral_reward_ledger to authenticated;
grant select on public.referral_payout_requests to authenticated;
