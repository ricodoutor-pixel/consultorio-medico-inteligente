
CREATE TABLE public.site_counters (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read counters" ON public.site_counters FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update counters" ON public.site_counters FOR UPDATE TO public USING (true) WITH CHECK (true);

INSERT INTO public.site_counters (id, count) VALUES ('ebook_downloads', 8000);
