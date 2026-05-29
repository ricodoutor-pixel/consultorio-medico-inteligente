---
name: Brisa Alerts Policy
description: Política Dr. Edilson — WhatsApp pessoal recebe apenas cadastros, vendas de Orientação Técnica e resumo diário 19h BRT
type: constraint
---

# Política de alertas ao WhatsApp do Dr. Edilson (até segunda ordem)

**Permitidos** (enviam ao 5511987131241):
1. `brisa-signup-alert` (apenas evento `signup` — logins silenciados) → texto "Parabéns, Doutor! Mais um(a) <tipo> cadastrado(a) e ativo(a)…"
2. `mercadopago-webhook` quando `payment.status === "approved"` em Orientação Técnica → texto "Parabéns, Doutor! Mais uma Orientação Técnica realizada e auditada com sucesso!"
3. `brisa-daily-summary` (cron `brisa-daily-summary-19h-brt`, 22:00 UTC = 19h BRT) → resumo diário: cadastros por tipo, orientações auditadas, visitas (sessões únicas) e status do fluxo.

**Silenciados** via `_shared/admin-alert-guard.ts` (env `ADMIN_ALERTS_SIGNUP_ONLY=true`, default):
- heartbeat IA, sentinel, growth, ceo-cron, weekly-audit, fuzzy-triage, crisis, channels-status, infra-expiry, mp-health, pool-sanitizer, prescription-hash-audit, retention semanal, meta-messenger red-flag.
- `brisa-silence-watchdog` permanece DESATIVADO (WATCHDOG_DISABLED).

**Reativação geral:** definir `ADMIN_ALERTS_SIGNUP_ONLY=false`.
