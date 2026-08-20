-- ================================================================
-- MÓDULO: Cartão Saúde Verde Planta y Raiz
-- ================================================================

CREATE TABLE IF NOT EXISTS public.saude_verde_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_brl DECIMAL(10,2) NOT NULL,
  price_usd DECIMAL(10,2),
  price_eur DECIMAL(10,2),
  period TEXT NOT NULL DEFAULT 'mensal',
  max_beneficiaries INTEGER DEFAULT 1,
  discount_pct_max INTEGER DEFAULT 80,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saude_verde_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.saude_verde_plans(id),
  status TEXT DEFAULT 'pending',
  card_number TEXT UNIQUE,
  card_qrcode_url TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  mp_subscription_id TEXT,
  stripe_subscription_id TEXT,
  currency TEXT DEFAULT 'BRL',
  beneficiaries JSONB DEFAULT '[]',
  total_savings_brl DECIMAL(10,2) DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saude_verde_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  zipcode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  discount_pct INTEGER DEFAULT 40,
  discount_pct_max INTEGER DEFAULT 80,
  price_from_brl DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  accepts_online BOOLEAN DEFAULT FALSE,
  available_specialties JSONB DEFAULT '[]',
  available_exams JSONB DEFAULT '[]',
  opening_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saude_verde_specialties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  price_from_brl DECIMAL(10,2),
  partners_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saude_verde_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.saude_verde_subscriptions(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.saude_verde_partners(id),
  specialty_id UUID REFERENCES public.saude_verde_specialties(id),
  beneficiary_name TEXT,
  appointment_type TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT DEFAULT 'pending',
  original_price_brl DECIMAL(10,2),
  discount_pct INTEGER,
  final_price_brl DECIMAL(10,2),
  savings_brl DECIMAL(10,2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  mp_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saude_verde_partner_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  category TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed plans
INSERT INTO public.saude_verde_plans (slug, name, price_brl, price_usd, price_eur, max_beneficiaries, features, sort_order) VALUES
('verde-individual','Verde Individual',35.00,7.00,6.50,1,
 '["Até 80% desconto em consultas","Exames laboratoriais a partir de R$ 5","Desconto de 50% em farmácias parceiras","Ligue Saúde 24h (WhatsApp Brisa)","Cartão digital QR Code instantâneo","Válido em todo o Brasil","Sem carência"]'::jsonb,1),
('verde-familia','Verde Família',49.00,9.80,9.00,4,
 '["Tudo do Individual","Até 4 beneficiários","Consultas odontológicas inclusas","Vacinas com desconto","Acesso ao Club Planta y Raiz","Suporte prioritário Brisa IA","Relatório de saúde mensal"]'::jsonb,2),
('verde-premium','Verde Premium',99.00,19.80,18.00,6,
 '["Tudo do Família","Até 6 beneficiários","1 Orientação Técnica Cannabis/mês inclusa","Acompanhamento IA 2x/semana","Médico dedicado na plataforma","Rede internacional (EUA, Europa, LatAm)","Taxa zero em todos os serviços","Farmácia do paciente — entrega inclusa"]'::jsonb,3)
ON CONFLICT (slug) DO NOTHING;

-- Seed specialties
INSERT INTO public.saude_verde_specialties (name, slug, category, icon, price_from_brl, is_featured, sort_order) VALUES
('Clínico Geral','clinico-geral','consulta','Stethoscope',20.00,true,1),
('Psiquiatra','psiquiatra','consulta','Brain',60.00,true,2),
('Neurologista','neurologista','consulta','Brain',70.00,true,3),
('Cardiologista','cardiologista','consulta','Heart',65.00,true,4),
('Ortopedista','ortopedista','consulta','Bone',55.00,true,5),
('Ginecologista','ginecologista','consulta','Baby',50.00,true,6),
('Pediatra','pediatra','consulta','Baby',45.00,true,7),
('Dermatologista','dermatologista','consulta','Scan',55.00,true,8),
('Hemograma Completo','hemograma-completo','exame','Droplets',5.00,true,9),
('Glicemia em Jejum','glicemia','exame','TestTube',4.00,true,10),
('Ultrassonografia','ultrassonografia','exame','Waves',35.00,true,11),
('Raio-X','raio-x','exame','Radiation',20.00,true,12),
('Ressonância Magnética','ressonancia-magnetica','exame','Magnet',120.00,false,13),
('Tomografia','tomografia','exame','Scan',90.00,false,14),
('Limpeza Dental','limpeza-dental','odontologia','SmilePlus',30.00,true,15),
('Consulta Nutricional','nutricional','terapia','Apple',40.00,true,16)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.saude_verde_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_verde_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_verde_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_verde_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_verde_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saude_verde_partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_sv_plans" ON public.saude_verde_plans FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_sv_partners" ON public.saude_verde_partners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_sv_specialties" ON public.saude_verde_specialties FOR SELECT USING (TRUE);

CREATE POLICY "users_view_own_sv_subscription" ON public.saude_verde_subscriptions FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "users_insert_own_sv_subscription" ON public.saude_verde_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_manage_sv_subscription" ON public.saude_verde_subscriptions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users_view_own_sv_appointments" ON public.saude_verde_appointments FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "users_insert_own_sv_appointments" ON public.saude_verde_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_insert_sv_partner_requests" ON public.saude_verde_partner_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_view_sv_partner_requests" ON public.saude_verde_partner_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_sv_subscriptions_user ON public.saude_verde_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sv_partners_city ON public.saude_verde_partners(city, state, is_active);
CREATE INDEX IF NOT EXISTS idx_sv_partners_category ON public.saude_verde_partners(category, is_active);
CREATE INDEX IF NOT EXISTS idx_sv_appointments_user ON public.saude_verde_appointments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sv_specialties_featured ON public.saude_verde_specialties(is_featured, sort_order);