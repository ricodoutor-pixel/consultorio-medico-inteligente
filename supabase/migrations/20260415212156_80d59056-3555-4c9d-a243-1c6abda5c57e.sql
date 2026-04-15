
-- Consultation queue for Uber-style matching
CREATE TABLE IF NOT EXISTS public.consultation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  matched_doctor_id UUID,
  specialty TEXT DEFAULT 'Cannabis Medicinal',
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  payment_confirmed BOOLEAN DEFAULT false,
  payment_id TEXT,
  amount NUMERIC DEFAULT 30,
  matched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  jitsi_room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescription carts for one-click checkout
CREATE TABLE IF NOT EXISTS public.prescription_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  completed_at TIMESTAMPTZ,
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.consultation_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_patient ON public.consultation_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_doctor ON public.consultation_queue(matched_doctor_id);
CREATE INDEX IF NOT EXISTS idx_cart_token ON public.prescription_carts(cart_token);
CREATE INDEX IF NOT EXISTS idx_cart_patient ON public.prescription_carts(patient_id);
CREATE INDEX IF NOT EXISTS idx_cart_status ON public.prescription_carts(status);

-- Enable RLS
ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_carts ENABLE ROW LEVEL SECURITY;

-- RLS: consultation_queue
CREATE POLICY "Patients see own queue entries" ON public.consultation_queue
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can join queue" ON public.consultation_queue
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can cancel own queue" ON public.consultation_queue
  FOR UPDATE USING (auth.uid() = patient_id AND status = 'waiting');

CREATE POLICY "Doctors see waiting and matched entries" ON public.consultation_queue
  FOR SELECT USING (
    status = 'waiting' 
    OR matched_doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid())
  );

CREATE POLICY "Doctors can accept queue entries" ON public.consultation_queue
  FOR UPDATE USING (
    status = 'waiting'
    OR matched_doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid())
  );

CREATE POLICY "Admins manage queue" ON public.consultation_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: prescription_carts
CREATE POLICY "Patients see own carts" ON public.prescription_carts
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can create carts for patients" ON public.prescription_carts
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid())
  );

CREATE POLICY "Admins manage carts" ON public.prescription_carts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for live queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_queue;
