
CREATE OR REPLACE FUNCTION public.cleanup_http_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_deleted bigint;
  v_remaining bigint;
BEGIN
  DELETE FROM net._http_response WHERE created < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  SELECT count(*) INTO v_remaining FROM net._http_response;

  -- Restart worker preventivamente para evitar leak de memória
  PERFORM net.worker_restart();

  INSERT INTO public.audit_log (action, table_name, record_id, new_data)
  VALUES (
    'infra_cleanup_performed',
    'net._http_response',
    '00000000-0000-0000-0000-000000000000'::uuid,
    jsonb_build_object(
      'deleted_rows', v_deleted,
      'remaining_rows', v_remaining,
      'worker_restarted', true,
      'executed_at', now()
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_rows', v_deleted,
    'remaining_rows', v_remaining
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_http_logs() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_http_logs() TO service_role;
