
-- Medical subscription plans for doctors
CREATE TABLE public.medical_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  plan_tier text NOT NULL DEFAULT 'basic',
  status text NOT NULL DEFAULT 'active',
  amount numeric NOT NULL DEFAULT 99,
  mercadopago_subscription_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_plan_tier CHECK (plan_tier IN ('basic', 'professional', 'premium', 'enterprise'))
);

ALTER TABLE public.medical_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all subscriptions" ON public.medical_subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors view own subscriptions" ON public.medical_subscriptions FOR SELECT TO authenticated
  USING (doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid()));

CREATE POLICY "Doctors create own subscriptions" ON public.medical_subscriptions FOR INSERT TO authenticated
  WITH CHECK (doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid()));

-- Doctor performance metrics (monthly snapshots)
CREATE TABLE public.doctor_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  consultations_count integer NOT NULL DEFAULT 0,
  hours_online numeric NOT NULL DEFAULT 0,
  average_rating numeric NOT NULL DEFAULT 5.0,
  performance_score numeric NOT NULL DEFAULT 0,
  tier_multiplier numeric NOT NULL DEFAULT 1.0,
  weighted_score numeric NOT NULL DEFAULT 0,
  estimated_share numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, month, year)
);

ALTER TABLE public.doctor_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all metrics" ON public.doctor_performance_metrics FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors view own metrics" ON public.doctor_performance_metrics FOR SELECT TO authenticated
  USING (doctor_id IN (SELECT d.id FROM doctors d WHERE d.user_id = auth.uid()));

-- Revenue distribution pool (monthly)
CREATE TABLE public.revenue_distribution_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL,
  year integer NOT NULL,
  total_pool numeric NOT NULL DEFAULT 0,
  distributed_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month, year)
);

ALTER TABLE public.revenue_distribution_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pool" ON public.revenue_distribution_pool FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors view pool" ON public.revenue_distribution_pool FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = auth.uid()));

-- Function to calculate performance score
CREATE OR REPLACE FUNCTION public.calculate_doctor_performance(
  _consultations integer,
  _hours_online numeric,
  _rating numeric,
  _plan_tier text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_score numeric;
  multiplier numeric;
  weighted numeric;
BEGIN
  -- Formula: (Consultas × 0.5) + (HorasOnline × 0.3) + (Avaliacao × 0.2)
  base_score := (_consultations * 0.5) + (_hours_online * 0.3) + (_rating * 0.2);
  
  -- Tier multipliers
  CASE _plan_tier
    WHEN 'enterprise' THEN multiplier := 2.0;
    WHEN 'premium' THEN multiplier := 1.5;
    WHEN 'professional' THEN multiplier := 1.2;
    ELSE multiplier := 1.0;
  END CASE;
  
  weighted := base_score * multiplier;
  
  RETURN jsonb_build_object(
    'base_score', round(base_score, 2),
    'multiplier', multiplier,
    'weighted_score', round(weighted, 2)
  );
END;
$$;
