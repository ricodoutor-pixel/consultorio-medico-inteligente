
ALTER TABLE public.saude_verde_subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_referrer UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expiry_reminded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sv_subs_expires ON public.saude_verde_subscriptions(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sv_subs_affiliate ON public.saude_verde_subscriptions(affiliate_referrer);

CREATE TABLE IF NOT EXISTS public.saude_verde_referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.saude_verde_subscriptions(id) ON DELETE SET NULL,
  payment_id TEXT,
  amount_brl NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id)
);

ALTER TABLE public.saude_verde_referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_sv_referral_commissions"
  ON public.saude_verde_referral_commissions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "affiliates_view_own_sv_commissions"
  ON public.saude_verde_referral_commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_user_id);
