
-- Affiliate wallets for balance tracking
CREATE TABLE public.affiliate_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  available_balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.affiliate_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage wallets" ON public.affiliate_wallets
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role inserts (edge functions)
CREATE POLICY "Service can upsert wallets" ON public.affiliate_wallets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update wallets" ON public.affiliate_wallets
  FOR UPDATE USING (true);

-- Affiliate withdrawal requests
CREATE TABLE public.affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  pix_key text,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  rejected_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can request withdrawals" ON public.affiliate_withdrawals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage withdrawals" ON public.affiliate_withdrawals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add referred_by to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referrer ON public.affiliate_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_wallets_user ON public.affiliate_wallets(user_id);

-- Function to auto-create wallet on first commission
CREATE OR REPLACE FUNCTION public.ensure_affiliate_wallet(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id uuid;
BEGIN
  SELECT id INTO wallet_id FROM affiliate_wallets WHERE user_id = _user_id;
  IF wallet_id IS NULL THEN
    INSERT INTO affiliate_wallets (user_id) VALUES (_user_id) RETURNING id INTO wallet_id;
  END IF;
  RETURN wallet_id;
END;
$$;

-- Function to credit affiliate commission to wallet
CREATE OR REPLACE FUNCTION public.credit_affiliate_wallet(_user_id uuid, _amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM ensure_affiliate_wallet(_user_id);
  UPDATE affiliate_wallets
  SET available_balance = available_balance + _amount,
      total_earnings = total_earnings + _amount,
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;
