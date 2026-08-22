-- =========================================================================================
-- PLANTA Y RAIZ - CONSOLIDATED INFRASTRUCTURE (TRIGGERS, RPCS, CRONS)
-- Created to allow full local execution and parity with Production Supabase
-- =========================================================================================

-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pgcrypto for hashes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================================
-- 1. TRIAGEM E CLASSIFICAÇÃO (Fuzzy Triage)
-- =========================================================================================

-- Triage Table (if not exists)
CREATE TABLE IF NOT EXISTS public.brisa_triages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    symptoms TEXT,
    severity_score FLOAT DEFAULT 0.0,
    requires_urgent_care BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triage RPC Logic (Calculate Severity)
CREATE OR REPLACE FUNCTION calculate_fuzzy_triage_severity(symptoms_text TEXT)
RETURNS FLOAT AS $$
DECLARE
    score FLOAT := 0.0;
BEGIN
    IF symptoms_text ILIKE '%dor no peito%' OR symptoms_text ILIKE '%falta de ar%' THEN
        score := 0.9;
    ELSIF symptoms_text ILIKE '%febre alta%' OR symptoms_text ILIKE '%sangramento%' THEN
        score := 0.75;
    ELSE
        score := 0.3;
    END IF;
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Triage Trigger Function
CREATE OR REPLACE FUNCTION trigger_triage_severity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.severity_score := calculate_fuzzy_triage_severity(NEW.symptoms);
    IF NEW.severity_score >= 0.75 THEN
        NEW.requires_urgent_care := true;
        -- Future: Invoke webhook/Edge Function directly here via pg_net if desired
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_triage_severity ON public.brisa_triages;
CREATE TRIGGER trg_calculate_triage_severity
    BEFORE INSERT OR UPDATE ON public.brisa_triages
    FOR EACH ROW EXECUTE FUNCTION trigger_triage_severity();

-- =========================================================================================
-- 2. MATCHMAKING E FILAS
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.consultation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_next_available_doctor()
RETURNS UUID AS $$
DECLARE
    available_doctor_id UUID;
BEGIN
    SELECT id INTO available_doctor_id 
    FROM public.profiles 
    WHERE role = 'doctor' AND is_online = true 
    ORDER BY last_assigned_at ASC NULLS FIRST 
    LIMIT 1;
    
    RETURN available_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================================
-- 3. ONBOARDING (VIP Trial Trigger)
-- =========================================================================================

CREATE OR REPLACE FUNCTION grant_vip_trial_on_new_doctor()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'doctor' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO public.subscriptions (user_id, plan_id, status, trial_end)
        VALUES (NEW.id, 'vip_plan', 'trialing', NOW() + INTERVAL '30 days');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Assuming profiles table exists:
-- CREATE TRIGGER trg_grant_vip_trial AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION grant_vip_trial_on_new_doctor();

-- =========================================================================================
-- 4. FINANCEIRO E CARTEIRAS (Affiliates & Health Card)
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    balance NUMERIC(10,2) DEFAULT 0.00,
    wallet_type TEXT DEFAULT 'affiliate', -- affiliate, health_card
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION ensure_affiliate_wallet(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    wallet_uuid UUID;
BEGIN
    SELECT id INTO wallet_uuid FROM public.wallets WHERE user_id = user_uuid AND wallet_type = 'affiliate';
    IF wallet_uuid IS NULL THEN
        INSERT INTO public.wallets (user_id, wallet_type) VALUES (user_uuid, 'affiliate') RETURNING id INTO wallet_uuid;
    END IF;
    RETURN wallet_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION credit_affiliate_wallet(user_uuid UUID, amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    w_id UUID;
BEGIN
    w_id := ensure_affiliate_wallet(user_uuid);
    UPDATE public.wallets SET balance = balance + amount WHERE id = w_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION credit_health_card_wallet(user_uuid UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.wallets SET balance = balance + amount WHERE user_id = user_uuid AND wallet_type = 'health_card';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION debit_health_card_wallet(user_uuid UUID, amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    SELECT balance INTO current_balance FROM public.wallets WHERE user_id = user_uuid AND wallet_type = 'health_card';
    IF current_balance >= amount THEN
        UPDATE public.wallets SET balance = balance - amount WHERE user_id = user_uuid AND wallet_type = 'health_card';
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================================
-- 5. CRON JOBS (PG_CRON)
-- =========================================================================================

-- Clear existing cron jobs if migrating to avoid duplicates
SELECT cron.unschedule(jobid) FROM cron.job;

-- 1. email_queue_dispatch / wake (Runs every 1 minute)
SELECT cron.schedule('email_queue_dispatch', '* * * * *', $$
  SELECT net.http_post(url:='http://host.docker.internal:54321/functions/v1/process-email-queue', body:='{}'::jsonb);
$$);

-- 2. auto_release_brisa_orientacao (Daily at 00:00)
SELECT cron.schedule('auto_release_brisa_orientacao', '0 0 * * *', $$
  UPDATE public.consultation_queue SET status = 'released' WHERE status = 'pending_release' AND created_at < NOW() - INTERVAL '24 hours';
$$);

-- 3. anonymize_old_ot_orders (Daily at 01:00)
SELECT cron.schedule('anonymize_old_ot_orders', '0 1 * * *', $$
  UPDATE public.consultation_queue SET patient_id = NULL WHERE status = 'completed' AND created_at < NOW() - INTERVAL '5 years';
$$);

-- 4. cleanup_http_logs (Weekly on Sunday)
SELECT cron.schedule('cleanup_http_logs', '0 2 * * 0', $$
  DELETE FROM net.http_request_queue WHERE created_at < NOW() - INTERVAL '7 days';
$$);

-- 5. alert_monitor_sre (Every 5 minutes)
SELECT cron.schedule('alert_monitor_sre', '*/5 * * * *', $$
  SELECT net.http_post(url:='http://host.docker.internal:54321/functions/v1/daily-sre-audit', body:='{}'::jsonb);
$$);

-- 6. meta_capi_scheduler (Every 5 minutes)
SELECT cron.schedule('meta_capi_scheduler', '*/5 * * * *', $$
  SELECT net.http_post(url:='http://host.docker.internal:54321/functions/v1/send-meta-capi', body:='{}'::jsonb);
$$);

-- 7. payment_health_monitor (Every 5 minutes)
SELECT cron.schedule('payment_health_monitor', '*/5 * * * *', $$
  SELECT net.http_post(url:='http://host.docker.internal:54321/functions/v1/mp-health-check', body:='{}'::jsonb);
$$);

-- 8. gamification_daily_scheduler (Daily at 03:00)
SELECT cron.schedule('gamification_daily_scheduler', '0 3 * * *', $$
  SELECT net.http_post(url:='http://host.docker.internal:54321/functions/v1/daily-gamification-check', body:='{}'::jsonb);
$$);

-- 9. get_cron_health (Hourly check)
CREATE OR REPLACE FUNCTION get_cron_health() RETURNS TABLE(job_name TEXT, status TEXT, last_run TIMESTAMP) AS $$
BEGIN
    RETURN QUERY SELECT j.jobname::TEXT, r.status::TEXT, r.start_time::TIMESTAMP 
    FROM cron.job j LEFT JOIN cron.job_run_details r ON j.jobid = r.jobid
    WHERE r.start_time = (SELECT MAX(start_time) FROM cron.job_run_details WHERE jobid = j.jobid);
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('get_cron_health_audit', '0 * * * *', $$ SELECT get_cron_health(); $$);
