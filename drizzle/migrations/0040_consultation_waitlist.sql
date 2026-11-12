-- Lista de espera da agenda: o paciente pede aviso quando abrir horário com o médico escolhido.
-- O cron consultation-reminders confere a agenda real (get_available_days) e avisa uma vez por WhatsApp.
CREATE TABLE IF NOT EXISTS public.consultation_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL DEFAULT auth.uid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  modality text NOT NULL DEFAULT 'video' CHECK (modality IN ('video', 'chat', 'premium', 'renovacao')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS consultation_waitlist_one_active
  ON public.consultation_waitlist (patient_id, doctor_id, modality) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS consultation_waitlist_waiting_idx
  ON public.consultation_waitlist (doctor_id, created_at) WHERE status = 'waiting';

ALTER TABLE public.consultation_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.consultation_waitlist FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.consultation_waitlist TO authenticated;
GRANT ALL ON public.consultation_waitlist TO service_role;

DROP POLICY IF EXISTS consultation_waitlist_own_read ON public.consultation_waitlist;
CREATE POLICY consultation_waitlist_own_read ON public.consultation_waitlist
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS consultation_waitlist_own_insert ON public.consultation_waitlist;
CREATE POLICY consultation_waitlist_own_insert ON public.consultation_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() AND status = 'waiting' AND notified_at IS NULL);

-- O paciente só pode cancelar a própria inscrição; o aviso (notified) é gravado pelo servidor.
DROP POLICY IF EXISTS consultation_waitlist_own_cancel ON public.consultation_waitlist;
CREATE POLICY consultation_waitlist_own_cancel ON public.consultation_waitlist
  FOR UPDATE TO authenticated
  USING (patient_id = auth.uid() AND status = 'waiting')
  WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');
