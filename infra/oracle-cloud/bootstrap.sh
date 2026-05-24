#!/usr/bin/env bash
# 🟠 Bootstrap Oracle Cloud ARM Free — Planta y Raiz
# Roda na VM Ubuntu 22.04 ARM64 (VM.Standard.A1.Flex 4 OCPU / 24GB).
#
# Pré-requisitos:
#   • Conta Oracle Cloud Always Free criada (cloud.oracle.com/free)
#   • VM A1.Flex provisionada com Ubuntu 22.04 ARM64
#   • IP público fixo reservado (Networking → Reserved Public IPs)
#   • Security List liberando portas 80, 443 (TCP ingress 0.0.0.0/0)
#   • iptables interno: sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
#                       sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
#                       sudo netfilter-persistent save
#   • DNS Cloudflare apontando n8n/api/assinaturas/analytics.plantayraiz.com.br → IP da VM (proxy DESLIGADO/cinza)
#
# Uso:
#   ssh ubuntu@<IP>
#   sudo bash /opt/planta-infra/infra/oracle-cloud/bootstrap.sh

set -euo pipefail

REPO="https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git"
TARGET="/opt/planta-infra"

echo "🌱 [1/7] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

echo "🐳 [2/7] Garantindo Docker + Compose v2 (ARM64)..."
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

echo "🔥 [3/7] Liberando portas no iptables (Oracle vem com REJECT default)..."
iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT || true
iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT || true
apt-get install -y netfilter-persistent iptables-persistent || true
netfilter-persistent save || true

echo "📦 [4/7] Clonando/atualizando repo em ${TARGET}..."
if [ -d "${TARGET}/.git" ]; then
  git -C "${TARGET}" pull --ff-only
else
  git clone --depth=1 "${REPO}" "${TARGET}"
fi

cd "${TARGET}/infra/oracle-cloud"

echo "🔐 [5/7] Verificando .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  EDITE ${TARGET}/infra/oracle-cloud/.env com senhas reais antes de subir."
  echo "    Gere com: openssl rand -hex 32  /  openssl rand -base64 24"
  echo ""
  read -rp "Pressione ENTER após editar .env (Ctrl+C para abortar)..."
fi

echo "🚀 [6/7] Subindo stack (Traefik + n8n + DocuSeal + Plausible + Evolution)..."
docker compose pull
docker compose up -d

echo "🕐 [7/7] Aguardando Let's Encrypt emitir SSL (~2-5 min)..."
echo ""
echo "✅ Stack ARM ativa. Verifique:"
echo "  • https://n8n.plantayraiz.com.br"
echo "  • https://assinaturas.plantayraiz.com.br"
echo "  • https://analytics.plantayraiz.com.br"
echo "  • https://api.plantayraiz.com.br"
echo ""
echo "Logs:  docker compose logs -f traefik"
echo "Status: docker compose ps"
