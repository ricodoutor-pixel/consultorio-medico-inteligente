-- Add pix_key to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS pix_key text;

-- Create payout history table
CREATE TABLE public.payout_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  pix_key text NOT NULL,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  weighted_score numeric NOT NULL DEFAULT 0,
  share_percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  mercadopago_payment_id text,
  error_message text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own payouts"
ON public.payout_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payouts"
ON public.payout_history FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient queries
CREATE INDEX idx_payout_history_doctor_period ON public.payout_history(doctor_id, period_month, period_year);
CREATE INDEX idx_payout_history_status ON public.payout_history(status);