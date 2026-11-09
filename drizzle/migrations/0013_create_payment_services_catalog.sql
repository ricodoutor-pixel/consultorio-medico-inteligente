CREATE TABLE public.payment_services (
  code text PRIMARY KEY,
  display_name text NOT NULL,
  amount_brl numeric(10,2) NOT NULL,
  descriptor text NOT NULL DEFAULT 'PLANTAYRAIZ',
  recurring boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_services TO anon, authenticated;
GRANT ALL ON public.payment_services TO service_role;

ALTER TABLE public.payment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_services_public_read ON public.payment_services
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.payment_services (code, display_name, amount_brl, descriptor, recurring) VALUES
  ('orientacao_tecnica', 'Orientação Técnica — Planta y Raiz', 30.00, 'PLANTAYRAIZ', false),
  ('orientacao', 'Orientação Técnica — Planta y Raiz', 30.00, 'PLANTAYRAIZ', false),
  ('retorno_consulta', 'Retorno — Planta y Raiz', 90.00, 'PLANTAYRAIZ', false),
  ('consulta_chat', 'Consulta por Chat — Planta y Raiz', 100.00, 'PLANTAYRAIZ', false),
  ('consulta_video', 'Consulta por Vídeo — Planta y Raiz', 150.00, 'PLANTAYRAIZ', false),
  ('consulta_premium', 'Consulta Premium — Planta y Raiz', 180.00, 'PLANTAYRAIZ', false),
  ('consulta_canabinoide', 'Consulta Especializada — Planta y Raiz', 250.00, 'PLANTAYRAIZ', false),
  ('plano_paciente', 'Plano Paciente — Planta y Raiz', 99.00, 'PLANTAYRAIZ', true),
  ('plano_medico', 'Plano Médico — Planta y Raiz', 99.00, 'PLANTAYRAIZ', true),
  ('plano_lojista', 'Plano Lojista — Planta y Raiz', 99.00, 'PLANTAYRAIZ', true),
  ('plano_basic', 'Plano Individual Básico — Planta y Raiz', 49.90, 'PLANTAYRAIZ', true),
  ('plano_professional', 'Plano Médico Profissional — Planta y Raiz', 99.90, 'PLANTAYRAIZ', true),
  ('plano_premium', 'Plano Saúde Verde Família — Planta y Raiz', 199.90, 'PLANTAYRAIZ', true),
  ('plano_enterprise', 'Plano Empresa & Parceiros — Planta y Raiz', 499.90, 'PLANTAYRAIZ', true),
  ('tool_combo_tools', 'Combo 11 Módulos Consultório Digital — Planta y Raiz', 97.00, 'PLANTAYRAIZ', false),
  ('tool_cardiaco', 'Módulo Monitor Cardíaco — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_fundoscopia', 'Módulo Fundo de Olho — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_oximetria', 'Módulo Oximetria Óptica — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_dermatoscopia', 'Módulo Dermatoscopia Digital — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_mobilidade', 'Módulo Mobilidade Articular — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_estetoscopio', 'Módulo Estetoscópio Digital IA — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_pulmonar', 'Módulo Ausculta Pulmonar IA — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_tremor', 'Módulo Tremorometria IA — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_urine', 'Módulo Urinálise IA — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_acuity', 'Módulo Acuidade Visual — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false),
  ('tool_gps', 'Módulo Rastreador GPS Cardíaco — Planta y Raiz', 29.90, 'PLANTAYRAIZ', false);