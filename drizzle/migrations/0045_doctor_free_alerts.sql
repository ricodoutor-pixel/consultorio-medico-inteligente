-- "Avise-me quando ficar livre": o paciente vê o médico em consulta (luz amarela) e pede um WhatsApp
-- quando ele voltar a ficar disponível (luz verde). O cron doctor-free-alerts avisa uma única vez.
-- Pedidos sem aviso expiram em 3 horas, para nunca chegar mensagem fora de hora.
CREATE TABLE IF NOT EXISTS public.doctor_free_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL DEFAULT auth.uid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'expired', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS doctor_free_alerts_one_active
  ON public.doctor_free_alerts (patient_id, doctor_id) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS doctor_free_alerts_waiting_idx
  ON public.doctor_free_alerts (doctor_id) WHERE status = 'waiting';

ALTER TABLE public.doctor_free_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.doctor_free_alerts FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.doctor_free_alerts TO authenticated;
GRANT ALL ON public.doctor_free_alerts TO service_role;

DROP POLICY IF EXISTS doctor_free_alerts_own_read ON public.doctor_free_alerts;
CREATE POLICY doctor_free_alerts_own_read ON public.doctor_free_alerts
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS doctor_free_alerts_own_insert ON public.doctor_free_alerts;
CREATE POLICY doctor_free_alerts_own_insert ON public.doctor_free_alerts
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() AND status = 'waiting' AND notified_at IS NULL);

DROP POLICY IF EXISTS doctor_free_alerts_own_cancel ON public.doctor_free_alerts;
CREATE POLICY doctor_free_alerts_own_cancel ON public.doctor_free_alerts
  FOR UPDATE TO authenticated
  USING (patient_id = auth.uid() AND status = 'waiting')
  WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');
