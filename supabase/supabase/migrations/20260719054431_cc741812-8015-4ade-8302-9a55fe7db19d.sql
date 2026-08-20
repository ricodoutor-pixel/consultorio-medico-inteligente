
CREATE TABLE public.video_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.video_rooms TO authenticated;
GRANT ALL ON public.video_rooms TO service_role;

ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;

-- Only patient or doctor bound to the consultation can read
CREATE POLICY "Patient or doctor can view their room"
ON public.video_rooms FOR SELECT
TO authenticated
USING (
  auth.uid() = patient_id
  OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = video_rooms.doctor_id AND d.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Only patient or the assigned doctor can create a room (must match appointment)
CREATE POLICY "Patient or doctor can create their room"
ON public.video_rooms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = video_rooms.consultation_id
      AND a.patient_id = video_rooms.patient_id
      AND a.doctor_id = video_rooms.doctor_id
      AND (
        a.patient_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = a.doctor_id AND d.user_id = auth.uid())
      )
  )
);

-- Only patient or doctor can update status of their own room
CREATE POLICY "Patient or doctor can update their room"
ON public.video_rooms FOR UPDATE
TO authenticated
USING (
  auth.uid() = patient_id
  OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = video_rooms.doctor_id AND d.user_id = auth.uid())
)
WITH CHECK (
  auth.uid() = patient_id
  OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = video_rooms.doctor_id AND d.user_id = auth.uid())
);

CREATE TRIGGER video_rooms_set_updated_at
BEFORE UPDATE ON public.video_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_video_rooms_consultation ON public.video_rooms(consultation_id);
CREATE INDEX idx_video_rooms_patient ON public.video_rooms(patient_id);
CREATE INDEX idx_video_rooms_doctor ON public.video_rooms(doctor_id);
