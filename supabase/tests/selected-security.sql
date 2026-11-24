-- Privileged integration suite: requires a database testing connection allowed
-- to execute helpers and SET ROLE authenticated/anon. sandbox_exec cannot run it.
-- All fixtures are rolled back. Never use a production session that forbids role switching.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout = '20s';
DO $$
DECLARE d record; p uuid; a uuid;
BEGIN
  SELECT id,user_id INTO d FROM public.doctors WHERE is_verified=true LIMIT 1;
  SELECT id INTO p FROM public.profiles WHERE NOT public.has_role(id,'admin'::public.app_role) LIMIT 1;
  SELECT user_id INTO a FROM public.user_roles WHERE role='admin' LIMIT 1;
  IF d.id IS NULL OR p IS NULL OR a IS NULL THEN RAISE EXCEPTION 'Security fixtures unavailable'; END IF;
  PERFORM set_config('test.doctor',d.id::text,true);
  PERFORM set_config('test.doctor_user',d.user_id::text,true);
  PERFORM set_config('test.patient',p::text,true);
  PERFORM set_config('test.admin',a::text,true);
  PERFORM set_config('test.card','SECURITY-TEST-'||extensions.gen_random_uuid()::text,true);
  INSERT INTO public.health_card_subscriptions(user_id,card_number,amount,billing_cycle,plan_type,status,current_period_end)
    VALUES(p,current_setting('test.card'),99,'monthly','individual','active',now()+interval '1 day');
  INSERT INTO public.affiliate_wallets(user_id) VALUES(a) ON CONFLICT (user_id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.affiliate_wallets WHERE user_id=a) THEN
    RAISE EXCEPTION 'Wallet test fixture unavailable';
  END IF;
END $$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE succeeded boolean:=false;
BEGIN
  PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('test.patient'),'role','authenticated')::text,true);
  BEGIN
    INSERT INTO public.appointments(patient_id,doctor_id,scheduled_at,status,payment_status,amount)
    VALUES(current_setting('test.patient')::uuid,current_setting('test.doctor')::uuid,now(),'in_progress','paid',0);
    succeeded:=true;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF succeeded THEN RAISE EXCEPTION 'Patient forged approved payment'; END IF;
  INSERT INTO public.appointments(patient_id,doctor_id,scheduled_at,status,payment_status,amount)
    VALUES(current_setting('test.patient')::uuid,current_setting('test.doctor')::uuid,now(),'scheduled','pending',150);
  RAISE NOTICE 'PASS: paid insertion blocked, legitimate pending insertion allowed';
END $$;

DO $$
DECLARE n integer;
BEGIN
  PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
  UPDATE public.affiliate_wallets SET available_balance=available_balance+100 WHERE user_id=current_setting('test.admin')::uuid;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Admin changed own wallet balance'; END IF;
  RAISE NOTICE 'PASS: direct admin wallet mutation blocked';
END $$;

DO $$
DECLARE succeeded boolean:=false;
BEGIN
  PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('test.doctor_user'),'role','authenticated')::text,true);
  BEGIN
    INSERT INTO public.prescriptions(patient_id,doctor_id,signed_pdf_path)
      VALUES(current_setting('test.patient')::uuid,current_setting('test.doctor')::uuid,'iti-free/foreign/file.pdf');
    succeeded:=true;
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'signed_pdf_path is server-managed' THEN RAISE; END IF;
  END;
  IF succeeded THEN RAISE EXCEPTION 'Doctor forged signed file path'; END IF;
  RAISE NOTICE 'PASS: doctor cannot write a signed file path';
END $$;

DO $$
DECLARE t text; card text;
BEGIN
  PERFORM set_config('request.jwt.claims',json_build_object('sub',current_setting('test.patient'),'role','authenticated')::text,true);
  SELECT token,card_number INTO t,card FROM public.issue_card_token() WHERE card_number=current_setting('test.card');
  IF t IS NULL THEN RAISE EXCEPTION 'Card token not issued to owner'; END IF;
  PERFORM set_config('test.card_token',t,true);
  RAISE NOTICE 'PASS: owner receives server-issued card token';
END $$;

RESET ROLE;
DO $$
DECLARE ok boolean;
BEGIN
  SELECT valid INTO ok FROM public.validate_card_token(current_setting('test.card'),current_setting('test.card_token'));
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Authentic token rejected'; END IF;
  SELECT valid INTO ok FROM public.validate_card_token(current_setting('test.card'),split_part(current_setting('test.card_token'),'.',1)||'.forged');
  IF ok IS DISTINCT FROM false THEN RAISE EXCEPTION 'Forged token accepted'; END IF;
  RAISE NOTICE 'PASS: authentic token accepted, forged token rejected';
END $$;

SET LOCAL ROLE anon;
DO $$
DECLARE n integer; blocked boolean:=false;
BEGIN
  SELECT count(*) INTO n FROM public.doctor_directory_public_badges();
  IF n=0 THEN RAISE EXCEPTION 'Public badges unavailable'; END IF;
  BEGIN PERFORM * FROM public.doctor_directory_badge_facts();
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Private badge facts exposed'; END IF;
  blocked:=false;
  BEGIN PERFORM kyc_docs_count FROM public.doctors_public LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Document counts exposed'; END IF;
  PERFORM id,full_name,last_seen_online FROM public.doctors_public LIMIT 1;
  RAISE NOTICE 'PASS: public directory preserved, private counts and dates blocked';
END $$;
RESET ROLE;
ROLLBACK;