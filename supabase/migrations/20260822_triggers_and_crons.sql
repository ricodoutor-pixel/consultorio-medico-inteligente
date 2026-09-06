-- 1. E-MAIL QUEUE TRIGGERS
CREATE OR REPLACE FUNCTION trg_welcome_email() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_queue (user_id, email_type, subject, body_html, status)
  VALUES (NEW.id, 'welcome', 'Bem-vindo à Planta y Raíz', 'Olá, seu cadastro foi concluído!', 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_welcome ON auth.users;
CREATE TRIGGER on_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION trg_welcome_email();

CREATE OR REPLACE FUNCTION trg_consultation_emails() RETURNS TRIGGER AS $$
BEGIN
  -- Payment / Schedule confirmation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.email_queue (user_id, email_type, subject, body_html, status)
    VALUES (NEW.patient_id, 'consultation_scheduled', 'Sua Consulta foi Agendada', 'Link da sala virtual: https://plantayraiz.com.br/telemedicina/' || NEW.id, 'pending');
  END IF;
  
  -- Finished Consultation (PDF + NPS Delay)
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.email_queue (user_id, email_type, subject, body_html, status)
    VALUES (NEW.patient_id, 'prescription_ready', 'Sua Receita Médica Digital', 'Acesse seu painel para baixar sua receita assinada via ICP-Brasil.', 'pending');
    
    -- Schedule NPS for 24h later
    INSERT INTO public.email_queue (user_id, email_type, subject, body_html, status)
    VALUES (NEW.patient_id, 'nps_survey', 'Como foi seu atendimento?', 'Avalie o Dr. Daniel no Google: https://g.page/r/...', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_consultation_changes ON public.consultations;
CREATE TRIGGER on_consultation_changes
  AFTER INSERT OR UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION trg_consultation_emails();

-- 2. PHARMACY MODULE
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pharmacy_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES public.pharmacies(id),
    prescription_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. META CAPI SCHEDULER
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('meta_capi_scheduler', '*/5 * * * *', $$
  -- Here we trigger the edge function using pg_net or simply log it for backend cron processors
  INSERT INTO public.admin_financial_ledger (reference_id, entry_type, amount, description) 
  VALUES (gen_random_uuid(), 'cron_log', 0, 'meta_capi_scheduler disparado (Meta CAPI / GA4 events)');
$$);
