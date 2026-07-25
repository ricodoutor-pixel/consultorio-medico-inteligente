-- 1. Add new columns to doctors table
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS crm_front_url TEXT,
ADD COLUMN IF NOT EXISTS crm_back_url TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS personal_phone TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_presentation_url TEXT;

-- 2. Migrate existing verified doctors to be approved
UPDATE public.doctors
SET is_approved = true,
    approval_status = 'approved',
    approved_at = now()
WHERE is_verified = true;

-- 3. Update the view to filter by is_approved as well
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public
WITH (security_invoker = on) AS
SELECT
  d.id,
  d.user_id,
  d.specialty,
  d.crm,
  d.crm_state,
  d.rqe,
  d.bio,
  d.rating,
  d.consultation_price,
  d.is_verified,
  d.is_online,
  d.plan_tier,
  d.total_consultations,
  d.available_hours,
  d.is_available,
  d.document_type,
  d.country,
  d.city,
  d.video_presentation_url,
  d.created_at,
  disp.full_name,
  disp.avatar_url
FROM public.doctors d
LEFT JOIN LATERAL public.get_doctor_display(d.user_id) disp ON true
WHERE d.is_verified = true AND d.is_approved = true;

GRANT SELECT ON public.doctors_public TO anon, authenticated;
