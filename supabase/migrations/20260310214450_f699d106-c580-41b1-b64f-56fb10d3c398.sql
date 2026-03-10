
CREATE TABLE public.btc_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  amount numeric NOT NULL,
  wallet_address text NOT NULL DEFAULT '0xad1f4cd9a5aab504e0486438bb49e3ab968af3d1',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.btc_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit BTC subscription" ON public.btc_subscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage BTC subscriptions" ON public.btc_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
