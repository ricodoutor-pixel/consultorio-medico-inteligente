-- ============================================================================
-- Números reais da plataforma para o "Dashboard Comparativo" da página inicial.
-- Retorna somente totais e séries mensais agregadas (nenhum dado pessoal, nenhum id), por isso pode ser
-- lido sem login. Substitui contadores sorteados no navegador e metas fixas no código.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.public_platform_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')) - interval '23 months',
      date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')),
      interval '1 month'
    )::date AS m
  ),
  signups AS (
    SELECT date_trunc('month', p.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS m, count(*)::int AS n
    FROM public.profiles p
    GROUP BY 1
  ),
  consults AS (
    SELECT date_trunc('month', a.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS m,
           count(*)::int AS n, COALESCE(sum(a.amount), 0)::numeric AS brl
    FROM public.appointments a
    WHERE a.payment_status = 'paid'
    GROUP BY 1
  ),
  ot AS (
    SELECT date_trunc('month', o.paid_at AT TIME ZONE 'America/Sao_Paulo')::date AS m,
           count(*)::int AS n, COALESCE(sum(COALESCE(o.amount_brl, o.amount)), 0)::numeric AS brl
    FROM public.orientacao_tecnica_orders o
    WHERE o.paid_at IS NOT NULL
    GROUP BY 1
  ),
  brisa AS (
    SELECT date_trunc('month', b.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS m,
           count(*)::int AS n, COALESCE(sum(b.amount), 0)::numeric AS brl
    FROM public.brisa_orientacao_payments b
    WHERE b.status = 'approved'
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'users_total', (SELECT count(*) FROM public.profiles),
    'doctors_total', (SELECT count(*) FROM public.doctors_public),
    'consultations_paid', (SELECT COALESCE(sum(n), 0) FROM consults),
    'orientations_paid', (SELECT COALESCE(sum(n), 0) FROM ot) + (SELECT COALESCE(sum(n), 0) FROM brisa),
    'revenue_brl', (SELECT COALESCE(sum(brl), 0) FROM consults) + (SELECT COALESCE(sum(brl), 0) FROM ot) + (SELECT COALESCE(sum(brl), 0) FROM brisa),
    'monthly', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', to_char(mo.m, 'YYYY-MM'),
        'signups', COALESCE(s.n, 0),
        'services', COALESCE(c.n, 0) + COALESCE(o.n, 0) + COALESCE(b.n, 0),
        'revenue_brl', COALESCE(c.brl, 0) + COALESCE(o.brl, 0) + COALESCE(b.brl, 0)
      ) ORDER BY mo.m)
      FROM months mo
      LEFT JOIN signups s ON s.m = mo.m
      LEFT JOIN consults c ON c.m = mo.m
      LEFT JOIN ot o ON o.m = mo.m
      LEFT JOIN brisa b ON b.m = mo.m
    ),
    'users_before_window', (
      SELECT count(*) FROM public.profiles p
      WHERE p.created_at < (date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')) - interval '23 months') AT TIME ZONE 'America/Sao_Paulo'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.public_platform_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.public_platform_stats() TO anon, authenticated, service_role;
