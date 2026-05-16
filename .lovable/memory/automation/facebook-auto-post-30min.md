---
name: Facebook Auto Post 30min
description: Cron pg_cron *​/30​ * * * * dispara edge function brisa-fb-auto-post; lê fila manus_social_queue (platform='facebook') ou gera via Gemini; publica em FB Page via Graph API v19. Requer FACEBOOK_PAGE_ACCESS_TOKEN com escopos pages_manage_posts + pages_read_engagement.
type: feature
---
- Cron job: `brisa-fb-auto-post-30min` (jobid via cron.schedule)
- Edge function: `supabase/functions/brisa-fb-auto-post/index.ts`
- Fila: `manus_social_queue` (status approved/scheduled/draft, platform=facebook) — coluna `image_url` adicionada
- Fallback: Gemini via Lovable AI Gateway gera texto se fila vazia
- Log: `ai_events` (ai_name='brisa_fb_auto')
- Endpoint Graph: `/photos` quando image_url presente, `/feed` quando texto puro
