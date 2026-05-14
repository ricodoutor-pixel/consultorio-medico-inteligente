#!/usr/bin/env bash

set -euo pipefail

TARGET="/opt/planta-infra/infra/vps-traefik"
VOLUME_NAME="vps-traefik_evolution_instances"
ENV_FILE="${TARGET}/.env"
INSTANCE_NAME="${1:-Brisa_CEO}"
INSTANCE_TOKEN="${2:-}"
API_BASE="https://api.plantayraiz.com.br"

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
curl -fsS -X DELETE "${API_BASE}/instance/delete/${INSTANCE_NAME}" \
  -H "apikey: ${EVOLUTION_API_KEY}" >/dev/null 2>&1 || true

echo "🆕 [8/8] Criando instância limpa (${INSTANCE_NAME})..."
token_fragment=""
if [ -n "${INSTANCE_TOKEN}" ]; then
  token_fragment=$(printf ',"token":"%s"' "${INSTANCE_TOKEN}")
fi

payload=$(printf '{"instanceName":"%s","qrcode":true%s}' \
  "${INSTANCE_NAME}" \
  "${token_fragment}")

create_response=$(curl -fsS -X POST "${API_BASE}/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVOLUTION_API_KEY}" \
  -d "${payload}")

echo "✅ Instância recriada. Resposta resumida:"
printf '%s\n' "${create_response}" | sed 's/"apikey":"[^"]*"/"apikey":"***"/g'

echo ""
echo "📜 Logs úteis (Ctrl+C para sair):"
echo "docker compose logs -f evolution | grep -i -E 'server is running|database connected|qr|ready|error|baileys|pair'"