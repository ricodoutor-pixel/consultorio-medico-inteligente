# Planta y Raiz: our own backend (off Lovable Cloud)

Decided by the owner on 2026-11-24, after Lovable Cloud took the database offline for hours on 23-24/11.

**Goal:** the platform runs on its own, at zero or low cost. Lovable, like the other agents, only writes code, and that code goes through our audit (tests + review) before it is published.

## Final architecture

| Part | Where | Cost |
|---|---|---|
| Site (React/Vite) | Hostinger, publishes on push to `main` (unchanged) | already paid |
| Database, login, files, realtime | Our Supabase (free plan; a 2nd account if more space is needed) | 0 |
| 200+ Edge Functions | VPS `srv1641464`, `supabase/edge-runtime` container (no 100-function cap) | already paid |
| Single public address | `https://banco.plantayraiz.com.br` (Traefik on the VPS) | 0 |
| Daily backup | VPS `/opt/backups/pyr` (14 days), never on GitHub | 0 |
| AI | Our own `GEMINI_API_KEY` (free tier); `_shared/brisa-ai.ts` already falls back to direct Gemini | 0 |
| Email (signup, password) | Hostinger mailbox SMTP set in Supabase Auth | already paid |
| Video | Jitsi `meet.plantayraiz.com.br` (unchanged) | already paid |

Why a single address: the site, Mercado Pago, Meta and the cron jobs call `banco.plantayraiz.com.br`. The VPS sends `/functions/v1/*` to the local functions and everything else to Supabase. Moving Supabase to another account or plan changes only the VPS `.env`, not the site or the webhooks.

## Free-plan limits and how each is covered

- **100 functions per project:** functions run on the VPS instead.
- **No automatic backup:** `scripts/backup-db.sh` runs on the VPS cron.
- **Built-in email does not send to patients:** use custom SMTP (Hostinger) in Auth -> SMTP.
- **Pauses after 7 days without use:** real traffic plus the cron jobs keep it active.
- **500 MB database / 1 GB storage:** check the export sizes. If they don't fit, put the files in the 2nd account's project or move to Pro.

## Cutover order (maintenance window ~1 h, early morning)

1. **Before the window** (no impact):
   - create the new, empty Supabase project. Never reuse `tkxxoghzhvhjzdoomgss`: it is legacy data;
   - fill `.env` on the VPS;
   - `docker compose up -d` on the VPS;
   - check `https://banco.plantayraiz.com.br/functions/v1/_health`.
2. **Freeze:** turn on the maintenance notice so no sign-ups or payments come in.
3. **Final Lovable export:** full dump including `auth` with password hashes, storage files, and the cron jobs.
4. **Import** into the new project, then run `scripts/pos-importacao.sql`. Compare the counts with the export.
5. **Upload the storage files** (per-bucket zips) keeping the same paths.
6. **Switch the site:** set the build's `VITE_SUPABASE_URL=https://banco.plantayraiz.com.br` and the new `VITE_SUPABASE_PUBLISHABLE_KEY`, then push.
7. **Switch the webhooks:**
   - Mercado Pago -> `https://banco.plantayraiz.com.br/functions/v1/mercadopago-webhook`;
   - Meta -> `.../meta-social-webhook`;
   - Evolution -> `.../whatsapp-brisa-bot`.
8. **Auth:**
   - Site URL and redirect URLs set to `https://www.plantayraiz.com.br/**`;
   - SMTP set to the Hostinger mailbox;
   - Google login, if used, set up with our own Google client.
9. **Tests:**
   - doctor and patient login with their old passwords;
   - R$ 30 Pix in sandbox;
   - Jitsi video token;
   - site chat;
   - `npx vitest run`.
10. **Close the window.** Update the AGENTS.md rules ("managed Lovable Cloud project is the sole operational data source") to point at the new project. Turn on the `push` trigger in `.github/workflows/deploy-funcoes-vps.yml`.

**Rollback:** until step 6, the site still points at Lovable, so undoing means only removing the maintenance notice.

## Lovable dependencies to remove in code (before step 6)

- `auth-email-hook` and `process-email-queue` use `npm:@lovable.dev/email-js`. Auth emails go through SMTP, and the transactional queue moves to SMTP, Resend or Brevo.
- 21 functions use `LOVABLE_API_KEY` / `ai.gateway.lovable.dev`. Without the key, `_shared/brisa-ai.ts` already falls back to Gemini. Functions that call the gateway directly (e.g. `brisa-web-chat`) need the same fallback.
- `src/integrations/supabase/client.ts` keeps a fallback URL to the old project. Change it to the new address in step 6.
