# Brisa 360° — Secrets da Meta (produção)

Os bots `meta-messenger-bot` e `meta-comment-to-dm` leem as credenciais da Meta a partir do **Supabase Secrets** (Edge Functions → Manage Secrets) via o helper `supabase/functions/_shared/meta-secrets.ts`.

## Nomes oficiais (produção 2026)

| Secret | Onde é usado | Obtido em |
|--------|--------------|-----------|
| `META_APP_SECRET` | Assinatura HMAC-SHA256 do webhook (`X-Hub-Signature-256`) | Meta Developers → App → Configurações → Básico → **App Secret** |
| `FB_PAGE_ACCESS_TOKEN` | Enviar mensagens via Messenger e responder feed da Página | Meta Developers → App → Messenger → Tokens da Página → **Page Access Token** (token de longa duração) |
| `IG_PAGE_ACCESS_TOKEN` | Enviar DMs do Instagram e responder comentários IG | Mesmo token da Página vinculada ao Instagram Business (com `instagram_manage_messages`, `instagram_manage_comments`) |
| `META_WEBHOOK_VERIFY_TOKEN` | Handshake `hub.verify_token` do webhook | Você define no painel da Meta — qualquer string forte |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Identifica entradas IG vs FB no payload do webhook | Graph API: `me/accounts?fields=instagram_business_account` |

## Compatibilidade legada (fallbacks)

Para não quebrar a operação atual, o helper aceita nomes antigos:

- `META_APP_SECRET` → fallback: `FACEBOOK_APP_SECRET`
- `FB_PAGE_ACCESS_TOKEN` → fallbacks: `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_GRAPH_API_TOKEN`
- `IG_PAGE_ACCESS_TOKEN` → fallbacks: `INSTAGRAM_PAGE_ACCESS_TOKEN`, depois os do Facebook acima

## Virada de chave em produção

1. Cadastrar os 3 nomes oficiais em **Supabase → Edge Functions → Manage Secrets**.
2. Aguardar 10–15s para propagação.
3. Verificar saúde rodando a function `meta-token-check`.
4. (Opcional) Remover os secrets legados.

Nenhuma alteração de código é necessária após esse procedimento.

## Webhook do Meta

- Callback URL (DMs + comentários): `https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/meta-messenger-bot`
- Callback alternativa (apenas comentários auto-DM): `https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/meta-comment-to-dm`
- Verify Token: o valor de `META_WEBHOOK_VERIFY_TOKEN`
- Subscriptions: `messages`, `messaging_postbacks`, `feed` (Page), `comments` (IG)
