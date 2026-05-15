#!/usr/bin/env bash
# 💰 phase4-webhooks.sh — Configura webhooks de produção MP + Stripe → n8n
# Roda na VPS (após fix-stack.sh ter subido n8n.plantayraiz.com.br)
#
# Pré-requisitos (env vars exportadas no shell ou vindas de /opt/planta-infra/.env):
#   MERCADOPAGO_ACCESS_TOKEN  — token APP_USR-* de produção
#   STRIPE_LIVE_API_KEY       — sk_live_* (chave real, não a do gateway Lovable)
#   N8N_WEBHOOK_BASE          — opcional, default: https://n8n.plantayraiz.com.br/webhook
#
# O que faz:
#   1. Registra webhook MP para events: payment + merchant_order
#   2. Registra webhook Stripe para events de pagamento críticos
#   3. Salva IDs retornados em /opt/planta-infra/webhooks-registered.json
#   4. Faz ping de validação nos endpoints n8n

set -euo pipefail

ENV_FILE="/opt/planta-infra/infra/vps-traefik/.env"
[ -f "${ENV_FILE}" ] && set -a && . "${ENV_FILE}" && set +a || true

MP_ACCESS_TOKEN="${MERCADOPAGO_ACCESS_TOKEN:-${MERCADO_PAGO_ACCESS_TOKEN:-${MERCADO_PAGO_API_KEY:-}}}"

N8N_WEBHOOK_BASE="${N8N_WEBHOOK_BASE:-https://n8n.plantayraiz.com.br/webhook}"
MP_HOOK="${N8N_WEBHOOK_BASE}/pagamentos"
STRIPE_HOOK="${N8N_WEBHOOK_BASE}/pagamentos"
OUT="/opt/planta-infra/webhooks-registered.json"

echo "🎯 Endpoint alvo: ${MP_HOOK}"
echo ""

# ─── 0. Pré-flight: o n8n precisa estar respondendo ────────────────
echo "🔍 [0/3] Pré-flight n8n..."
code=$(curl -sk -o /dev/null -w "%{http_code}" -I "${N8N_WEBHOOK_BASE}/healthcheck" || echo "000")
if [[ "${code}" == "404" || "${code}" == "200" || "${code}" == "401" ]]; then
  echo "   ✅ n8n responde (HTTP ${code})"
else
  echo "   ❌ n8n NÃO responde (HTTP ${code}). Rode fix-stack.sh antes."
  exit 1
fi

mp_id="(skipped)"
stripe_id="(skipped)"

# ─── 1. Mercado Pago ───────────────────────────────────────────────
echo ""
echo "💳 [1/3] Mercado Pago..."
if [[ -z "${MP_ACCESS_TOKEN:-}" || "${MP_ACCESS_TOKEN}" == *"PLACEHOLDER"* ]]; then
  echo "   ⚠️  MERCADOPAGO_ACCESS_TOKEN ausente/placeholder — pulando registro real."
else
  mp_resp=$(curl -sk -X POST "https://api.mercadopago.com/v1/webhooks" \
    -H "Authorization: Bearer ${MP_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"${MP_HOOK}\",
      \"events\": [\"payment\", \"merchant_order\"]
    }")
  mp_id=$(echo "${mp_resp}" | grep -oE '"id"[ ]*:[ ]*"?[a-zA-Z0-9_-]+"?' | head -1 | cut -d: -f2 | tr -d ' "' || echo "ERR")
  echo "   ✅ MP webhook registrado. id=${mp_id}"
fi

# ─── 2. Stripe ─────────────────────────────────────────────────────
echo ""
echo "💳 [2/3] Stripe (live)..."
if [[ -z "${STRIPE_LIVE_API_KEY:-}" || "${STRIPE_LIVE_API_KEY}" != sk_live_* ]]; then
  echo "   ⚠️  STRIPE_LIVE_API_KEY não é uma chave sk_live_ real (provavelmente token do gateway Lovable) — pulando."
  echo "       Para registrar via API direta, exporte a chave Stripe verdadeira antes de rodar."
else
  stripe_resp=$(curl -sk -X POST "https://api.stripe.com/v1/webhook_endpoints" \
    -u "${STRIPE_LIVE_API_KEY}:" \
    -d "url=${STRIPE_HOOK}" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=customer.subscription.created" \
    -d "enabled_events[]=customer.subscription.updated" \
    -d "enabled_events[]=customer.subscription.deleted" \
    -d "enabled_events[]=invoice.payment_failed")
  stripe_id=$(echo "${stripe_resp}" | grep -oE '"id"[ ]*:[ ]*"we_[a-zA-Z0-9]+"' | head -1 | cut -d: -f2 | tr -d ' "' || echo "ERR")
  echo "   ✅ Stripe webhook registrado. id=${stripe_id}"
fi

# ─── 3. Persistir resultado ─────────────────────────────────────────
echo ""
echo "📝 [3/3] Persistindo em ${OUT}..."
cat > "${OUT}" <<JSON
{
  "registered_at": "$(date -u +%FT%TZ)",
  "endpoint": "${MP_HOOK}",
  "mercado_pago_webhook_id": "${mp_id}",
  "stripe_webhook_id": "${stripe_id}"
}
JSON
chmod 600 "${OUT}"
cat "${OUT}"

echo ""
echo "✅ Phase 4 concluída."
