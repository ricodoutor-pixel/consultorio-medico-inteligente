
-- Table for granular doctor availability slots
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  time_slot TEXT NOT NULL, -- e.g. "08:00", "08:30"
  status TEXT NOT NULL DEFAULT 'available', -- available, reserved, booked
  reserved_by UUID,
  reserved_until TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, slot_date, time_slot)
);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see available slots
CREATE POLICY "Anyone can view available slots"
ON public.doctor_availability FOR SELECT
TO authenticated
USING (true);

-- Doctors can manage their own slots
CREATE POLICY "Doctors can manage own slots"
ON public.doctor_availability FOR ALL
TO authenticated
USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Patients can reserve available slots (update status)
CREATE POLICY "Patients can reserve slots"
ON public.doctor_availability FOR UPDATE
TO authenticated
USING (status = 'available' OR reserved_by = auth.uid())
WITH CHECK (reserved_by = auth.uid());

-- Admins full access
CREATE POLICY "Admins manage all availability"
ON public.doctor_availability FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_doctor_availability_lookup ON public.doctor_availability(doctor_id, slot_date, status);

-- Add onboarding flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS health_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cannabis_experience TEXT;
