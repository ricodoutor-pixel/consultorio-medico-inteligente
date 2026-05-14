#!/usr/bin/env bash
# 🩺 Fix definitivo: loop infinito do Baileys sem QR.
# Causa: CONFIG_SESSION_PHONE_NAME vazio + imagem :latest apontando para v2.2.3 antiga.
# Solução: pinar v2.3.1 + setar phone client/name/version + limpar volume + recriar instância.

set -euo pipefail

TARGET="/opt/planta-infra/infra/vps-traefik"
INSTANCE_NAME="${1:-Brisa_CEO}"
INSTANCE_TOKEN="${2:-}"
PHONE_NUMBER="${3:-}"
API_BASE="https://api.plantayraiz.com.br"
VOLUME_NAME="vps-traefik_evolution_instances"

cd "${TARGET}"

echo "🔄 [1/7] git pull (pega docker-compose atualizado com phone-name fix)..."
git pull --ff-only || true

set -a; source "${TARGET}/.env"; set +a
: "${EVOLUTION_API_KEY:=${AUTHENTICATION_API_KEY:-}}"
if [ -z "${EVOLUTION_API_KEY:-}" ]; then
  echo "❌ EVOLUTION_API_KEY ausente no .env"; exit 1
fi

echo "📥 [2/7] Pull da nova imagem v2.3.1..."
docker compose pull evolution

echo "⏹️ [3/7] Parando + limpando volume corrompido..."
docker compose stop evolution || true
docker volume rm "${VOLUME_NAME}" 2>/dev/null || true
docker volume create "${VOLUME_NAME}" >/dev/null

echo "🚀 [4/7] Subindo evolution v2.3.1 com CONFIG_SESSION_PHONE_NAME corrigido..."
docker compose up -d evolution

echo "⏳ [5/7] Aguardando API responder..."
for i in $(seq 1 45); do
  curl -fsS "${API_BASE}/manager" >/dev/null 2>&1 && break
  sleep 2
done

echo ""
echo "✅ [6/7] Verificando que o Browser agora é correto (não kernel Linux)..."
sleep 3
docker compose logs --tail=30 evolution | grep -i "Browser:" | tail -5 || true

echo ""
echo "🆕 [7/7] Recriando instância ${INSTANCE_NAME}..."
curl -sS -X DELETE "${API_BASE}/instance/delete/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" >/dev/null 2>&1 || true
sleep 3

token_fragment=""
[ -n "${INSTANCE_TOKEN}" ] && token_fragment=$(printf ',"token":"%s"' "${INSTANCE_TOKEN}")
payload=$(printf '{"instanceName":"%s","integration":"WHATSAPP-BAILEYS","qrcode":true%s}' \
  "${INSTANCE_NAME}" "${token_fragment}")

curl -sS -X POST "${API_BASE}/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -d "${payload}" | head -c 400
echo ""

echo "⏳ Aguardando 8s para Baileys iniciar a sessão WhatsApp..."
sleep 8

connect_url="${API_BASE}/instance/connect/${INSTANCE_NAME}"
[ -n "${PHONE_NUMBER}" ] && connect_url="${connect_url}?number=${PHONE_NUMBER}"

echo ""
echo "📲 QR / Código de pareamento:"
curl -sS "${connect_url}" -H "apikey: ${EVOLUTION_API_KEY}"
echo ""
echo ""
echo "✅ Pronto. Se aparecer 'pairingCode' acima, digite no WhatsApp > Aparelhos conectados > Conectar com nº de telefone."
echo "📜 Para QR Code visual abra: ${API_BASE}/manager (login com a EVOLUTION_API_KEY)"
