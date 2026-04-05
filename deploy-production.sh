#!/bin/bash

###############################################################################
# SCRIPT DE DEPLOY AUTOMÁTICO PARA PRODUÇÃO
# Plantayraiz.com.br - Deploy no Hostinger
# Data: 04 de Abril de 2026
###############################################################################

set -e

echo "🚀 INICIANDO DEPLOY PARA PRODUÇÃO"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
REPO_NAME="consultorio-medico-inteligente"
BRANCH="main"
BUILD_DIR="dist"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backups"

# Função para log
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# ============================================================================
# FASE 1: VALIDAÇÃO PRÉ-DEPLOY
# ============================================================================

log "FASE 1: Validação Pré-Deploy"
echo ""

# Verificar se estamos no branch correto
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    error "Você está no branch '$CURRENT_BRANCH', não em '$BRANCH'"
fi
log "✓ Branch correto: $BRANCH"

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
    error "Há mudanças não commitadas. Faça commit antes de fazer deploy."
fi
log "✓ Sem mudanças não commitadas"

# Verificar se o build existe
if [ ! -d "$BUILD_DIR" ]; then
    error "Diretório de build não encontrado: $BUILD_DIR"
fi
log "✓ Diretório de build encontrado"

# ============================================================================
# FASE 2: CRIAR BACKUP
# ============================================================================

log "FASE 2: Criar Backup"
echo ""

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

# Fazer backup do build anterior (se existir)
if [ -d "$BUILD_DIR" ]; then
    tar -czf "$BACKUP_FILE" "$BUILD_DIR" 2>/dev/null || true
    log "✓ Backup criado: $BACKUP_FILE"
    
    # Manter apenas os últimos 10 backups
    ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    log "✓ Limpeza de backups antigos concluída"
fi

# ============================================================================
# FASE 3: BUILD FINAL
# ============================================================================

log "FASE 3: Build Final"
echo ""

npm run build 2>&1 | tail -20
if [ $? -ne 0 ]; then
    error "Build falhou!"
fi
log "✓ Build concluído com sucesso"

# ============================================================================
# FASE 4: TESTES PRÉ-DEPLOY
# ============================================================================

log "FASE 4: Testes Pré-Deploy"
echo ""

# Verificar se index.html foi gerado
if [ ! -f "$BUILD_DIR/index.html" ]; then
    error "index.html não foi gerado no build"
fi
log "✓ index.html verificado"

# Verificar se assets foram gerados
if [ ! -d "$BUILD_DIR/assets" ]; then
    error "Diretório de assets não foi gerado"
fi
log "✓ Assets verificados"

# Contar arquivos gerados
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
log "✓ Total de arquivos gerados: $FILE_COUNT"

# ============================================================================
# FASE 5: PUSH PARA GITHUB
# ============================================================================

log "FASE 5: Push para GitHub"
echo ""

# Adicionar arquivos de build ao git
git add -A
git commit -m "chore: Deploy para produção - $(date '+%d/%m/%Y %H:%M:%S')" || warning "Nenhuma mudança para commitar"

# Push para GitHub
git push origin "$BRANCH"
if [ $? -ne 0 ]; then
    error "Falha ao fazer push para GitHub"
fi
log "✓ Push para GitHub concluído"

# ============================================================================
# FASE 6: INFORMAÇÕES DE DEPLOY
# ============================================================================

log "FASE 6: Informações de Deploy"
echo ""

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)

log "Commit Hash: $COMMIT_HASH"
log "Commit Message: $COMMIT_MESSAGE"
log "Tamanho do Build: $BUILD_SIZE"
log "Timestamp: $TIMESTAMP"

# ============================================================================
# FASE 7: WEBHOOK HOSTINGER
# ============================================================================

log "FASE 7: Acionando Webhook do Hostinger"
echo ""

# O Hostinger detectará o novo push automaticamente via GitHub webhook
log "✓ Webhook será acionado automaticamente pelo GitHub"
log "✓ Hostinger iniciará o build em breve"

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo ""
echo "=================================="
echo -e "${GREEN}✓ DEPLOY PARA PRODUÇÃO INICIADO${NC}"
echo "=================================="
echo ""
echo "📊 Resumo:"
echo "  • Commit: $COMMIT_HASH"
echo "  • Branch: $BRANCH"
echo "  • Tamanho: $BUILD_SIZE"
echo "  • Arquivos: $FILE_COUNT"
echo "  • Backup: $BACKUP_FILE"
echo ""
echo "🔄 Próximos passos:"
echo "  1. Hostinger detectará o novo push"
echo "  2. Build automático será iniciado"
echo "  3. Site será atualizado em produção"
echo "  4. Monitoramento será iniciado"
echo ""
echo "📍 Site em produção: https://plantayraiz.com.br"
echo ""

exit 0
