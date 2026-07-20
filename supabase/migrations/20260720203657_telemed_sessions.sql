-- 🌿 Planta y Raiz — Telemed Sessions
-- Tabela principal de sessões de telemedicina (CFM 2.314/2022)
-- Requer: tabela appointments e auth.users existentes

CREATE TABLE IF NOT EXISTS public.telemed_sessions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id  TEXT        NOT NULL UNIQUE,
  patient_name     TEXT,
  doctor_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_id   UUID        REFERENCES public.appointments(id) ON DELETE SET NULL,
  status           TEXT        NOT NULL DEFAULT 'scheduled'
                               CHECK (status IN ('scheduled','active','completed','cancelled')),
  room_name        TEXT        NOT NULL,
  jitsi_domain     TEXT        NOT NULL DEFAULT 'meet.jit.si',
  lobby_enabled    BOOLEAN     NOT NULL DEFAULT true,
  e2ee_enabled     BOOLEAN     NOT NULL DEFAULT true,
  secure_token     TEXT        DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
  started_at       TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_telemed_consultation  ON public.telemed_sessions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_telemed_doctor        ON public.telemed_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_telemed_patient       ON public.telemed_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_telemed_status        ON public.telemed_sessions(status);
CREATE INDEX IF NOT EXISTS idx_telemed_expires       ON public.telemed_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_telemed_token         ON public.telemed_sessions(secure_token);

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_telemed_updated_at ON public.telemed_sessions;
CREATE TRIGGER trg_telemed_updated_at
  BEFORE UPDATE ON public.telemed_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: Row Level Security
ALTER TABLE public.telemed_sessions ENABLE ROW LEVEL SECURITY;

-- Médico autenticado vê suas sessões
CREATE POLICY "Médico vê suas teleconsultas"
  ON public.telemed_sessions FOR SELECT
  USING (auth.uid() = doctor_id);

-- Paciente autenticado vê suas sessões
CREATE POLICY "Paciente vê suas teleconsultas"
  ON public.telemed_sessions FOR SELECT
  USING (auth.uid() = patient_id);

-- Acesso por secure_token (pacientes sem conta / link direto)
CREATE POLICY "Acesso por token seguro"
  ON public.telemed_sessions FOR SELECT
  USING (
    secure_token IS NOT NULL AND
    secure_token = current_setting('request.jwt.claims', true)::jsonb->>'telemed_token'
  );

-- Admin vê tudo
CREATE POLICY "Admin vê todas as teleconsultas"
  ON public.telemed_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (edge functions) pode inserir/atualizar tudo
CREATE POLICY "Service role gerencia teleconsultas"
  ON public.telemed_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- View pública de sessões ativas (sem dados sensíveis)
CREATE OR REPLACE VIEW public.telemed_active_sessions AS
  SELECT id, consultation_id, status, jitsi_domain, lobby_enabled, expires_at
  FROM public.telemed_sessions
  WHERE status = 'active' AND expires_at > NOW();

COMMENT ON TABLE  public.telemed_sessions IS 'Sessões de telemedicina — CFM 2.314/2022 e LGPD';
COMMENT ON COLUMN public.telemed_sessions.secure_token IS 'Token de 32 bytes para link de acesso sem autenticação';
COMMENT ON COLUMN public.telemed_sessions.lobby_enabled IS 'Sala de espera obrigatória — paciente aguarda aprovação do médico';
COMMENT ON COLUMN public.telemed_sessions.e2ee_enabled IS 'Criptografia E2E — conformidade LGPD';

