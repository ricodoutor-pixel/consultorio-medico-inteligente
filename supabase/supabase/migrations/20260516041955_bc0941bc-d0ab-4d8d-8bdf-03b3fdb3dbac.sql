
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;

CREATE POLICY "Public can create validated leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 2 AND 120
    AND char_length(whatsapp) BETWEEN 10 AND 20
    AND char_length(source) BETWEEN 1 AND 60
    AND lead_score BETWEEN 0 AND 100
  );
