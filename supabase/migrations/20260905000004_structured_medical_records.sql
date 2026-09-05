-- ======================================================================
-- MIGRATION: PRONTUÁRIO ELETRÔNICO ESTRUTURADO & AUDITORIA CFM (Tarefa 1.2)
-- Data: 2026-09-05
-- ======================================================================

-- 1. Criação ou aprimoramento da tabela medical_records (Append-Only)
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
  consultation_id UUID,
  chief_complaint TEXT,
  anamnese TEXT,
  exame_fisico TEXT,
  diagnosis TEXT,
  diagnosis_cid VARCHAR(20),
  hipotese_diagnostica TEXT,
  conduta TEXT,
  treatment_plan TEXT,
  prescricao_snapshot JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  record_hash TEXT,
  signed_at TIMESTAMPTZ,
  signature_hash TEXT,
  version INTEGER DEFAULT 1,
  is_sealed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON public.medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_diagnosis_cid ON public.medical_records(diagnosis_cid);

-- 2. Tabela de Auditoria de Acesso aos Prontuários (LGPD Art. 18 / CFM 2.314 Art. 8º)
CREATE TABLE IF NOT EXISTS public.medical_record_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
  accessed_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  access_role TEXT NOT NULL, -- 'patient', 'doctor', 'admin', 'auditor'
  access_type TEXT NOT NULL, -- 'view', 'export_pdf', 'export_fhir', 'audit'
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_rec_access_log_record_id ON public.medical_record_access_log(record_id);
CREATE INDEX IF NOT EXISTS idx_med_rec_access_log_user_id ON public.medical_record_access_log(accessed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_med_rec_access_log_accessed_at ON public.medical_record_access_log(accessed_at DESC);

-- 3. RLS e Segurança
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_access_log ENABLE ROW LEVEL SECURITY;

-- Políticas para medical_records
DROP POLICY IF EXISTS "Patients can view own medical records" ON public.medical_records;
CREATE POLICY "Patients can view own medical records"
  ON public.medical_records FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can view relevant medical records" ON public.medical_records;
CREATE POLICY "Doctors can view relevant medical records"
  ON public.medical_records FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "Doctors can insert medical records" ON public.medical_records;
CREATE POLICY "Doctors can insert medical records"
  ON public.medical_records FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Políticas para medical_record_access_log
DROP POLICY IF EXISTS "Users can view audit of own medical records" ON public.medical_record_access_log;
CREATE POLICY "Users can view audit of own medical records"
  ON public.medical_record_access_log FOR SELECT
  TO authenticated
  USING (
    accessed_by_user_id = auth.uid()
    OR record_id IN (SELECT id FROM public.medical_records WHERE patient_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "Users can record access log" ON public.medical_record_access_log;
CREATE POLICY "Users can record access log"
  ON public.medical_record_access_log FOR INSERT
  TO authenticated
  WITH CHECK (accessed_by_user_id = auth.uid());

-- 4. Trigger de Imutabilidade (Append-Only Enforcement): Bloqueia UPDATE e DELETE
CREATE OR REPLACE FUNCTION enforce_medical_records_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_sealed = true THEN
      RAISE EXCEPTION 'Prontuário Médico Imutável: De acordo com a Resolução CFM nº 1.821/2007 e CFM nº 2.314/2022, registros médicos selados não podem ser alterados.';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Exclusão Vedada: Prontuários médicos possuem retenção obrigatória por 20 anos (Resolução CFM nº 1.821/2007) e não podem ser apagados.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_medical_records_immutability ON public.medical_records;
CREATE TRIGGER trg_enforce_medical_records_immutability
BEFORE UPDATE OR DELETE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION enforce_medical_records_immutability();

-- 5. Trigger para geração de Hash de Integridade se ausente
CREATE OR REPLACE FUNCTION generate_medical_record_hash()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_content TEXT;
BEGIN
  IF NEW.record_hash IS NULL THEN
    v_raw_content := COALESCE(NEW.patient_id::text, '') || '|' ||
                     COALESCE(NEW.doctor_id::text, '') || '|' ||
                     COALESCE(NEW.chief_complaint, '') || '|' ||
                     COALESCE(NEW.diagnosis, '') || '|' ||
                     COALESCE(NEW.diagnosis_cid, '') || '|' ||
                     COALESCE(NEW.treatment_plan, '') || '|' ||
                     COALESCE(NEW.created_at::text, now()::text);
    NEW.record_hash := encode(digest(v_raw_content, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_medical_record_hash ON public.medical_records;
CREATE TRIGGER trg_generate_medical_record_hash
BEFORE INSERT ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION generate_medical_record_hash();

COMMENT ON TABLE public.medical_records IS 'Prontuários eletrônicos imutáveis e auditados nos termos da Resolução CFM nº 1.821/2007 e CFM nº 2.314/2022.';
COMMENT ON TABLE public.medical_record_access_log IS 'Trilha de auditoria de acessos aos prontuários em conformidade com o Art. 18 da LGPD.';
