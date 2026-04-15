
CREATE TABLE public.app_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manychat_user_id text,
  manychat_name text,
  platform text DEFAULT 'unknown',
  source text DEFAULT 'manychat',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_downloads ENABLE ROW LEVEL SECURITY;

-- Webhook público pode inserir
CREATE POLICY "Anyone can insert downloads" ON public.app_downloads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Apenas admins podem visualizar
CREATE POLICY "Admins can view downloads" ON public.app_downloads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem gerenciar
CREATE POLICY "Admins can manage downloads" ON public.app_downloads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_downloads;
