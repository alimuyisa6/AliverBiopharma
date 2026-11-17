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
  if v_paid_referrals>=v_settings.commission_unlock_referrals and v_net_amount>0 and v_net_currency~'^[A-Z]{3}$' then
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
revoke all on function public.process_referral_subscription_payment(bigint) from public,anon,authenticated;
grant execute on function public.process_referral_subscription_payment(bigint) to service_role;
drop function if exists private.process_referral_subscription_payment(bigint);
