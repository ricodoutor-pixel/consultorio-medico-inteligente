
CREATE TABLE public.escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  order_id uuid,
  patient_id uuid NOT NULL,
  doctor_id uuid,
  vendor_id uuid,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  doctor_payout numeric DEFAULT 0,
  vendor_payout numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'held',
  type text NOT NULL DEFAULT 'consultation',
  released_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own escrow" ON public.escrow_transactions
  FOR SELECT TO authenticated USING (patient_id = auth.uid());

CREATE POLICY "Admins can manage escrow" ON public.escrow_transactions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  source_transaction_id uuid REFERENCES public.escrow_transactions(id),
  level integer NOT NULL,
  rate numeric NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated USING (referrer_id = auth.uid());

CREATE POLICY "Admins can manage commissions" ON public.affiliate_commissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  pix_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can request withdrawals" ON public.withdrawal_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage withdrawals" ON public.withdrawal_requests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  referred_by uuid,
  level1_referrer uuid,
  level2_referrer uuid,
  level3_referrer uuid,
  total_referrals integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral" ON public.referral_links
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own referral" ON public.referral_links
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage referrals" ON public.referral_links
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read referral codes" ON public.referral_links
  FOR SELECT TO public USING (true);

CREATE TABLE public.delivery_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid REFERENCES public.escrow_transactions(id) NOT NULL,
  patient_id uuid NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  payout_triggered boolean NOT NULL DEFAULT false
);

ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can confirm deliveries" ON public.delivery_confirmations
  FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Users can view own confirmations" ON public.delivery_confirmations
  FOR SELECT TO authenticated USING (patient_id = auth.uid());

CREATE POLICY "Admins can manage confirmations" ON public.delivery_confirmations
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
