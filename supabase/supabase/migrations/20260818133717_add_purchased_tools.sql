ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS purchased_tools JSONB DEFAULT '[]'::jsonb;
