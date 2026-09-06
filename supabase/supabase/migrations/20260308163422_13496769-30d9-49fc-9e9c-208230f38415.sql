CREATE TABLE public.payment_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount numeric DEFAULT 0,
  payer_email text DEFAULT 'unknown',
  action text,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhooks" ON public.payment_webhooks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert webhooks" ON public.payment_webhooks
  FOR INSERT TO anon
  WITH CHECK (true);