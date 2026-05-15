# ManyChat Legacy — Arquivo Seguro

**Data do arquivamento:** 2026-05-15  
**Motivo:** Migração completa para Evolution API (WhatsApp unificado).  
**Status:** Inativo no código de produção. Mantido aqui para consulta futura.

## Conteúdo arquivado

| Item | Origem | Função |
|------|--------|--------|
| `server-services-manychat/` | `server/services/manychat/` | Cliente HTTP + flows + tipos |
| `manychat-webhook/` | `supabase/functions/manychat-webhook/` | Stub HTTP 410 (substituído) |
| `manychat-sync/` | `supabase/functions/manychat-sync/` | Sync de eventos (legado) |
| `manychat-deep-sync/` | `supabase/functions/manychat-deep-sync/` | Sync de status de paciente |
| `manychat-lead-sync/` | `supabase/functions/manychat-lead-sync/` | Sync bidirecional de leads |
| `manychatSync.ts` | `src/lib/manychatSync.ts` | Helper client-side |
| `audit_manychat.ts` | `scripts/audit_manychat.ts` | Script de auditoria |

## Para reativar (caso necessário no futuro)

1. Mover a pasta correspondente de volta para sua origem.
2. Garantir que os secrets `MANYCHAT_API_KEY`, `MANYCHAT_WEBHOOK_SECRET`,
   `MANYCHAT_WEBHOOK_URL` estejam configurados.
3. Reverter o stub HTTP 410 do `manychat-webhook`.
4. Re-registrar fluxos em `recovery-engine`, `revenue-report-automation`,
   `publish-to-facebook` (atualmente usando Evolution API via
   `_shared/evolution.ts`).

## Secrets relacionados (mantidos no Vault)

- `MANYCHAT_API_KEY`
- `MANYCHAT_WEBHOOK_SECRET`
- `MANYCHAT_WEBHOOK_URL`

**Não delete os secrets** — ficam disponíveis caso a integração seja
retomada. Custo zero quando não utilizados.
