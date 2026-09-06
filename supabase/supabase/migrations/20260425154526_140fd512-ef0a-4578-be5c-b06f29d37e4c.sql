-- Tabela de identidade visual oficial da Planta y Raiz Ltda
CREATE TABLE IF NOT EXISTS public.brand_identity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  splash_url TEXT NOT NULL,
  favicon_url TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#1B4332',
  secondary_color TEXT NOT NULL DEFAULT '#15803d',
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_identity ENABLE ROW LEVEL SECURITY;

-- Leitura pública (a marca é informação institucional pública)
CREATE POLICY "Brand identity is publicly viewable"
ON public.brand_identity
FOR SELECT
USING (true);

-- Apenas admins podem inserir/atualizar
CREATE POLICY "Only admins can insert brand identity"
ON public.brand_identity
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update brand identity"
ON public.brand_identity
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_brand_identity_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_brand_identity_updated_at
BEFORE UPDATE ON public.brand_identity
FOR EACH ROW
EXECUTE FUNCTION public.update_brand_identity_updated_at();

-- Registro oficial: Dr. Verdinho como identidade da Planta y Raiz Ltda
INSERT INTO public.brand_identity (
  brand_name,
  legal_name,
  logo_url,
  icon_url,
  splash_url,
  favicon_url,
  primary_color,
  secondary_color,
  is_active,
  effective_from,
  notes
) VALUES (
  'Planta y Raiz',
  'Planta y Raiz Ltda',
  '/dr-verdinho-512.png',
  '/dr-verdinho-512.png',
  '/dr-verdinho-512.png',
  '/favicon.ico',
  '#1B4332',
  '#15803d',
  true,
  now(),
  'Dr. Verdinho — Mascote oficial e ícone estático do app Planta y Raiz para todos os dispositivos (iOS, Android, Desktop, PWA). Vigente a partir de 25/04/2026.'
);