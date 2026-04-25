-- Tabela de Clínicas Online (White-label) — cada médico/clínica pode ter sua própria identidade visual e domínio
CREATE TABLE IF NOT EXISTS public.clinic_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  domain TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1B4332',
  secondary_color TEXT DEFAULT '#15803d',
  tagline TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_profiles_slug ON public.clinic_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_clinic_profiles_domain ON public.clinic_profiles(domain);
CREATE INDEX IF NOT EXISTS idx_clinic_profiles_owner ON public.clinic_profiles(owner_user_id);

ALTER TABLE public.clinic_profiles ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas de clínicas ativas (necessário para o site público da clínica)
CREATE POLICY "Public can view active clinics"
ON public.clinic_profiles
FOR SELECT
USING (active = true);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all clinics"
ON public.clinic_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem criar / editar / remover
CREATE POLICY "Admins can insert clinics"
ON public.clinic_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clinics"
ON public.clinic_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clinics"
ON public.clinic_profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_clinic_profiles_updated_at
BEFORE UPDATE ON public.clinic_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_brand_identity_updated_at();