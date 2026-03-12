-- ============================================
-- SCHEMA COMPLETO - PLANTA & RAIZ TELEMEDICINA
-- ============================================

-- 1. TABELA DE PERFIS (Médicos e Pacientes)
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('paciente', 'médico', 'admin')),
  crm TEXT UNIQUE, -- Apenas para médicos
  specialty TEXT[], -- Array de especialidades
  avatar_url TEXT,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0, -- Taxa de sucesso em %
  total_consultations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. TABELA DE CONSULTAS E AGENDAMENTOS
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
  meeting_link TEXT,
  price NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) DEFAULT 0.07, -- 7% taxa fixa
  doctor_payout NUMERIC(10,2), -- 93% para o médico
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TRIAGEM INTELIGENTE (Intake Form)
CREATE TABLE patient_intake (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id),
  chief_complaint TEXT NOT NULL, -- Queixa principal (texto livre)
  symptoms TEXT[], -- Array de sintomas
  diagnosed_conditions TEXT[], -- Condições diagnosticadas pela IA
  suggested_specialty TEXT, -- Especialidade sugerida pela IA
  suggested_doctor_id UUID REFERENCES profiles(id),
  medical_history TEXT,
  current_medications TEXT[],
  allergies TEXT[],
  ai_confidence NUMERIC(3,2), -- Confiança da IA (0-1)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. BIBLIOTECA DE CEPAS (Wiki)
CREATE TABLE strains_library (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Para SEO: plantayraiz.com.br/biblioteca/nome-da-cepa
  thc_percentage NUMERIC(5,2),
  cbd_percentage NUMERIC(5,2),
  terpenes TEXT[], -- Ex: ['Limoneno', 'Pineno', 'Mirceno']
  indications TEXT[], -- Ex: ['Ansiedade', 'Dor Crônica', 'Insônia']
  effects TEXT[], -- Ex: ['Relaxante', 'Energizante']
  flavor_profile TEXT,
  growth_difficulty TEXT, -- 'fácil', 'médio', 'difícil'
  flowering_time INTEGER, -- em dias
  description TEXT,
  scientific_content TEXT,
  image_url TEXT,
  seo_keywords TEXT[],
  json_ld JSONB, -- Structured data para SEO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. PRONTUÁRIO MÉDICO DIGITAL
CREATE TABLE medical_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  appointment_id UUID REFERENCES appointments(id),
  diagnosis TEXT,
  treatment_plan TEXT,
  prescribed_strain TEXT REFERENCES strains_library(name),
  dosage TEXT,
  frequency TEXT,
  duration_days INTEGER,
  notes TEXT,
  attachments JSONB, -- URLs de arquivos criptografados
  is_encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. PRESCRIÇÕES DIGITAIS
CREATE TABLE prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medical_record_id UUID NOT NULL REFERENCES medical_records(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  strain_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  pdf_url TEXT,
  qr_code TEXT, -- Para validação em farmácias
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. MARKETPLACE DE INSUMOS
CREATE TABLE marketplace_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'medicamento', 'acessório', 'suplemento'
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  pharmacy_partner_id UUID, -- ID da farmácia parceira
  stock_quantity INTEGER DEFAULT 0,
  requires_prescription BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. PEDIDOS DO MARKETPLACE
CREATE TABLE marketplace_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  prescription_id UUID REFERENCES prescriptions(id),
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. RELATÓRIOS FINANCEIROS (View)
CREATE VIEW financial_reports AS
SELECT 
  a.id as appointment_id,
  a.price as total_value,
  (a.price * 0.93) as doctor_payout,
  (a.price * 0.07) as platform_revenue,
  a.payment_status,
  a.scheduled_at,
  p.full_name as doctor_name,
  pat.full_name as patient_name
FROM appointments a
JOIN profiles p ON a.doctor_id = p.id
JOIN profiles pat ON a.patient_id = pat.id
WHERE a.status = 'completed';

-- 10. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_specialty ON profiles USING GIN(specialty);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_strains_slug ON strains_library(slug);
CREATE INDEX idx_strains_indications ON strains_library USING GIN(indications);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_marketplace_orders_patient ON marketplace_orders(patient_id);

-- 11. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Política: Pacientes só veem seus próprios dados
CREATE POLICY "Pacientes veem seus próprios dados" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Política: Médicos veem pacientes que consultaram
CREATE POLICY "Médicos veem seus pacientes" ON appointments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = doctor_id) OR
    auth.uid() = (SELECT user_id FROM profiles WHERE id = patient_id) OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- 12. FUNÇÕES PARA AUTOMAÇÃO
CREATE OR REPLACE FUNCTION atualizar_doctor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE profiles
    SET 
      total_consultations = total_consultations + 1,
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.doctor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_doctor_stats
AFTER UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION atualizar_doctor_stats();

-- 13. FUNÇÃO PARA CALCULAR TAXA AUTOMÁTICA
CREATE OR REPLACE FUNCTION calcular_taxa_plataforma()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee := NEW.price * 0.07;
  NEW.doctor_payout := NEW.price * 0.93;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_taxa
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION calcular_taxa_plataforma();
