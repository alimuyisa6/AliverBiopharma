create unique index if not exists idx_user_subscriptions_payment_id_unique on public.user_subscriptions (payment_id) where payment_id is not null;
