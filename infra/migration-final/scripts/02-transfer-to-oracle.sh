#!/usr/bin/env bash
# ============================================================
# 🟠 ETAPA 2 — TRANSFERIR HOSTINGER → ORACLE (via rsync/ssh)
# ============================================================
# Rode NA HOSTINGER. Envia o .tar.gz gerado pelo passo 01 para a Oracle.
# Pré-requisito: chave SSH da Hostinger autorizada no authorized_keys da Oracle
#   ssh-keygen -t ed25519 -f /root/.ssh/oracle_key -N ""
#   ssh-copy-id -i /root/.ssh/oracle_key.pub ubuntu@147.15.63.175
# ============================================================
set -euo pipefail

ORACLE_IP="${ORACLE_IP:-147.15.63.175}"
ORACLE_USER="${ORACLE_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-/root/.ssh/oracle_key}"
REMOTE_DIR="/opt/planta-migration-incoming"

LATEST=$(ls -1t /root/planta-migration-FINAL-*.tar.gz | head -1)
[ -n "$LATEST" ] || { echo "❌ Nenhum tar.gz encontrado. Rode 01-export-hostinger.sh antes."; exit 1; }

echo "📡 Enviando $(basename "$LATEST") → ${ORACLE_USER}@${ORACLE_IP}:${REMOTE_DIR}/"
ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" "sudo mkdir -p ${REMOTE_DIR} && sudo chown ${ORACLE_USER}:${ORACLE_USER} ${REMOTE_DIR}"

# rsync com -a preserva permissões/owner/timestamps; -P mostra progresso e retoma se cair
rsync -aP --human-readable -e "ssh -i $SSH_KEY" "$LATEST" "${LATEST}.sha256" \
  "${ORACLE_USER}@${ORACLE_IP}:${REMOTE_DIR}/"

echo ""
echo "🔐 Validando SHA-256 no destino..."
ssh -i "$SSH_KEY" "${ORACLE_USER}@${ORACLE_IP}" \
  "cd ${REMOTE_DIR} && sha256sum -c $(basename "${LATEST}.sha256")"

echo ""
echo "✅ Transferência íntegra. Continue na Oracle: 03-import-oracle.sh"
