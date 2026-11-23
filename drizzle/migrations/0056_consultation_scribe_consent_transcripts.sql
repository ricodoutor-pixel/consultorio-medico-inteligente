-- Escriba da consulta: autorização do paciente (antes da sala) e transcrição guardada no prontuário.
-- O áudio nunca é guardado. Só o servidor (doctor-scribe) grava transcrições; o paciente decide a autorização.

CREATE TABLE IF NOT EXISTS public.consultation_scribe_consents (
  appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  accepted boolean NOT NULL,
  consent_version text NOT NULL DEFAULT 'v1-2026-11-22',
  decided_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consultation_scribe_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.consultation_scribe_consents FROM anon;
GRANT SELECT ON public.consultation_scribe_consents TO authenticated;
GRANT ALL ON public.consultation_scribe_consents TO service_role;
DROP POLICY IF EXISTS consultation_scribe_consents_participants_read ON public.consultation_scribe_consents;
CREATE POLICY consultation_scribe_consents_participants_read ON public.consultation_scribe_consents FOR SELECT TO authenticated
  USING (public.consultation_chat_role(appointment_id) IS NOT NULL OR public.has_role(auth.uid(), 'admin'));

-- Só o paciente da consulta registra (ou muda) a própria decisão.
CREATE OR REPLACE FUNCTION public.set_consultation_scribe_consent(_appointment_id uuid, _accepted boolean)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _at timestamptz := now();
BEGIN
  IF public.consultation_chat_role(_appointment_id) IS DISTINCT FROM 'patient' THEN
    RAISE EXCEPTION 'Somente o paciente desta consulta pode decidir a gravação' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.consultation_scribe_consents (appointment_id, patient_id, accepted, decided_at)
  VALUES (_appointment_id, auth.uid(), _accepted, _at)
  ON CONFLICT (appointment_id) DO UPDATE SET accepted = EXCLUDED.accepted, decided_at = EXCLUDED.decided_at;
  RETURN _at;
END $$;
REVOKE ALL ON FUNCTION public.set_consultation_scribe_consent(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_consultation_scribe_consent(uuid, boolean) TO authenticated;

CREATE TABLE IF NOT EXISTS public.consultation_transcripts (
  appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('ditado', 'consulta')),
  transcript text NOT NULL CHECK (char_length(transcript) <= 60000),
  soap text NOT NULL DEFAULT '',
  attention_points text NOT NULL DEFAULT '',
  consent_decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consultation_transcripts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.consultation_transcripts FROM anon;
GRANT SELECT ON public.consultation_transcripts TO authenticated;
GRANT ALL ON public.consultation_transcripts TO service_role;
DROP POLICY IF EXISTS consultation_transcripts_doctor_read ON public.consultation_transcripts;
CREATE POLICY consultation_transcripts_doctor_read ON public.consultation_transcripts FOR SELECT TO authenticated
  USING (public.consultation_chat_role(appointment_id) = 'doctor' OR public.has_role(auth.uid(), 'admin'));
