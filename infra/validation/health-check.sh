#!/usr/bin/env bash
# 🩺 Health-Check pós-migração — Planta y Raiz
# Valida TODOS os endpoints críticos após mover para Oracle + Cloudflare.
#
# Uso:
#   bash infra/validation/health-check.sh
#   bash infra/validation/health-check.sh --vm-ip 132.226.X.Y   (testa via IP direto também)

set -uo pipefail

VM_IP=""
if [ "${1:-}" = "--vm-ip" ]; then VM_IP="$2"; fi

PASS=0; FAIL=0
OK()   { echo -e "  ✅ \033[32m$1\033[0m"; PASS=$((PASS+1)); }
ERR()  { echo -e "  ❌ \033[31m$1\033[0m"; FAIL=$((FAIL+1)); }
HEAD() { echo -e "\n\033[1;36m▸ $1\033[0m"; }

check_http() {
  local url="$1" expected="${2:-200}" label="$3"
  local code
  code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [ "$code" = "$expected" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    OK "$label → HTTP $code"
  else
    ERR "$label → HTTP $code (esperado $expected) — $url"
  fi
}

check_dns() {
  local host="$1" expected_ip="${2:-}"
  local ip
  ip=$(dig +short "$host" A | head -n1)
  if [ -z "$ip" ]; then
    ERR "DNS $host → SEM RESPOSTA"
  elif [ -n "$expected_ip" ] && [ "$ip" != "$expected_ip" ]; then
    ERR "DNS $host → $ip (esperado $expected_ip)"
  else
    OK "DNS $host → $ip"
  fi
}

check_ssl() {
  local host="$1"
  local days
  days=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | awk -F= '{print $2}')
  if [ -n "$days" ]; then OK "SSL $host válido até $days"
  else ERR "SSL $host — certificado não encontrado"; fi
}

# ═══════════════════════════════════════════════════════════════════
HEAD "1/5 — Frontend (Cloudflare Pages)"
check_http "https://plantayraiz.com.br" 200 "Site root"
check_http "https://www.plantayraiz.com.br" 200 "Site www"
check_http "https://plantayraiz.com.br/login" 200 "SPA route /login"
check_http "https://plantayraiz.com.br/saude-verde/agendar" 200 "SPA route /saude-verde/agendar"
check_ssl  "plantayraiz.com.br"

HEAD "2/5 — Backend Oracle (Traefik + serviços)"
check_dns  "n8n.plantayraiz.com.br"          "$VM_IP"
check_dns  "api.plantayraiz.com.br"          "$VM_IP"
check_dns  "assinaturas.plantayraiz.com.br"  "$VM_IP"
check_dns  "analytics.plantayraiz.com.br"    "$VM_IP"
check_http "https://n8n.plantayraiz.com.br"          200 "n8n UI"
check_http "https://api.plantayraiz.com.br/manager"  200 "Evolution API manager"
check_http "https://assinaturas.plantayraiz.com.br"  200 "DocuSeal"
check_http "https://analytics.plantayraiz.com.br"    200 "Plausible"

HEAD "3/5 — Supabase Edge Functions críticas"
SUPA="https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1"
check_http "$SUPA/mercadopago-webhook"   200 "mercadopago-webhook"
check_http "$SUPA/whatsapp-brisa-bot"    401 "whatsapp-brisa-bot (401 = auth ok)"
check_http "$SUPA/saude-verde-subscribe" 401 "saude-verde-subscribe (401 = auth ok)"

HEAD "4/5 — Webhooks externos"
check_http "https://api.plantayraiz.com.br/webhook" 404 "Evolution webhook endpoint"

HEAD "5/5 — Performance LCP (curl timing)"
total=$(curl -sko /dev/null -w "%{time_total}" --max-time 10 "https://plantayraiz.com.br")
if awk -v t="$total" 'BEGIN{exit !(t<2.5)}'; then OK "TTFB+download $total s (<2.5s)"
else ERR "TTFB+download $total s (alvo <2.5s)"; fi

# ═══════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "  RESULTADO: \033[32m$PASS PASS\033[0m  /  \033[31m$FAIL FAIL\033[0m"
echo "═══════════════════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
