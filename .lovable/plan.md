# Phase 4 — Manus CEO, Auditoria Autônoma & Resiliência

A lista enviada cobre ~10 subsistemas. Implementar tudo numa só leva (sem validação intermediária) tem alto risco de quebrar produção. Proponho deploy em **3 ondas curtas**, começando pelos #1 e #7 que você mesmo priorizou. Cada onda termina deployada, testada e auditável antes da próxima.

---

## ONDA 1 — Núcleo Manus CEO + Crisis Alert Brisa (deploy imediato)

**Objetivo:** ter, hoje, um auditor noturno autônomo + alerta de sentimento da Brisa rodando em produção.

### 1.1 Edge Function `manus-ceo-cron`
- Roda diariamente às **03:00 BRT** via `pg_cron + pg_net` (insert tool, não migration).
- Varre nas últimas 24 h:
  - `audit_log` → contagem por `action`, erros recorrentes.
  - `transactions` → faturamento bruto, ticket médio, refunds.
  - `orientacao_tecnica_orders` → funil triagem → checkout → pago, taxa de conversão.
  - `consultation_credit_audit` → consultas em revisão.
  - `whatsapp_brisa_log` → volume de mensagens, latência média.
- Persiste resultado em nova tabela `manus_ceo_reports` (jsonb).
- Gera relatório Markdown e envia via `evolution-api-proxy` para o WhatsApp do Dr. Edilson (`ADMIN_WHATSAPP`).

### 1.2 Edge Function `brisa-crisis-alert`
- Roda a cada **6 h** via `pg_cron`.
- Calcula média de `sentiment_score` em `whatsapp_brisa_log` nos últimos 7 dias.
- Se média < 0.4 **ou** > 50% das mensagens marcadas negativas → dispara alerta WhatsApp para o admin com top-5 trechos críticos (PII mascarada via `contact-mask.ts`).
- Loga evento em `audit_log` (`action = brisa_crisis_alert`).

### 1.3 Migrations necessárias
- Tabela `manus_ceo_reports` (id, report_date, metrics jsonb, markdown text, sent_to text, created_at).
- RLS: SELECT só admin; INSERT só service_role.
- Índice em `report_date`.
- Garantir colunas `sentiment_score numeric` e `is_negative boolean` em `whatsapp_brisa_log` (adicionar se faltar).

### 1.4 Cron jobs (via insert tool, contém anon key)
- `manus-ceo-nightly` → `0 6 * * *` UTC (03:00 BRT).
- `brisa-crisis-6h` → `0 */6 * * *`.

---

## ONDA 2 — Resiliência financeira & fraude (após Onda 1 validada)

### 2.1 Modo Contingência Mercado Pago
- Adicionar `mp-health-check` no client de checkout: 3 falhas consecutivas ou latência > 5 s → seta flag `contingency_mode` em `system_settings`.
- Componente `<PixEstaticoFallback />` com chave PIX CNPJ exibido enquanto a flag estiver ativa.
- Cron `mp-health-recheck` a cada 2 min reabilita quando MP volta.

### 2.2 Tabela `financial_reconciliation` + job diário
- Bate `transactions.amount` vs status `approved` retornado pela API MP.
- Divergência → linha em `financial_reconciliation` + alerta WhatsApp.
- Roda dentro do `manus-ceo-cron` (não cria função extra).

### 2.3 Antifraude médica
- Cron `pool-sanitizer-hourly` (`0 * * * *`).
- `UPDATE doctors SET status='suspended' WHERE fraud_score < 50 AND status='active'`.
- Alerta no WhatsApp do diretor técnico com lista dos suspensos.

### 2.4 Validador ICP-Brasil
- Helper `validatePrescriptionHash(prescriptionId)` em `src/lib/prescription-signature-router.ts` (já existe esqueleto).
- Cron `prescription-hash-audit-daily` varre prescrições assinadas nas últimas 24 h, valida QR code + hash SHA-256, registra `audit_log`.

---

## ONDA 3 — Observabilidade, autocura e backup

### 3.1 Edge Function pública `status-page-json`
- `verify_jwt = false`, sem autenticação.
- Retorna `{ uptime, api_latency_ms, doctors_online, brisa_queue_size, contingency_mode }`.
- Página `/status` consome esse endpoint (UI mínima, dark theme já existente).

### 3.2 Self-healing de erros
- Listener em `error_monitoring` (já existe a tabela): novo trigger envia erros `severity='critical'` para função `ai-error-patcher`.
- `ai-error-patcher` chama Lovable AI Gateway (`gpt-5-mini`) com stack trace + arquivo afetado, gera sugestão de patch e abre issue no repo `ricodoutor-pixel/consultorio-medico-inteligente` via GitHub API.
- **Requer secret** `GITHUB_TOKEN` (vou pedir quando chegarmos nesta onda).

### 3.3 Backup criptografado off-site
- Cron diário `pg-snapshot-encrypted` (`0 8 * * *` UTC = 05:00 BRT).
- `pg_dump` lógico das tabelas sensíveis (prescriptions, transactions, profiles) → criptografa com AES-256 (chave em `BACKUP_ENCRYPTION_KEY`) → upload para bucket `master-reports` (já existe) sob prefixo `backups/YYYY-MM-DD.enc`.
- Retenção 30 dias (limpeza no mesmo cron).

### 3.4 A/B testing de checkout (deferred)
- Mantém fora desta phase — exige instrumentação maior. Documenta em `AUTOMATION_MAP.md` como roadmap.

---

## Fora de escopo agora (motivo)
- **A/B test automático**: maturidade insuficiente de tracking de conversão por variante; melhor depois que reconciliação (#2.2) provar números limpos.
- **Toda mudança visual**: memória `constraints/no-visual-changes` é categórica. Apenas `/status` adiciona UI nova mínima.

---

## Detalhes técnicos

```text
Stack adicionada:
  Edge Functions:
    - manus-ceo-cron          (Onda 1)
    - brisa-crisis-alert      (Onda 1)
    - status-page-json        (Onda 3)
    - ai-error-patcher        (Onda 3)
    - pg-snapshot-encrypted   (Onda 3)
  Tabelas novas:
    - manus_ceo_reports
    - financial_reconciliation
    - system_settings (se ainda não existir; usado p/ contingency_mode)
  Crons (pg_cron, via insert tool):
    - manus-ceo-nightly       0 6 * * *
    - brisa-crisis-6h         0 */6 * * *
    - mp-health-recheck       */2 * * * *
    - pool-sanitizer-hourly   0 * * * *
    - prescription-hash-audit 0 7 * * *
    - pg-snapshot-encrypted   0 8 * * *
  Secrets já existentes (reuso):
    EVOLUTION_API_URL, EVOLUTION_API_KEY, ADMIN_WHATSAPP,
    SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, MERCADO_PAGO_ACCESS_TOKEN
  Secrets novos a pedir (só na Onda 3):
    GITHUB_TOKEN, BACKUP_ENCRYPTION_KEY
```

Após cada onda eu valido logs (`edge_function_logs`), confirmo cron registrado (`get_cron_health`) e te dou um resumo de uma linha. Só avanço para a próxima onda com o seu OK.

---

**Próximo passo proposto:** aprovar este plano e começar pela **Onda 1** agora (Manus CEO + Crisis Alert Brisa).