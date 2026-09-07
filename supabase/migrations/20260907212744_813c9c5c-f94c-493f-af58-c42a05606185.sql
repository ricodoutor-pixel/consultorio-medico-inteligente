ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS anvisa_auth text,
  ADD COLUMN IF NOT EXISTS crf text,
  ADD COLUMN IF NOT EXISTS state text;