ALTER TABLE public.consultation_credit_audit ALTER COLUMN audit_phone DROP DEFAULT;
UPDATE public.consultation_credit_audit SET audit_phone = NULL WHERE audit_phone = '5511987131241';