CREATE TABLE public.medicoes_cardiacas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bpm integer NOT NULL,
  hrv_sdnn numeric,
  classificacao text NOT NULL CHECK (classificacao IN ('normal','atencao','critico')),
  qualidade_sinal text CHECK (qualidade_sinal IN ('fraca','boa','otima')),
  duracao_segundos integer,
  device_info jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medicoes_cardiacas_user ON public.medicoes_cardiacas(user_id, created_at DESC);

ALTER TABLE public.medicoes_cardiacas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own measurements"
  ON public.medicoes_cardiacas FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own measurements"
  ON public.medicoes_cardiacas FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "users delete own measurements"
  ON public.medicoes_cardiacas FOR DELETE
  USING (auth.uid() = user_id);