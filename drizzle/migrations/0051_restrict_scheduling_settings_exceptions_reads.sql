DROP POLICY IF EXISTS "Leitura publica de configuracoes de agendamento" ON public.doctor_scheduling_settings;
DROP POLICY IF EXISTS "Leitura publica de excecoes de disponibilidade" ON public.doctor_availability_exceptions;
REVOKE SELECT ON public.doctor_scheduling_settings FROM anon;
REVOKE SELECT ON public.doctor_availability_exceptions FROM anon;