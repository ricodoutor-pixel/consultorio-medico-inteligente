-- Financeiro do consultório (Kit do Assinante): o médico lê só os próprios números, sem acesso direto às tabelas
-- de auditoria de repasse (que continuam só para admin). Meses no fuso de Brasília.
CREATE OR REPLACE FUNCTION public.doctor_finance_monthly(_months integer DEFAULT 12)
RETURNS TABLE (
  month date,
  released_count integer,
  released_amount numeric,
  withdrawn_net numeric,
  withdrawn_fee numeric,
  withdrawals_pending numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH doc AS (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  ),
  months AS (
    SELECT (date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')) - make_interval(months => g))::date AS month
    FROM generate_series(0, LEAST(GREATEST(COALESCE(_months, 12), 1), 36) - 1) AS g
  ),
  credits AS (
    SELECT date_trunc('month', c.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS month,
           count(*)::integer AS n,
           COALESCE(sum(c.amount), 0) AS total
    FROM public.consultation_credit_audit c
    WHERE c.professional_id IN (SELECT id FROM doc) AND c.payout_status = 'released'
    GROUP BY 1
  ),
  withdrawals AS (
    SELECT date_trunc('month', w.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS month,
           COALESCE(sum(w.net_amount) FILTER (WHERE w.status IN ('paid', 'completed')), 0) AS net,
           COALESCE(sum(w.fee) FILTER (WHERE w.status IN ('paid', 'completed')), 0) AS fee,
           COALESCE(sum(w.net_amount) FILTER (WHERE w.status IN ('pending', 'processing')), 0) AS pending
    FROM public.withdrawal_requests w
    WHERE w.user_id = auth.uid()
    GROUP BY 1
  )
  SELECT m.month,
         COALESCE(c.n, 0),
         COALESCE(c.total, 0),
         COALESCE(w.net, 0),
         COALESCE(w.fee, 0),
         COALESCE(w.pending, 0)
  FROM months m
  LEFT JOIN credits c ON c.month = m.month
  LEFT JOIN withdrawals w ON w.month = m.month
  WHERE auth.uid() IS NOT NULL
  ORDER BY m.month DESC
$$;

REVOKE ALL ON FUNCTION public.doctor_finance_monthly(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doctor_finance_monthly(integer) TO authenticated;
