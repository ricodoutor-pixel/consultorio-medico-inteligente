
-- Personas IA compartilhando o mesmo número WhatsApp (+55 11 99136-3154)
CREATE TABLE IF NOT EXISTS public.ai_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  voice_tone TEXT,
  system_prompt TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL DEFAULT '+5511991363154',
  triggers_intents TEXT[] DEFAULT '{}',
  requires_payment BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personas readable by everyone"
  ON public.ai_personas FOR SELECT USING (true);

CREATE POLICY "Only admins manage personas"
  ON public.ai_personas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Brand assets para timbre de PDF e selos legais
CREATE TABLE IF NOT EXISTS public.brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key TEXT UNIQUE NOT NULL,
  asset_url TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand assets readable by everyone"
  ON public.brand_assets FOR SELECT USING (true);

CREATE POLICY "Only admins manage brand assets"
  ON public.brand_assets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Regras de roteamento por intenção (Brisa → Edilson On apenas após Pix)
CREATE TABLE IF NOT EXISTS public.intent_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key TEXT UNIQUE NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  target_persona_key TEXT NOT NULL REFERENCES public.ai_personas(persona_key),
  requires_payment BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intent_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routing rules readable by everyone"
  ON public.intent_routing_rules FOR SELECT USING (true);

CREATE POLICY "Only admins manage routing rules"
  ON public.intent_routing_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed: 3 personas no MESMO número
INSERT INTO public.ai_personas (persona_key, display_name, avatar_url, voice_tone, system_prompt, triggers_intents, requires_payment) VALUES
('verdinho', 'Verdinho — Recepção Planta y Raiz', '/dr-verdinho.png', 'Acolhedor, hoteleiro hospitalar, animado',
 'Você é o Verdinho, recepcionista hoteleiro hospitalar da Planta y Raiz. Recepcione, identifique a necessidade e encaminhe para a Enfª Brisa (triagem). NUNCA passe paciente direto para o Dr. Edilson.',
 ARRAY['saudacao','duvida_geral','primeiro_contato'], false),
('brisa', 'Enfª Brisa — Triagem Clínica', '/images/brisa-enfermeira.png', 'Profissional, empática, técnica',
 'Você é a Enfª Brisa (IA com Gemini). Faz triagem clínica, gera link Pix de R$30 (Orientação Técnica) ou US$10 (internacional) via Mercado Pago. SOMENTE após confirmação de pagamento e auditoria, encaminha para Dr. Edilson On.',
 ARRAY['triagem','sintomas','agendamento','cannabis_medicinal','pix','pagamento'], false),
('dr_edilson_on', 'Dr. Edilson Bezerra On — Orientação Técnica', '/images/dr-edilson.png', 'Médico técnico, científico, multilíngue PT/EN/ES',
 'Você é o clone digital do Dr. Edilson Bezerra (CRM 10963, CPF 009.536.834-51, Medicina Integrativa, Sta Cruz/BO). Realiza ORIENTAÇÃO TÉCNICA de até 30min (NUNCA "consulta"). Gera pré-prontuário, relatório PDF com timbre Planta y Raiz e assinatura digital gov.br/ICP-Brasil. Sem prescrições, sem diagnósticos.',
 ARRAY['orientacao_tecnica','pos_pagamento','relatorio','pdf_assinado'], true)
ON CONFLICT (persona_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  system_prompt = EXCLUDED.system_prompt,
  triggers_intents = EXCLUDED.triggers_intents,
  updated_at = now();

-- Seed: regras de roteamento
INSERT INTO public.intent_routing_rules (intent_key, keywords, target_persona_key, requires_payment, priority) VALUES
('first_contact', ARRAY['oi','olá','ola','bom dia','boa tarde','boa noite','hello','hola'], 'verdinho', false, 10),
('triage', ARRAY['triagem','sintoma','dor','ansiedade','cannabis','cbd','thc','agendar','quero falar'], 'brisa', false, 50),
('payment', ARRAY['pix','pagar','pagamento','boleto','cartão','mercado pago','30','reais'], 'brisa', false, 60),
('post_payment_orientation', ARRAY['paguei','comprovante','pagamento confirmado','orientação técnica','dr edilson','relatório'], 'dr_edilson_on', true, 100)
ON CONFLICT (intent_key) DO NOTHING;

-- Seed: brand assets para PDF
INSERT INTO public.brand_assets (asset_key, asset_url, description) VALUES
('logo_main', '/og-image.png', 'Logotipo principal Planta y Raiz para timbre de PDF'),
('logo_icon', '/favicon.png', 'Ícone para cabeçalho de relatórios'),
('seal_govbr', 'https://www.gov.br/governodigital/pt-br/identidade/marca/govbr-logo-amarelo.png', 'Selo gov.br para assinatura digital'),
('doctor_signature_block', '/images/dr-edilson.png', 'Bloco assinatura: Dr. Edilson Bezerra · Medicina Integrativa · CRM 10963 · CPF 009.536.834-51 · Sta Cruz/BO')
ON CONFLICT (asset_key) DO NOTHING;

-- Cron semanal: aprendizado autônomo PubMed (40k+ estudos)
SELECT cron.schedule(
  'pubmed-autonomous-learning',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/import-pubmed-bulk',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"query":"medical cannabis OR cannabidiol OR CBD OR THC OR cannabinoid OR endocannabinoid","max_results":1000}'::jsonb
  );
  $$
);
