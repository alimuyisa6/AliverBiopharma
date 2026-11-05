CREATE UNIQUE INDEX IF NOT EXISTS premium_grants_one_per_user_content
ON public.premium_grants(user_id, content_type, content_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_one_per_payment
ON public.user_subscriptions(payment_id)
WHERE payment_id IS NOT NULL;
