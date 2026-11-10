alter table public.referral_reward_ledger
  drop constraint if exists referral_reward_ledger_currency_check;
alter table public.referral_reward_ledger
  add constraint referral_reward_ledger_currency_check
  check (currency = upper(currency) and currency ~ '^[A-Z0-9]{3,12}$');

alter table public.referral_payout_requests
  drop constraint if exists referral_payout_requests_currency_check;
alter table public.referral_payout_requests
  add constraint referral_payout_requests_currency_check
  check (currency = upper(currency) and currency ~ '^[A-Z0-9]{3,12}$');

-- NOWPayments outcome currencies can be crypto tickers such as USDTTRC20.
-- The commission amount and its currency must remain paired in the ledger.
create or replace function public.process_referral_subscription_payment(p_payment_id bigint)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_payment public.momo_donations%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_referred_user uuid;
  v_referrer uuid;
  v_amount numeric(18,6);
  v_currency text;
  v_net_amount numeric(18,6);
  v_net_currency text;
  v_commission numeric(18,6);
  v_paid_referrals integer := 0;
  v_rows integer := 0;
  v_settings public.ambassador_program_settings%rowtype;
  v_reward_inserted boolean := false;
  v_commission_inserted boolean := false;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and session_user not in ('postgres','supabase_admin') then raise exception 'Not authorized'; end if;
  select * into v_payment from public.momo_donations where id=p_payment_id and payment_type='subscription'
    and status in ('success','completed') for update;
  if not found then return jsonb_build_object('processed',false,'reason','payment_not_settled'); end if;
  select s.user_id,s.plan_id into v_referred_user,v_plan.id from public.user_subscriptions s
    where s.payment_id=p_payment_id and s.status='active' limit 1;
  if v_referred_user is null then return jsonb_build_object('processed',false,'reason','active_subscription_not_found'); end if;
  select * into v_settings from public.ambassador_program_settings where id=1 and is_active=true;
  if not found then return jsonb_build_object('processed',false,'reason','program_inactive'); end if;
  select coalesce(r.referrer_id,p.referred_by) into v_referrer from public.user_profiles p
    left join public.user_referrals r on r.referred_user_id=p.user_id where p.user_id=v_referred_user;
  if v_referrer is null or v_referrer=v_referred_user then return jsonb_build_object('processed',false,'reason','no_valid_referrer'); end if;
  select * into v_plan from public.subscription_plans where id=v_plan.id;
  v_amount:=coalesce(nullif(v_payment.metadata->>'price_amount','')::numeric,nullif(v_payment.amount,'')::numeric,v_plan.price_amount);
  v_currency:=upper(coalesce(nullif(v_payment.metadata->>'price_currency',''),nullif(v_payment.metadata->>'currency',''),v_plan.currency,'UGX'));
  if v_amount is null or v_amount<=0 or v_currency !~ '^[A-Z]{3}$' then return jsonb_build_object('processed',false,'reason','invalid_payment_amount_or_currency'); end if;
  insert into public.referral_reward_ledger(beneficiary_user_id,referred_user_id,source_payment_id,reward_type,amount,currency,status,description,metadata)
  values(v_referrer,v_referred_user,p_payment_id,'premium_referral_reward',v_settings.referral_reward_amount,v_settings.referral_reward_currency,'available',
    'First successful premium subscription referral reward',jsonb_build_object('payment_currency',v_currency,'payment_amount',v_amount))
  on conflict do nothing;
  get diagnostics v_rows=row_count; v_reward_inserted:=v_rows>0;
  select count(distinct referred_user_id)::integer into v_paid_referrals from public.referral_reward_ledger
    where beneficiary_user_id=v_referrer and reward_type='premium_referral_reward' and status<>'reversed';
  v_net_amount:=nullif(v_payment.metadata->>'net_amount','')::numeric;
  v_net_currency:=upper(coalesce(nullif(v_payment.metadata->>'net_currency',''),v_currency));
  if v_paid_referrals>=v_settings.commission_unlock_referrals and v_net_amount>0 and v_net_currency~'^[A-Z0-9]{3,12}$' then
    v_commission:=round(v_net_amount*v_settings.commission_rate_percent/100.0,6);
    if v_commission>0 then
      insert into public.referral_reward_ledger(beneficiary_user_id,referred_user_id,source_payment_id,reward_type,amount,currency,status,description,metadata)
      values(v_referrer,v_referred_user,p_payment_id,'subscription_commission',v_commission,v_net_currency,'available',
        'Commission on verified net subscription proceeds',jsonb_build_object('rate_percent',v_settings.commission_rate_percent,'net_amount',v_net_amount,'net_currency',v_net_currency))
      on conflict do nothing;
      get diagnostics v_rows=row_count; v_commission_inserted:=v_rows>0;
    end if;
  end if;
  return jsonb_build_object('processed',true,'reward_inserted',v_reward_inserted,'commission_inserted',v_commission_inserted,
    'commission_waiting_for_net_amount',v_paid_referrals>=v_settings.commission_unlock_referrals and coalesce(v_net_amount,0)<=0);
end;
$$;

create or replace function public.request_referral_payout(p_user_id uuid,p_amount numeric,p_currency text,p_payout_method text,p_payout_details jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_settings public.ambassador_program_settings%rowtype;
  v_referral_count integer;
  v_balance numeric(18,6);
  v_payout public.referral_payout_requests%rowtype;
begin
  if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role'
     and session_user not in ('postgres','supabase_admin') then raise exception 'Not authorized'; end if;
  if p_amount is null or p_amount<=0 or upper(p_currency)!~'^[A-Z0-9]{3,12}$' then raise exception 'Invalid payout amount or currency'; end if;
  if length(coalesce(p_payout_method,''))=0 or length(p_payout_method)>40 then raise exception 'Invalid payout method'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select * into v_settings from public.ambassador_program_settings where id=1 and is_active=true;
  if not found then raise exception 'Ambassador programme is not active'; end if;
  select count(distinct referred_user_id)::integer into v_referral_count from public.referral_reward_ledger
  where beneficiary_user_id=p_user_id and reward_type='premium_referral_reward' and status<>'reversed';
  if v_referral_count<v_settings.withdrawal_eligibility_referrals then raise exception 'You need % successful premium referrals before requesting a payout',v_settings.withdrawal_eligibility_referrals; end if;
  select coalesce(sum(amount),0) into v_balance from public.referral_reward_ledger
  where beneficiary_user_id=p_user_id and currency=upper(p_currency) and status in ('available','paid');
  select v_balance-coalesce(sum(amount),0) into v_balance from public.referral_payout_requests
  where user_id=p_user_id and currency=upper(p_currency) and status in ('requested','under_review','approved','paid');
  if p_amount>coalesce(v_balance,0) then raise exception 'Requested payout exceeds available balance'; end if;
  insert into public.referral_payout_requests(user_id,amount,currency,payout_method,payout_details,status)
  values(p_user_id,p_amount,upper(p_currency),p_payout_method,coalesce(p_payout_details,'{}'::jsonb),'requested')
  returning * into v_payout;
  return jsonb_build_object('id',v_payout.id,'amount',v_payout.amount,'currency',v_payout.currency,'status',v_payout.status,'created_at',v_payout.created_at);
end;
$$;
