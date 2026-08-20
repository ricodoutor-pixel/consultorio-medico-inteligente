-- 1. Restrict club_posts SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view active posts" ON public.club_posts;
CREATE POLICY "Authenticated users can view active posts"
  ON public.club_posts
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- 2. Restrict club_post_comments SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view active comments" ON public.club_post_comments;
CREATE POLICY "Authenticated users can view active comments"
  ON public.club_post_comments
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- 3. Restrict club_post_likes SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view likes" ON public.club_post_likes;
CREATE POLICY "Authenticated users can view likes"
  ON public.club_post_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Restrict club_comment_likes SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.club_comment_likes;
CREATE POLICY "Authenticated users can view comment likes"
  ON public.club_comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Add explicit doctor UPDATE policy that prevents self-verification
CREATE POLICY "Doctors can update own non-sensitive fields"
  ON public.doctors
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND is_verified = (SELECT d.is_verified FROM public.doctors d WHERE d.id = doctors.id)
    AND crm = (SELECT d.crm FROM public.doctors d WHERE d.id = doctors.id)
    AND crm_state = (SELECT d.crm_state FROM public.doctors d WHERE d.id = doctors.id)
  );
