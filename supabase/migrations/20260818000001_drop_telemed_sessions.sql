-- Migration para remover a tabela não utilizada telemed_sessions
-- Conforme constatado em auditoria de 2026-08-18, a tabela não tem uso no código fonte (backend/frontend).
-- Todo fluxo do Jitsi e vídeo consultas está operando via a tabela appointments.

-- Removendo triggers antigos caso ainda existam na tabela
DROP TRIGGER IF EXISTS trg_telemed_updated_at ON public.telemed_sessions;

-- Removendo policies atreladas a esta tabela para limpar lixo de RLS
DROP POLICY IF EXISTS "Doctor views own telemed sessions" ON public.telemed_sessions;
DROP POLICY IF EXISTS "Patients view own telemed sessions" ON public.telemed_sessions;
DROP POLICY IF EXISTS "Lobby status readable by patient" ON public.telemed_sessions;
DROP POLICY IF EXISTS "Doctors can create telemed sessions" ON public.telemed_sessions;
DROP POLICY IF EXISTS "Doctors can update own telemed sessions" ON public.telemed_sessions;

-- Removendo os indexes que o Supabase possa ter guardado
DROP INDEX IF EXISTS idx_telemed_consultation;
DROP INDEX IF EXISTS idx_telemed_doctor;
DROP INDEX IF EXISTS idx_telemed_patient;
DROP INDEX IF EXISTS idx_telemed_status;
DROP INDEX IF EXISTS idx_telemed_expires;
DROP INDEX IF EXISTS idx_telemed_token;

-- Por fim, extinguir a tabela
DROP TABLE IF EXISTS public.telemed_sessions CASCADE;
