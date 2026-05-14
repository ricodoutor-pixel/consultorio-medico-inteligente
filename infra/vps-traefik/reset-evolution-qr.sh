#!/usr/bin/env bash

set -euo pipefail

TARGET="/opt/planta-infra/infra/vps-traefik"
VOLUME_NAME="vps-traefik_evolution_instances"
ENV_FILE="${TARGET}/.env"
INSTANCE_NAME="${1:-Brisa_CEO}"
INSTANCE_TOKEN="${2:-}"
PHONE_NUMBER="${3:-}"
API_BASE="https://api.plantayraiz.com.br"

request_with_status() {
  local method="$1"
  local url="$2"
  shift 2
  curl -sS -w "\nHTTP_STATUS:%{http_code}" -X "${method}" "${url}" "$@"
}

response_status() {
  printf '%s\n' "$1" | sed -n 's/^HTTP_STATUS://p' | tail -n 1
}

response_body() {
  printf '%s\n' "$1" | sed '/^HTTP_STATUS:/d'
}

echo "🛠️ [1/8] Verificando stack local..."
if [ ! -d "${TARGET}" ]; then
  echo "❌ Stack não encontrada em ${TARGET}. Rode o bootstrap primeiro."
  exit 1
fi

cd "${TARGET}"

if [ ! -f "${ENV_FILE}" ]; then
  echo "❌ Arquivo ${ENV_FILE} não encontrado."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

: "${EVOLUTION_API_KEY:=${AUTHENTICATION_API_KEY:-${API_KEY:-}}}"
if [ -z "${EVOLUTION_API_KEY:-}" ]; then
  echo "❌ Nenhuma API key encontrada (EVOLUTION_API_KEY / AUTHENTICATION_API_KEY) em ${ENV_FILE}."
  exit 1
fi
echo "🔑 Usando API key terminada em ...${EVOLUTION_API_KEY: -6}"

echo "🔄 [2/8] Atualizando arquivos do repositório..."
git pull --ff-only || true

echo "⏹️ [3/8] Reiniciando o serviço Evolution..."
docker compose stop evolution || true
docker compose up -d evolution

echo "⏳ [4/8] Aguardando a API responder..."
ready=0
for i in $(seq 1 30); do
  if curl -fsS "${API_BASE}/manager" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "${ready}" -ne 1 ]; then
  echo "⚠️ A API não respondeu pela rota /manager após 60s. Vou continuar mesmo assim."
fi

echo "🧹 [5/8] Limpando estado corrompido do Baileys..."
docker compose stop evolution || true
docker volume rm "${VOLUME_NAME}" 2>/dev/null || true
docker volume create "${VOLUME_NAME}" >/dev/null
docker compose up -d evolution

echo "⏳ [6/8] Aguardando a API voltar após limpeza..."
ready=0
for i in $(seq 1 45); do
  if curl -fsS "${API_BASE}/manager" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "${ready}" -ne 1 ]; then
  echo "❌ A API não voltou a responder após a limpeza."
  echo "📜 Verifique: docker compose logs --tail=200 evolution"
  exit 1
fi

echo "🗑️ [7/8] Removendo instância antiga (${INSTANCE_NAME}) se existir..."
delete_response=$(request_with_status DELETE "${API_BASE}/instance/delete/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" || true)
delete_status=$(response_status "${delete_response}")

if [ -n "${delete_status}" ]; then
  echo "$(response_body "${delete_response}")"
fi

echo "⏳ Aguardando a exclusão realmente sair do cadastro interno..."
deleted=0
for i in $(seq 1 20); do
  state_response=$(request_with_status GET "${API_BASE}/instance/connectionState/${INSTANCE_NAME}" \
    -H "apikey: ${EVOLUTION_API_KEY}" || true)
  state_status=$(response_status "${state_response}")
  if [ "${state_status}" = "404" ]; then
    deleted=1
    break
  fi
  sleep 2
done

if [ "${deleted}" -ne 1 ]; then
  echo "⚠️ A exclusão ainda não propagou totalmente. Vou tentar recriar mesmo assim com retentativas."
fi

echo "🆕 [8/8] Criando instância limpa (${INSTANCE_NAME})..."
token_fragment=""
if [ -n "${INSTANCE_TOKEN}" ]; then
  token_fragment=$(printf ',"token":"%s"' "${INSTANCE_TOKEN}")
fi

payload=$(printf '{"instanceName":"%s","integration":"WHATSAPP-BAILEYS","qrcode":true%s}' \
  "${INSTANCE_NAME}" \
  "${token_fragment}")

create_response=""
created=0
for i in $(seq 1 15); do
  create_response=$(request_with_status POST "${API_BASE}/instance/create" \
    -H "Content-Type: application/json" \
    -H "apikey: ${EVOLUTION_API_KEY}" \
    -d "${payload}")

  create_status=$(response_status "${create_response}")
  create_body=$(response_body "${create_response}")

  if [ "${create_status}" = "200" ] || [ "${create_status}" = "201" ]; then
    created=1
    break
  fi

  if printf '%s' "${create_body}" | grep -q 'already in use'; then
    sleep 2
    continue
  fi

  break
done

echo "✅ Resposta da criação:"
printf '%s\n' "${create_response}" | sed 's/"apikey":"[^"]*"/"apikey":"***"/g'

if [ "${created}" -ne 1 ]; then
  echo "❌ Não foi possível recriar a instância." 
  exit 1
fi

connect_url="${API_BASE}/instance/connect/${INSTANCE_NAME}"
if [ -n "${PHONE_NUMBER}" ]; then
  connect_url="${connect_url}?number=${PHONE_NUMBER}"
fi

echo ""
echo "🔌 Estado da conexão:"
curl -sS "${API_BASE}/instance/connectionState/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" || true

echo ""
echo "📲 QR code / pareamento:"
connect_response=""
paired=0
for i in $(seq 1 20); do
  connect_response=$(request_with_status GET "${connect_url}" \
    -H "apikey: ${EVOLUTION_API_KEY}" || true)
  connect_status=$(response_status "${connect_response}")
  connect_body=$(response_body "${connect_response}")

  if [ "${connect_status}" = "200" ] && printf '%s' "${connect_body}" | grep -Eq '"pairingCode"|"code"|"count"[[:space:]]*:[[:space:]]*[1-9]'; then
    paired=1
    break
  fi

  sleep 3
done

printf '%s\n' "${connect_response}" | sed '/^HTTP_STATUS:/d'

if [ "${paired}" -ne 1 ]; then
  echo "⚠️ A API respondeu, mas ainda não gerou QR/código. Rode: docker compose logs --tail=200 evolution"
fi

echo ""
echo "📜 Logs úteis (Ctrl+C para sair):"
echo "docker compose logs -f evolution | grep -i -E 'server is running|database connected|qr|ready|error|baileys|pair'"