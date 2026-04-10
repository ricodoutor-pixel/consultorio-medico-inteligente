
-- ===========================
-- FASE 15: NPS - 5 Tabelas
-- ===========================

-- Tabela 1: nps_responses
CREATE TABLE public.nps_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  score INT NOT NULL,
  category TEXT NOT NULL,
  feedback TEXT,
  sentiment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_nps_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score < 0 OR NEW.score > 10 THEN
    RAISE EXCEPTION 'Score must be between 0 and 10';
  END IF;
  IF NEW.category NOT IN ('detractor', 'passive', 'promoter') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  IF NEW.sentiment IS NOT NULL AND NEW.sentiment NOT IN ('positive', 'negative', 'neutral') THEN
    RAISE EXCEPTION 'Invalid sentiment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_nps_response
BEFORE INSERT OR UPDATE ON public.nps_responses
FOR EACH ROW EXECUTE FUNCTION public.validate_nps_response();

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own NPS" ON public.nps_responses
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Users can view own NPS responses" ON public.nps_responses
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Admins can manage all NPS" ON public.nps_responses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 2: nps_analytics
CREATE TABLE public.nps_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL,
  period_date DATE NOT NULL,
  total_responses INT NOT NULL DEFAULT 0,
  avg_score DECIMAL(3,1),
  nps_score INT,
  promoters INT NOT NULL DEFAULT 0,
  passives INT NOT NULL DEFAULT 0,
  detractors INT NOT NULL DEFAULT 0,
  response_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage NPS analytics" ON public.nps_analytics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view NPS analytics" ON public.nps_analytics
  FOR SELECT TO authenticated
  USING (true);

-- Tabela 3: nps_professional
CREATE TABLE public.nps_professional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL UNIQUE,
  total_responses INT NOT NULL DEFAULT 0,
  avg_score DECIMAL(3,1),
  nps_score INT,
  promoters INT NOT NULL DEFAULT 0,
  passives INT NOT NULL DEFAULT 0,
  detractors INT NOT NULL DEFAULT 0,
  last_response_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_professional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own NPS stats" ON public.nps_professional
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage NPS professional" ON public.nps_professional
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 4: nps_alerts
CREATE TABLE public.nps_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.nps_responses(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'low_score',
  severity TEXT NOT NULL DEFAULT 'medium',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own alerts" ON public.nps_alerts
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage all alerts" ON public.nps_alerts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 5: nps_feedback_analysis
CREATE TABLE public.nps_feedback_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.nps_responses(id) ON DELETE CASCADE,
  keywords JSONB,
  topics JSONB,
  sentiment VARCHAR(50),
  sentiment_score INT,
  action_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_feedback_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feedback analysis" ON public.nps_feedback_analysis
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===========================
-- FASE 16: GAMIFICAÇÃO - 7 Tabelas
-- ===========================

-- Tabela 6: gamification_metas
CREATE TABLE public.gamification_metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  nps_target INT NOT NULL,
  bonus_amount INT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own metas" ON public.gamification_metas
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage all metas" ON public.gamification_metas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 7: gamification_bonuses
CREATE TABLE public.gamification_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  meta_id UUID REFERENCES public.gamification_metas(id),
  bonus_type TEXT NOT NULL DEFAULT 'nps_achievement',
  amount INT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  distributed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own bonuses" ON public.gamification_bonuses
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage all bonuses" ON public.gamification_bonuses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 8: gamification_badges
CREATE TABLE public.gamification_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  criteria JSONB,
  rarity TEXT NOT NULL DEFAULT 'common',
  bonus_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.gamification_badges
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage badges" ON public.gamification_badges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 9: gamification_achievements
CREATE TABLE public.gamification_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.gamification_badges(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own achievements" ON public.gamification_achievements
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Authenticated can view all achievements" ON public.gamification_achievements
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage achievements" ON public.gamification_achievements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 10: gamification_leaderboard
CREATE TABLE public.gamification_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL UNIQUE,
  nps_score INT NOT NULL DEFAULT 0,
  total_bonuses INT NOT NULL DEFAULT 0,
  achievement_count INT NOT NULL DEFAULT 0,
  rank INT NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view leaderboard" ON public.gamification_leaderboard
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage leaderboard" ON public.gamification_leaderboard
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 11: gamification_streak
CREATE TABLE public.gamification_streak (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL UNIQUE,
  current_streak INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak_broken_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.gamification_streak ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own streak" ON public.gamification_streak
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage streaks" ON public.gamification_streak
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela 12: gamification_history
CREATE TABLE public.gamification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view own history" ON public.gamification_history
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can manage history" ON public.gamification_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_nps_responses_patient ON public.nps_responses(patient_id);
CREATE INDEX idx_nps_responses_professional ON public.nps_responses(professional_id);
CREATE INDEX idx_nps_responses_created ON public.nps_responses(created_at DESC);
CREATE INDEX idx_nps_alerts_status ON public.nps_alerts(status);
CREATE INDEX idx_gamification_metas_professional ON public.gamification_metas(professional_id);
CREATE INDEX idx_gamification_metas_status ON public.gamification_metas(status);
CREATE INDEX idx_gamification_bonuses_professional ON public.gamification_bonuses(professional_id);
CREATE INDEX idx_gamification_bonuses_status ON public.gamification_bonuses(status);
CREATE INDEX idx_gamification_leaderboard_rank ON public.gamification_leaderboard(rank);
CREATE INDEX idx_gamification_history_professional ON public.gamification_history(professional_id);
