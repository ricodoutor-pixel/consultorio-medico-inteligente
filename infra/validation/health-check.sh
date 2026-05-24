#!/usr/bin/env bash
# 🩺 Health-Check de produção — Planta y Raiz
# Ambiente atual: frontend publicado + VPS Hostinger (Docker + Traefik) + backend Lovable Cloud.
#
# Uso:
#   bash infra/validation/health-check.sh
#   bash infra/validation/health-check.sh --vm-ip 2.24.69.154

set -uo pipefail

VM_IP=""
if [ "${1:-}" = "--vm-ip" ]; then VM_IP="${2:-}"; fi

PASS=0; FAIL=0; SKIP=0
OK()   { echo -e "  ✅ \033[32m$1\033[0m"; PASS=$((PASS+1)); }
ERR()  { echo -e "  ❌ \033[31m$1\033[0m"; FAIL=$((FAIL+1)); }
WARN() { echo -e "  ⚠️  \033[33m$1\033[0m"; SKIP=$((SKIP+1)); }
HEAD() { echo -e "\n\033[1;36m▸ $1\033[0m"; }

check_http() {
  local url="$1" expected_csv="$2" label="$3"
  local code
  code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ ",${expected_csv}," == *",${code},"* ]]; then
    OK "$label → HTTP $code"
  else
    ERR "$label → HTTP $code (esperado: $expected_csv) — $url"
  fi
}

resolve_ipv4() {
  local host="$1"

  if command -v dig >/dev/null 2>&1; then
    dig +short "$host" A | head -n1
    return
  fi

  if command -v getent >/dev/null 2>&1; then
    getent ahostsv4 "$host" | awk 'NR==1 { print $1 }'
    return
  fi

  if command -v nslookup >/dev/null 2>&1; then
    nslookup "$host" 2>/dev/null | awk '/^Address: / { print $2 }' | tail -n1
    return
  fi

  return 1
}

check_dns() {
  local host="$1" expected_ip="${2:-}"
  local ip

  if ! ip=$(resolve_ipv4 "$host"); then
    WARN "DNS $host → ferramentas de resolução não disponíveis neste ambiente"
    return
  fi

  if [ -z "$ip" ]; then
    ERR "DNS $host → sem resposta"
  elif [ -n "$expected_ip" ] && [ "$ip" != "$expected_ip" ]; then
    ERR "DNS $host → $ip (esperado $expected_ip)"
  else
    OK "DNS $host → $ip"
  fi
}

check_ssl() {
  local host="$1"
  local expiry

  if ! command -v openssl >/dev/null 2>&1; then
    WARN "SSL $host → openssl indisponível; HTTPS já validado via curl"
    return
  fi

  expiry=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | awk -F= '{print $2}')

  if [ -n "$expiry" ]; then
    OK "SSL $host válido até $expiry"
  else
    ERR "SSL $host → certificado não encontrado"
  fi
}

HEAD "1/5 — Frontend publicado"
check_http "https://plantayraiz.com.br"  "200"         "Site root"
check_http "https://www.plantayraiz.com.br" "200,301,302" "Site www / redirect"
check_http "https://plantayraiz.com.br/login" "200"     "SPA route /login"
check_http "https://plantayraiz.com.br/saude-verde/agendar" "200" "SPA route /saude-verde/agendar"
check_ssl  "plantayraiz.com.br"

HEAD "2/5 — VPS Hostinger (Traefik + serviços)"
check_dns  "n8n.plantayraiz.com.br"          "$VM_IP"
check_dns  "api.plantayraiz.com.br"          "$VM_IP"
check_dns  "assinaturas.plantayraiz.com.br"  "$VM_IP"
check_dns  "analytics.plantayraiz.com.br"    "$VM_IP"
check_http "https://n8n.plantayraiz.com.br"         "200"         "n8n UI"
check_http "https://api.plantayraiz.com.br/manager" "200,301,302" "Evolution API manager"
check_http "https://assinaturas.plantayraiz.com.br" "200,301,302" "DocuSeal"
check_http "https://analytics.plantayraiz.com.br"   "200"         "Plausible"

HEAD "3/5 — Backend Lovable Cloud"
SUPA="https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1"
check_http "$SUPA/health"                 "200,503"     "health endpoint"
check_http "$SUPA/whatsapp-brisa-bot"     "401"         "whatsapp-brisa-bot (401 = auth ok)"
check_http "$SUPA/saude-verde-subscribe"  "401"         "saude-verde-subscribe (401 = auth ok)"
check_http "$SUPA/brisa-health-check"     "401"         "brisa-health-check (401 = auth ok)"

HEAD "4/5 — Integrações externas"
check_http "https://api.plantayraiz.com.br/webhook" "404" "Evolution webhook endpoint"

HEAD "5/5 — Performance básica"
total=$(curl -sko /dev/null -w "%{time_total}" --max-time 10 "https://plantayraiz.com.br")
if awk -v t="$total" 'BEGIN{exit !(t<2.5)}'; then
  OK "TTFB+download $total s (<2.5s)"
else
  ERR "TTFB+download $total s (alvo <2.5s)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "  RESULTADO: \033[32m$PASS PASS\033[0m  /  \033[31m$FAIL FAIL\033[0m  /  \033[33m$SKIP SKIP\033[0m"
echo "═══════════════════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
