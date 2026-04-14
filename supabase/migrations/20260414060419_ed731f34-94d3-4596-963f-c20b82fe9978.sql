CREATE TABLE public.social_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'instagram',
  interaction_type text NOT NULL DEFAULT 'comment',
  post_id text,
  post_url text,
  post_caption text,
  subscriber_id text,
  subscriber_name text,
  subscriber_phone text,
  subscriber_username text,
  subscriber_profile_url text,
  message_content text,
  keyword_matched text,
  sentiment text,
  lead_score integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  flow_triggered text,
  conversion_event text,
  campaign_source text,
  ad_id text,
  geo_location text,
  device_type text,
  engagement_data jsonb DEFAULT '{}',
  funnel_stage text DEFAULT 'awareness',
  responded_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_platform ON public.social_interactions(platform);
CREATE INDEX idx_social_type ON public.social_interactions(interaction_type);
CREATE INDEX idx_social_subscriber ON public.social_interactions(subscriber_id);
CREATE INDEX idx_social_created ON public.social_interactions(created_at DESC);
CREATE INDEX idx_social_funnel ON public.social_interactions(funnel_stage);
CREATE INDEX idx_social_campaign ON public.social_interactions(campaign_source);
CREATE INDEX idx_social_post ON public.social_interactions(post_id);

ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read social interactions"
  ON public.social_interactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage social interactions"
  ON public.social_interactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);