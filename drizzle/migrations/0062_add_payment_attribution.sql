ALTER TABLE public.orientacao_tecnica_orders ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.admin_payment_link_stats(_days int DEFAULT 30)
RETURNS TABLE(produto text, campanha text, pedidos bigint, pagos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT x.produto, x.campanha, count(*), count(*) FILTER (WHERE x.pago)
  FROM (
    SELECT 'orientacao_tecnica'::text AS produto, coalesce(attribution->>'utm_campaign','(sem campanha)') AS campanha,
           status IN ('approved','paid') AS pago
    FROM orientacao_tecnica_orders
    WHERE attribution->>'origem' = 'whatsapp_link' AND created_at > now() - make_interval(days => _days)
    UNION ALL
    SELECT type::text, coalesce(attribution->>'utm_campaign','(sem campanha)'), payment_status = 'paid'
    FROM appointments
    WHERE attribution->>'origem' = 'whatsapp_link' AND created_at > now() - make_interval(days => _days)
  ) x
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY 1,2 ORDER BY 3 DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_payment_link_stats(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_payment_link_stats(int) TO authenticated;