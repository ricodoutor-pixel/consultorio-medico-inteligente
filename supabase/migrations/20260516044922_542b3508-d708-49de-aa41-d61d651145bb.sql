-- Lead status history
CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
  whatsapp_message TEXT,
  whatsapp_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON public.lead_status_history (lead_id, created_at DESC);

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view lead status history"
  ON public.lead_status_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert lead status history"
  ON public.lead_status_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Expand funnel_events allowed funnels for admin-driven status events
DROP POLICY IF EXISTS "Public can insert validated funnel events" ON public.funnel_events;

CREATE POLICY "Public can insert validated funnel events"
  ON public.funnel_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (
      funnel IN ('protocol_calculator','ebook_gate')
      AND char_length(event_name) BETWEEN 2 AND 60
      AND (session_id IS NULL OR char_length(session_id) BETWEEN 8 AND 80)
    )
    OR (
      funnel = 'lead_status'
      AND public.has_role(auth.uid(), 'admin')
      AND char_length(event_name) BETWEEN 2 AND 60
    )
  );