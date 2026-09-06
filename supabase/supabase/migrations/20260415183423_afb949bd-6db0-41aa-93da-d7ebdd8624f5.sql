-- Create prescriptions storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- Médicos podem fazer upload de receitas
CREATE POLICY "Doctors can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescriptions' AND auth.uid() IS NOT NULL);

-- Médicos e pacientes podem visualizar receitas
CREATE POLICY "Authenticated users can view prescriptions"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions' AND auth.uid() IS NOT NULL);

-- Add organization_id to doctors, appointments and orders for multi-tenant
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;

-- Index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_doctors_org ON public.doctors(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_org ON public.orders(organization_id);