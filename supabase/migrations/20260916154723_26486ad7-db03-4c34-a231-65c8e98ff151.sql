REVOKE EXECUTE ON FUNCTION public.guard_patient_appointment_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_patient_slot_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_vendor_product_approval_flags() FROM anon, authenticated;