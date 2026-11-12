-- 1) Imagens de posts: apenas admin envia
DROP POLICY IF EXISTS "Service write social-posts" ON storage.objects;
CREATE POLICY "Admin upload social-posts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-posts' AND public.has_role(auth.uid(), 'admin'));

-- 2) Regras de roteamento: leitura só do sistema (admin continua gerenciando)
DROP POLICY IF EXISTS "Routing rules readable by everyone" ON public.intent_routing_rules;

-- 3) Contadores: leitura só via função que devolve o número
DROP POLICY IF EXISTS "Anyone can read counters" ON public.site_counters;
CREATE POLICY "Admins read counters" ON public.site_counters FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.get_site_counter(_counter_id text)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count::bigint FROM public.site_counters WHERE id = _counter_id
$$;
REVOKE ALL ON FUNCTION public.get_site_counter(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_site_counter(text) TO anon, authenticated, service_role;

-- 4) Curtidas do Clube: cada um vê as próprias (totais seguem em club_posts.likes_count)
DROP POLICY IF EXISTS "Authenticated users can view likes" ON public.club_post_likes;
CREATE POLICY "Users view own post likes" ON public.club_post_likes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view comment likes" ON public.club_comment_likes;
CREATE POLICY "Users view own comment likes" ON public.club_comment_likes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5) Listagem das pastas: sem listagem pública; dono lista a própria subpasta; admin lista tudo
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read experience-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read social-posts" ON storage.objects;
DROP POLICY IF EXISTS "Public read strain-images" ON storage.objects;
DROP POLICY IF EXISTS "ebooks public read" ON storage.objects;
CREATE POLICY "Owner list own folder public buckets" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('avatars','experience-images','social-posts','strain-images','ebooks')
         AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "social-posts admin list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'social-posts' AND public.has_role(auth.uid(), 'admin'));