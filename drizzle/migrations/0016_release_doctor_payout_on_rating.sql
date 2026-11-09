CREATE OR REPLACE FUNCTION public.release_appointment_payout_on_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_appt record;
  v_user uuid;
  v_net numeric;
  v_audit uuid;
BEGIN
  SELECT a.id, a.doctor_id, a.patient_id, a.amount INTO v_appt
  FROM public.appointments a
  WHERE a.id = NEW.consultation_id AND a.patient_id = NEW.patient_id AND a.payment_status = 'paid';
  IF NOT FOUND OR v_appt.doctor_id IS NULL OR COALESCE(v_appt.amount,0) <= 0 THEN RETURN NEW; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('payout:' || v_appt.id::text));
  IF EXISTS (SELECT 1 FROM public.consultation_credit_audit
             WHERE consultation_id = v_appt.id AND payout_status = 'released') THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user FROM public.doctors WHERE id = v_appt.doctor_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;
  v_net := round(v_appt.amount * 0.93, 2);

  INSERT INTO public.doctor_wallets (doctor_id, user_id, balance, total_earned, pix_key, pix_type)
  SELECT v_appt.doctor_id, v_user, v_net, v_net, p.pix_key, p.pix_type FROM public.profiles p WHERE p.id = v_user
  ON CONFLICT (doctor_id) DO UPDATE SET
    balance = doctor_wallets.balance + EXCLUDED.balance,
    total_earned = doctor_wallets.total_earned + EXCLUDED.balance,
    updated_at = now();

  INSERT INTO public.consultation_credit_audit
    (consultation_id, professional_id, patient_id, stars, amount, status, payout_status, reason)
  VALUES (v_appt.id, v_appt.doctor_id, v_appt.patient_id, NEW.score, v_net, 'released', 'released',
          'Avaliação recebida — 93% liberado para saque')
  RETURNING id INTO v_audit;

  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (v_user, 'Pagamento liberado', format('R$ %s da consulta já estão no seu saldo para saque.', to_char(v_net,'FM999990D00')), 'payout', '/consultorio');

  PERFORM net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/doctor-payout-notify',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('audit_id', v_audit)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'release_appointment_payout_on_rating: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_release_payout_on_nps ON public.nps_responses;
CREATE TRIGGER trg_release_payout_on_nps AFTER INSERT ON public.nps_responses
FOR EACH ROW EXECUTE FUNCTION public.release_appointment_payout_on_rating();

REVOKE EXECUTE ON FUNCTION public.release_appointment_payout_on_rating() FROM PUBLIC, anon, authenticated;