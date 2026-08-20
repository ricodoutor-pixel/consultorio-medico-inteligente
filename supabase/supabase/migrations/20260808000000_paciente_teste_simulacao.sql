-- 1. Limpa registros anteriores de teste se existirem
DELETE FROM public.consultations WHERE patient_id IN (SELECT id FROM public.profiles WHERE email = 'paciente.teste@plantayraiz.com.br');
DELETE FROM public.profiles WHERE email = 'paciente.teste@plantayraiz.com.br';

-- 2. Cria ou garante o Paciente Teste no Auth/Profiles
DO $$
DECLARE
  v_patient_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Garante inserção na profiles
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    v_patient_id, 
    'Paciente Teste (Simulação IA)', 
    'paciente.teste@plantayraiz.com.br', 
    'patient',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  )
  ON CONFLICT (id) DO UPDATE SET full_name = 'Paciente Teste (Simulação IA)';

  -- Registra consulta simulada pronta/paga no consultório virtual para todos os médicos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultations') THEN
    INSERT INTO public.consultations (id, doctor_id, patient_id, status, scheduled_at, payment_status, consultation_type)
    SELECT 
      gen_random_uuid(),
      d.user_id,
      v_patient_id,
      'ready_for_consultation',
      now(),
      'paid',
      'simulation'
    FROM public.doctors d
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3. Tabela de Simulações e Ranking do Médico com PlantaCoins
CREATE TABLE IF NOT EXISTS public.doctor_simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id INT NOT NULL DEFAULT 1,
  scenario_title TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Médio',
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  rapport_score INT DEFAULT 20,
  anamnesis_score INT DEFAULT 20,
  taboo_score INT DEFAULT 20,
  posology_score INT DEFAULT 20,
  followup_score INT DEFAULT 20,
  feedback_suggestions JSONB DEFAULT '[]'::jsonb,
  plantacoins_earned INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.doctor_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos podem ler e inserir suas próprias simulações" 
  ON public.doctor_simulations 
  FOR ALL 
  USING (auth.uid() = doctor_id);

-- Tabela de Carteira PlantaCoin para Médicos
CREATE TABLE IF NOT EXISTS public.doctor_plantacoins (
  doctor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  total_earned INT DEFAULT 0,
  level_badge TEXT DEFAULT 'Iniciante',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctor_plantacoins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos podem ver suas PlantaCoins"
  ON public.doctor_plantacoins
  FOR ALL
  USING (auth.uid() = doctor_id);
