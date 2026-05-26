
-- 1. Trigger updated_at em brisa_orientacao_payments
DROP TRIGGER IF EXISTS trg_brisa_orientacao_updated_at ON public.brisa_orientacao_payments;
CREATE TRIGGER trg_brisa_orientacao_updated_at
BEFORE UPDATE ON public.brisa_orientacao_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Função RPC para marcar consulta concluída (admin/Dr. Edilson) e liberar payout
CREATE OR REPLACE FUNCTION public.complete_brisa_orientacao(_payment_row_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can complete Brisa orientações';
  END IF;

  SELECT * INTO v_row FROM public.brisa_orientacao_payments WHERE id = _payment_row_id FOR UPDATE;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF v_row.status <> 'approved' THEN
    RAISE EXCEPTION 'Payment not approved yet (status=%)', v_row.status;
  END IF;
  IF v_row.consultation_completed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_completed', true);
  END IF;

  UPDATE public.brisa_orientacao_payments
    SET consultation_completed_at = now(),
        payout_released_at = now(),
        raw_payload = COALESCE(raw_payload,'{}'::jsonb) || jsonb_build_object('completion_notes', _notes, 'completed_by', v_uid)
    WHERE id = _payment_row_id;

  RETURN jsonb_build_object('ok', true, 'payment_row_id', _payment_row_id, 'released_at', now());
END;
$$;

-- 3. Auto-release: após 48h aprovado sem reclamação
CREATE OR REPLACE FUNCTION public.auto_release_brisa_orientacao()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.brisa_orientacao_payments
    SET payout_released_at = now(),
        consultation_completed_at = COALESCE(consultation_completed_at, now()),
        raw_payload = COALESCE(raw_payload,'{}'::jsonb) || jsonb_build_object('auto_released', true)
    WHERE status = 'approved'
      AND payout_released_at IS NULL
      AND created_at < now() - interval '48 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'released', v_count, 'at', now());
END;
$$;

-- 4. Cron job (a cada 1h)
SELECT cron.schedule(
  'brisa-orientacao-auto-release',
  '0 * * * *',
  $$ SELECT public.auto_release_brisa_orientacao(); $$
) WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='brisa-orientacao-auto-release');
