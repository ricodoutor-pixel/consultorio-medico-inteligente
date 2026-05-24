
-- Subscriptions
CREATE TABLE public.health_card_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('individual','familiar')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','annual')),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','cancelled','expired','past_due')),
  mp_subscription_id TEXT,
  mp_preapproval_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hcs_user ON public.health_card_subscriptions(user_id);
CREATE INDEX idx_hcs_status ON public.health_card_subscriptions(status);
CREATE INDEX idx_hcs_card ON public.health_card_subscriptions(card_number);

ALTER TABLE public.health_card_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_subscription" ON public.health_card_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "users_insert_own_subscription" ON public.health_card_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_update_subscription" ON public.health_card_subscriptions
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_hcs_updated_at BEFORE UPDATE ON public.health_card_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Redemptions (ledger de uso)
CREATE TABLE public.health_card_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.health_card_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_type TEXT CHECK (partner_type IN ('clinic','laboratory','pharmacy','therapy','other')),
  service_description TEXT,
  original_amount NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(10,2) NOT NULL,
  validated_by TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hcr_user ON public.health_card_redemptions(user_id);
CREATE INDEX idx_hcr_sub ON public.health_card_redemptions(subscription_id);
CREATE INDEX idx_hcr_redeemed ON public.health_card_redemptions(redeemed_at DESC);

ALTER TABLE public.health_card_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_redemptions" ON public.health_card_redemptions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_insert_redemptions" ON public.health_card_redemptions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Wallet (saldo PIX)
CREATE TABLE public.health_card_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_loaded NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.health_card_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_wallet" ON public.health_card_wallet
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_manage_wallet" ON public.health_card_wallet
  FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_hcw_updated_at BEFORE UPDATE ON public.health_card_wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet transactions
CREATE TABLE public.health_card_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.health_card_wallet(id) ON DELETE CASCADE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('load_pix','debit_purchase','refund','adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  description TEXT,
  mp_payment_id TEXT,
  partner_name TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hcwt_user ON public.health_card_wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_hcwt_mp ON public.health_card_wallet_transactions(mp_payment_id);

ALTER TABLE public.health_card_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_wallet_tx" ON public.health_card_wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_manage_wallet_tx" ON public.health_card_wallet_transactions
  FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role));

-- RPC: validar token QR dinâmico (janela de 5min via timestamp embutido)
CREATE OR REPLACE FUNCTION public.validate_card_token(
  _card_number TEXT,
  _token TEXT,
  _window_seconds INT DEFAULT 300
)
RETURNS TABLE(valid BOOLEAN, user_id UUID, plan_type TEXT, status TEXT, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_ts BIGINT;
  v_now BIGINT := EXTRACT(EPOCH FROM now())::BIGINT;
BEGIN
  SELECT s.id, s.user_id, s.plan_type, s.status, s.current_period_end
    INTO v_sub
  FROM public.health_card_subscriptions s
  WHERE s.card_number = _card_number
  LIMIT 1;

  IF v_sub.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, 'card_not_found'; RETURN;
  END IF;

  IF v_sub.status <> 'active' THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'subscription_not_active'; RETURN;
  END IF;

  IF v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end < now() THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'subscription_expired'; RETURN;
  END IF;

  -- Token formato: <epoch_window>.<hash> — janela = floor(epoch/window_seconds)
  BEGIN
    v_ts := split_part(_token, '.', 1)::BIGINT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'invalid_token_format'; RETURN;
  END;

  IF abs(v_now - (v_ts * _window_seconds)) > _window_seconds THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'token_expired'; RETURN;
  END IF;

  RETURN QUERY SELECT true, v_sub.user_id, v_sub.plan_type, v_sub.status, 'ok';
END;
$$;

-- RPC: débito atômico da carteira
CREATE OR REPLACE FUNCTION public.debit_health_card_wallet(
  _user_id UUID,
  _amount NUMERIC,
  _description TEXT,
  _partner_name TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance NUMERIC, tx_id UUID, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance NUMERIC;
  v_tx_id UUID;
BEGIN
  IF _amount <= 0 THEN
    RETURN QUERY SELECT false, 0::numeric, NULL::uuid, 'invalid_amount'; RETURN;
  END IF;

  SELECT * INTO v_wallet FROM public.health_card_wallet WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    RETURN QUERY SELECT false, 0::numeric, NULL::uuid, 'wallet_not_found'; RETURN;
  END IF;

  IF v_wallet.balance < _amount THEN
    RETURN QUERY SELECT false, v_wallet.balance, NULL::uuid, 'insufficient_funds'; RETURN;
  END IF;

  v_new_balance := v_wallet.balance - _amount;

  UPDATE public.health_card_wallet
    SET balance = v_new_balance, total_spent = total_spent + _amount, updated_at = now()
    WHERE id = v_wallet.id;

  INSERT INTO public.health_card_wallet_transactions
    (user_id, wallet_id, tx_type, amount, balance_after, description, partner_name)
  VALUES
    (_user_id, v_wallet.id, 'debit_purchase', _amount, v_new_balance, _description, _partner_name)
  RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_new_balance, v_tx_id, 'ok';
END;
$$;

-- RPC: creditar carteira (chamada via service role pelo webhook MP)
CREATE OR REPLACE FUNCTION public.credit_health_card_wallet(
  _user_id UUID,
  _amount NUMERIC,
  _mp_payment_id TEXT
)
RETURNS TABLE(success BOOLEAN, new_balance NUMERIC, tx_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_tx_id UUID;
  v_existing UUID;
BEGIN
  -- Idempotência
  SELECT id INTO v_existing FROM public.health_card_wallet_transactions
    WHERE mp_payment_id = _mp_payment_id AND tx_type = 'load_pix' LIMIT 1;
  IF v_existing IS NOT NULL THEN
    SELECT balance INTO v_new_balance FROM public.health_card_wallet WHERE user_id = _user_id;
    RETURN QUERY SELECT true, v_new_balance, v_existing; RETURN;
  END IF;

  INSERT INTO public.health_card_wallet (user_id, balance, total_loaded)
    VALUES (_user_id, _amount, _amount)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = public.health_card_wallet.balance + _amount,
          total_loaded = public.health_card_wallet.total_loaded + _amount,
          updated_at = now()
    RETURNING id, balance INTO v_wallet_id, v_new_balance;

  INSERT INTO public.health_card_wallet_transactions
    (user_id, wallet_id, tx_type, amount, balance_after, description, mp_payment_id)
  VALUES
    (_user_id, v_wallet_id, 'load_pix', _amount, v_new_balance, 'Carga PIX Cartão Saúde Plus', _mp_payment_id)
  RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT true, v_new_balance, v_tx_id;
END;
$$;
