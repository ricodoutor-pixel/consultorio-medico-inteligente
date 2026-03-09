-- Drop the old policies that weren't caught (different names)
DROP POLICY IF EXISTS "Authenticated can insert doctor" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update own profile" ON public.doctors;