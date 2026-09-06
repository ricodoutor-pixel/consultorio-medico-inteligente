
CREATE TABLE IF NOT EXISTS public.brisa_orientacao_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  external_reference TEXT NOT NULL,
  status TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  patient_phone TEXT,
  patient_name TEXT,
  patient_email TEXT,
  patient_user_id UUID,
  doctor_notified_at TIMESTAMPTZ,
  patient_notified_at TIMESTAMPTZ,
  consultation_scheduled_at TIMESTAMPTZ,
  consultation_completed_at TIMESTAMPTZ,
  payout_released_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brisa_orientacao_status ON public.brisa_orientacao_payments(status);
CREATE INDEX IF NOT EXISTS idx_brisa_orientacao_phone ON public.brisa_orientacao_payments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_brisa_orientacao_extref ON public.brisa_orientacao_payments(external_reference);

ALTER TABLE public.brisa_orientacao_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all orientacao payments"
ON public.brisa_orientacao_payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Patients can view own orientacao payments"
ON public.brisa_orientacao_payments FOR SELECT
TO authenticated
USING (patient_user_id = auth.uid());
