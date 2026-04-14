
CREATE TABLE public.automation_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'attraction' CHECK (category IN ('attraction', 'conversion', 'retention', 'support')),
  platform text NOT NULL DEFAULT 'manychat',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'draft')),
  ctr numeric DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  last_triggered_at timestamp with time zone,
  error_log text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation_flows"
  ON public.automation_flows FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view automation_flows"
  ON public.automation_flows FOR SELECT
  TO authenticated
  USING (true);
