CREATE OR REPLACE FUNCTION public.admin_doctor_profiles(_ids uuid[])
RETURNS TABLE(
  id uuid,
  full_name text,
  phone text,
  cpf text,
  date_of_birth date,
  pix_key text,
  pix_type text,
  avatar_url text,
  has_inline_avatar boolean,
  city text,
  region text,
  country text,
  cep text,
  address_street text,
  address_number text,
  address_complement text,
  neighborhood text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.phone,
    p.cpf,
    p.date_of_birth,
    p.pix_key,
    p.pix_type,
    CASE WHEN p.avatar_url LIKE 'data:%' THEN NULL ELSE p.avatar_url END,
    COALESCE(p.avatar_url LIKE 'data:%', false),
    p.city,
    p.region,
    p.country,
    p.cep,
    p.address_street,
    p.address_number,
    p.address_complement,
    p.neighborhood,
    p.created_at
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.admin_doctor_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_doctor_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_doctor_inline_avatar(_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.avatar_url
  FROM public.profiles p
  WHERE p.id = _id
    AND public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.admin_doctor_inline_avatar(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_doctor_inline_avatar(uuid) TO authenticated;