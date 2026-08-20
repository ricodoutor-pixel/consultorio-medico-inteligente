
CREATE OR REPLACE FUNCTION public.get_my_sv_renewal_history()
RETURNS TABLE (
  processed_at timestamptz,
  event_type text,
  payment_id text,
  amount numeric,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    we.processed_at,
    we.event_type,
    we.external_reference AS payment_id,
    COALESCE((we.payload #>> '{data,amount}')::numeric,
             (we.payload #>> '{transaction_amount}')::numeric) AS amount,
    COALESCE(we.payload #>> '{status}', we.payload #>> '{data,status}', 'processed') AS status
  FROM public.webhook_events we
  WHERE we.gateway = 'mercadopago'
    AND we.payload #>> '{metadata,module}' = 'saude_verde'
    AND (we.payload #>> '{metadata,user_id}')::uuid = auth.uid()
  ORDER BY we.processed_at DESC
  LIMIT 50;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_sv_renewal_history() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_sv_renewal_history() TO authenticated;
