CREATE POLICY "Doctors can view own profile"
ON public.doctors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());