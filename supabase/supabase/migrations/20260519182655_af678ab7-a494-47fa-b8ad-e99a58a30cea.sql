
CREATE TABLE IF NOT EXISTS public.meta_token_storage (
  id text PRIMARY KEY,
  token text NOT NULL,
  user_token text,
  expires_at timestamptz,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_token_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_meta_token" ON public.meta_token_storage
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
