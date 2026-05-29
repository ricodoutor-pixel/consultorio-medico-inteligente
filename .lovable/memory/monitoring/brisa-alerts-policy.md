---
name: Brisa Alerts Policy
description: Política Dr. Edilson — APENAS alertas de novos cadastros no WhatsApp pessoal
type: constraint
---

# Política de alertas ao WhatsApp do Dr. Edilson (até segunda ordem)

**Permitidos** (enviam ao 5511987131241):
- `brisa-signup-alert` — novo cadastro de paciente/médico
- `mercadopago-webhook` quando `payment.status === "approved"` → notificação de novo pagamento de orientação técnica (semanticamente um novo cliente)

**Silenciados** via `_shared/admin-alert-guard.ts` (env `ADMIN_ALERTS_SIGNUP_ONLY=true`, default):
- `_shared/brisa-ai.ts::alertEdilson` (heartbeat IA)
- `manus-sentinel`, `manus-growth-agent`, `manus-ceo-cron`
- `brisa-weekly-audit`, `brisa-fuzzy-triage`, `brisa-crisis-alert`, `brisa-channels-status`
- `infra-expiry-monitor`, `mp-health-check`, `pool-sanitizer`, `prescription-hash-audit`
- `retention-engine` (relatório semanal), `meta-messenger-bot::notifyDoctorRedFlag`
- `brisa-silence-watchdog` permanece DESATIVADO (flag WATCHDOG_DISABLED)

**Reativação:** definir secret `ADMIN_ALERTS_SIGNUP_ONLY=false` (ou remover) → todos voltam.
