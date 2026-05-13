#!/usr/bin/env bash
# 🩹 fix-stack.sh — Autocura da stack VPS Planta y Raiz
# Roda na VPS srv1641464 (2.24.69.154) como root.
#
# Uso:
#   ssh root@2.24.69.154
#   curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/infra/vps-traefik/fix-stack.sh | bash
#
# Lógica:
#   1. Substitui placeholders TROCAR_* por senhas reais (openssl rand)
#   2. docker compose pull + up -d --force-recreate
#   3. Aguarda 60s, mostra docker compose ps
#   4. Testa HTTPS dos 4 subdomínios

set -euo pipefail

TARGET="/opt/planta-infra/infra/vps-traefik"
ENV_FILE="${TARGET}/.env"
BACKUP="${ENV_FILE}.bak.$(date +%s)"

echo "🩹 [1/6] Verificando ambiente..."
if [ ! -d "${TARGET}" ]; then
  echo "❌ Repo não encontrado em ${TARGET}. Rode bootstrap.sh primeiro."
  exit 1
fi
cd "${TARGET}"

if ! git diff --quiet -- docker-compose.yml; then
  COMPOSE_BACKUP="${TARGET}/docker-compose.yml.bak.$(date +%s)"
  cp docker-compose.yml "${COMPOSE_BACKUP}"
  echo "🧹 docker-compose.yml local alterado; backup salvo em ${COMPOSE_BACKUP}"
  git restore docker-compose.yml
fi

git pull --ff-only || true

if [ ! -f "${ENV_FILE}" ]; then
  echo "📋 .env ausente — copiando de .env.example"
  cp .env.example .env
fi

echo "🔐 [2/6] Substituindo placeholders TROCAR_* por senhas reais..."
cp "${ENV_FILE}" "${BACKUP}"
echo "    backup salvo em ${BACKUP}"

# Função: gera secret e substitui no .env (apenas se valor atual contém TROCAR)
replace_if_placeholder() {
  local key="$1"
  local generator="$2"
  local current
  current=$(grep -E "^${key}=" "${ENV_FILE}" | cut -d= -f2- || echo "")
  if [[ "${current}" == *TROCAR* ]] || [ -z "${current}" ]; then
    local new_val
    new_val=$(eval "${generator}")
    # escape para sed
    local escaped=${new_val//\//\\/}
    sed -i "s|^${key}=.*|${key}=${escaped}|" "${ENV_FILE}"
    echo "    ✅ ${key} regenerado"
  else
    echo "    ⏭️  ${key} já configurado, mantendo"
  fi
}

replace_if_placeholder "N8N_PASSWORD"             "openssl rand -base64 24 | tr -d '\n/+='"
replace_if_placeholder "N8N_ENCRYPTION_KEY"       "openssl rand -hex 32"
replace_if_placeholder "PLAUSIBLE_DB_PASSWORD"    "openssl rand -base64 24 | tr -d '\n/+='"
replace_if_placeholder "PLAUSIBLE_SECRET_KEY_BASE" "openssl rand -hex 64"
replace_if_placeholder "EVOLUTION_DB_PASSWORD"    "openssl rand -base64 24 | tr -d '\n/+='"
replace_if_placeholder "EVOLUTION_API_KEY"        "openssl rand -hex 24"

# Garantir N8N_USER
if ! grep -q "^N8N_USER=" "${ENV_FILE}"; then
  echo "N8N_USER=admin" >> "${ENV_FILE}"
fi
if ! grep -q "^ACME_EMAIL=" "${ENV_FILE}"; then
  echo "ACME_EMAIL=contato@plantayraiz.com.br" >> "${ENV_FILE}"
fi

echo ""
echo "🐳 [3/6] docker compose pull..."
docker compose pull

echo ""
echo "🔄 [4/6] Force-recreate de todos os containers..."
docker compose up -d --force-recreate --remove-orphans

echo ""
echo "⏳ [5/6] Aguardando 60s para containers estabilizarem + Let's Encrypt..."
for i in $(seq 1 12); do
  printf "."
  sleep 5
done
echo ""

echo ""
echo "📊 docker compose ps:"
docker compose ps

echo ""
echo "🔒 [6/6] Teste HTTPS dos subdomínios:"
for host in n8n.plantayraiz.com.br assinaturas.plantayraiz.com.br analytics.plantayraiz.com.br api.plantayraiz.com.br; do
  code=$(curl -ks -o /dev/null -w "%{http_code}" -I "https://${host}" || echo "ERR")
  ssl=$(curl -sI "https://${host}" 2>&1 | grep -i "ssl certificate" || echo "—")
  echo "  • https://${host}  →  HTTP ${code}"
done

echo ""
echo "📝 Credenciais geradas (salve em local seguro):"
echo "─────────────────────────────────────────────"
grep -E "^(N8N_USER|N8N_PASSWORD|EVOLUTION_API_KEY)=" "${ENV_FILE}"
echo "─────────────────────────────────────────────"
echo ""
echo "✅ Autocura concluída."
echo ""
echo "Próximos passos:"
echo "  1. Acesse https://n8n.plantayraiz.com.br (login acima)"
echo "  2. Crie admin no DocuSeal e Plausible (1º acesso)"
echo "  3. Salve EVOLUTION_API_KEY como secret no Lovable Cloud"
echo ""
echo "Logs em tempo real:  cd ${TARGET} && docker compose logs -f traefik"
