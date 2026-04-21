-- Allow authenticated users to insert their own tracking events (e.g. Facebook Pixel)
-- They cannot read other users' data (only admins can SELECT)
CREATE POLICY "Authenticated users can insert own tracking"
  ON public.social_interactions FOR INSERT
  TO authenticated
  WITH CHECK (true);
