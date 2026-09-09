-- Saque Pix do consultório médico: saldo positivo fica na carteira até o médico solicitar
CREATE OR REPLACE FUNCTION public.request_doctor_pix_payout(_amount numeric)
RETURNS TABLE(withdrawal_id uuid, amount numeric, fee numeric, net_amount numeric, pix_key text, remaining_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_wallet public.doctor_wallets;
  v_fee numeric;
  v_net numeric;
  v_pix text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;

  SELECT * INTO v_wallet FROM public.doctor_wallets
  WHERE user_id = v_uid
  FOR UPDATE;

  IF v_wallet.id IS NULL THEN
    RAISE EXCEPTION 'Carteira do profissional não encontrada';
  END IF;

  v_pix := COALESCE(NULLIF(btrim(v_wallet.pix_key), ''),
                    (SELECT NULLIF(btrim(p.pix_key), '') FROM public.profiles p WHERE p.id = v_uid));

  IF v_pix IS NULL OR length(v_pix) < 5 THEN
    RAISE EXCEPTION 'Cadastre uma chave Pix válida antes de solicitar o saque';
  END IF;

  IF v_wallet.balance < _amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: %', to_char(v_wallet.balance, 'FM999999990.00');
  END IF;

  v_fee := round(_amount * 0.05, 2);
  v_net := round(_amount - v_fee, 2);

  UPDATE public.doctor_wallets
  SET balance = balance - _amount,
      total_withdrawn = COALESCE(total_withdrawn, 0) + _amount,
      pix_key = COALESCE(NULLIF(btrim(pix_key), ''), v_pix),
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.withdrawal_requests (user_id, amount, fee, net_amount, pix_key, status)
  VALUES (v_uid, _amount, v_fee, v_net, v_pix, 'pending')
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, _amount, v_fee, v_net, v_pix, (v_wallet.balance - _amount);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_doctor_pix_payout(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_doctor_pix_payout(numeric) TO authenticated, service_role;

-- Liquidação/estorno do saque (usada apenas pelo backend)
CREATE OR REPLACE FUNCTION public.settle_doctor_pix_payout(_withdrawal_id uuid, _status text, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w public.withdrawal_requests;
BEGIN
  SELECT * INTO v_w FROM public.withdrawal_requests WHERE id = _withdrawal_id FOR UPDATE;
  IF v_w.id IS NULL THEN RAISE EXCEPTION 'Saque não encontrado'; END IF;
  IF v_w.status NOT IN ('pending','processing') THEN RETURN; END IF;

  IF _status IN ('failed','cancelled') THEN
    UPDATE public.doctor_wallets
    SET balance = balance + v_w.amount,
        total_withdrawn = GREATEST(COALESCE(total_withdrawn,0) - v_w.amount, 0),
        updated_at = now()
    WHERE user_id = v_w.user_id;
  END IF;

  UPDATE public.withdrawal_requests
  SET status = _status,
      processed_at = CASE WHEN _status IN ('paid','completed') THEN now() ELSE processed_at END,
      updated_at = now()
  WHERE id = _withdrawal_id;

  INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_data)
  VALUES (v_w.user_id, 'doctor_payout_' || _status, 'withdrawal_requests', _withdrawal_id,
          jsonb_build_object('amount', v_w.amount, 'reason', _reason));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_doctor_pix_payout(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_doctor_pix_payout(uuid, text, text) TO service_role;