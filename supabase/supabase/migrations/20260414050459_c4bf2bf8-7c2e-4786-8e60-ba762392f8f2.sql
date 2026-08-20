
CREATE TABLE public.prescription_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id),
  doctor_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prescription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create own renewal requests"
ON public.prescription_requests FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can view own requests"
ON public.prescription_requests FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view requests for their prescriptions"
ON public.prescription_requests FOR SELECT
TO authenticated
USING (doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid()));

CREATE POLICY "Doctors can update requests"
ON public.prescription_requests FOR UPDATE
TO authenticated
USING (doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid()));

CREATE POLICY "Admins can manage all requests"
ON public.prescription_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
