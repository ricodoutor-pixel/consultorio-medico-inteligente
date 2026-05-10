#!/usr/bin/env bash
# 🚀 Bootstrap VPS Hostinger — Planta y Raiz
# Roda na VPS srv1641464 (2.24.69.154) via SSH como root.
#
# Uso:
#   ssh root@2.24.69.154
#   curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/infra/vps-traefik/bootstrap.sh | bash
#
# Ou manual: scp este arquivo, chmod +x, ./bootstrap.sh

set -euo pipefail

REPO="https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git"
TARGET="/opt/planta-infra"

echo "🌱 [1/6] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

echo "🐳 [2/6] Garantindo Docker + Compose v2..."
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

echo "🔥 [3/6] Configurando firewall (UFW)..."
if ! command -v ufw >/dev/null; then apt-get install -y ufw; fi
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "📦 [4/6] Clonando/atualizando repo em ${TARGET}..."
if [ -d "${TARGET}/.git" ]; then
  git -C "${TARGET}" pull --ff-only
else
  git clone --depth=1 "${REPO}" "${TARGET}"
fi

cd "${TARGET}/infra/vps-traefik"

echo "🔐 [5/6] Verificando .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  ATENÇÃO: edite ${TARGET}/infra/vps-traefik/.env com senhas reais antes de subir."
  echo "    Gere com: openssl rand -hex 32"
  echo ""
  read -rp "Pressione ENTER após editar .env (Ctrl+C para abortar)..."
fi

echo "🚀 [6/6] Subindo stack Docker (Traefik + n8n + DocuSeal + Plausible + Evolution)..."
docker compose pull
docker compose up -d

echo ""
echo "✅ Stack ativa. Aguarde ~2 min para Let's Encrypt emitir SSL."
echo ""
echo "Verifique:"
echo "  • https://n8n.plantayraiz.com.br          (login: admin)"
echo "  • https://assinaturas.plantayraiz.com.br  (DocuSeal — crie admin no 1º acesso)"
echo "  • https://analytics.plantayraiz.com.br    (Plausible — crie admin no 1º acesso)"
echo "  • https://api.plantayraiz.com.br          (Evolution API — use AUTHENTICATION_API_KEY)"
echo ""
echo "Logs em tempo real:  docker compose logs -f traefik"
