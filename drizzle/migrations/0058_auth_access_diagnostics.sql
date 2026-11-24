CREATE TABLE public.auth_error_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 user_type text NOT NULL CHECK (user_type IN ('paciente','medico','farmacia','admin')),
 error_code text NOT NULL CHECK (error_code IN ('invalid_credentials','email_not_confirmed','rate_limited','unavailable','unknown','reset_failed')),
 http_status integer CHECK (http_status BETWEEN 0 AND 599),
 operation text NOT NULL CHECK (operation IN ('login','recovery','update_password'))
);
GRANT SELECT ON public.auth_error_logs TO authenticated;
GRANT ALL ON public.auth_error_logs TO service_role;
ALTER TABLE public.auth_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_errors_admin_read ON public.auth_error_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE FUNCTION public.record_auth_error(p_user_type text, p_error_code text, p_http_status integer, p_operation text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF p_user_type IS NULL OR p_user_type NOT IN ('paciente','medico','farmacia','admin') OR p_error_code IS NULL OR p_error_code NOT IN ('invalid_credentials','email_not_confirmed','rate_limited','unavailable','unknown','reset_failed') OR p_operation IS NULL OR p_operation NOT IN ('login','recovery','update_password') OR (p_http_status IS NOT NULL AND (p_http_status < 0 OR p_http_status > 599)) THEN RAISE EXCEPTION 'Invalid diagnostic'; END IF;
 INSERT INTO public.auth_error_logs(user_type,error_code,http_status,operation) VALUES(p_user_type,p_error_code,p_http_status,p_operation);
END;
$$;
REVOKE ALL ON FUNCTION public.record_auth_error(text,text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_auth_error(text,text,integer,text) TO anon, authenticated, service_role;
CREATE FUNCTION public.access_health_check() RETURNS integer LANGUAGE sql STABLE SET search_path = public AS $$ SELECT 1; $$;
REVOKE ALL ON FUNCTION public.access_health_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.access_health_check() TO service_role;