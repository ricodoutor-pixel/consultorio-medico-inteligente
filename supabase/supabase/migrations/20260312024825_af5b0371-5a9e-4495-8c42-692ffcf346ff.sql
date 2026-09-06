
-- Tabela de Biblioteca de Cepas para SEO e matching IA
CREATE TABLE IF NOT EXISTS public.strains_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  terpenes text[] DEFAULT '{}',
  thc_cbd_ratio text,
  indications text[] DEFAULT '{}',
  content text,
  category text DEFAULT 'hybrid',
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS para strains_library (público para leitura)
ALTER TABLE public.strains_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view strains library"
  ON public.strains_library FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage strains library"
  ON public.strains_library FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- View de relatório financeiro automático (split 7%)
CREATE OR REPLACE VIEW public.financial_reports AS
SELECT 
  id as appointment_id,
  doctor_id,
  patient_id,
  amount as total_value,
  ROUND((amount * 0.93)::numeric, 2) as doctor_payout,
  ROUND((amount * 0.07)::numeric, 2) as platform_revenue,
  status,
  payment_status,
  scheduled_at,
  created_at
FROM public.appointments;
