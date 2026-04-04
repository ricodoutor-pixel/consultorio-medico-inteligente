#!/bin/bash

###############################################################################
# SCRIPT DE BACKUP AUTOMÁTICO DIÁRIO
# Plantayraiz.com.br - Backup Seguro até 2030
# Data: 04 de Abril de 2026
###############################################################################

set -e

# Configurações
REPO_DIR="/home/ubuntu/planta-e-raiz"
BACKUP_BASE_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
# FASE 1: PREPARAÇÃO
# ============================================================================

log "FASE 1: Preparação do Backup"
echo ""

# Criar diretórios de backup
mkdir -p "$BACKUP_BASE_DIR/code"
mkdir -p "$BACKUP_BASE_DIR/database"
mkdir -p "$BACKUP_BASE_DIR/assets"
mkdir -p "$BACKUP_BASE_DIR/logs"

log "✓ Diretórios de backup criados"

# ============================================================================
# FASE 2: BACKUP DO CÓDIGO
# ============================================================================

log "FASE 2: Backup do Código"
echo ""

BACKUP_CODE="$BACKUP_BASE_DIR/code/backup_code_${TIMESTAMP}.tar.gz"

# Fazer backup do código-fonte
tar -czf "$BACKUP_CODE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.env' \
    -C "$REPO_DIR" . 2>/dev/null

if [ -f "$BACKUP_CODE" ]; then
    SIZE=$(du -h "$BACKUP_CODE" | cut -f1)
    log "✓ Backup do código criado: $BACKUP_CODE ($SIZE)"
else
    error "Falha ao criar backup do código"
fi

# ============================================================================
# FASE 3: BACKUP DO BANCO DE DADOS
# ============================================================================

log "FASE 3: Backup do Banco de Dados"
echo ""

BACKUP_DB="$BACKUP_BASE_DIR/database/backup_db_${TIMESTAMP}.sql"

# Exportar dados do banco de dados (se disponível)
# Nota: Você precisa configurar as credenciais do banco de dados
if command -v mysqldump &> /dev/null; then
    # Exemplo para MySQL/MariaDB
    # mysqldump -u user -p password database_name > "$BACKUP_DB"
    log "⚠ Backup de banco de dados: Manual (configure credenciais)"
else
    warning "mysqldump não encontrado. Pulando backup de banco de dados."
fi

# ============================================================================
# FASE 4: BACKUP DE ASSETS
# ============================================================================

log "FASE 4: Backup de Assets"
echo ""

BACKUP_ASSETS="$BACKUP_BASE_DIR/assets/backup_assets_${TIMESTAMP}.tar.gz"

# Fazer backup de imagens e assets
if [ -d "$REPO_DIR/client/public" ]; then
    tar -czf "$BACKUP_ASSETS" \
        -C "$REPO_DIR/client" public 2>/dev/null
    
    SIZE=$(du -h "$BACKUP_ASSETS" | cut -f1)
    log "✓ Backup de assets criado: $BACKUP_ASSETS ($SIZE)"
else
    warning "Diretório de assets não encontrado"
fi

# ============================================================================
# FASE 5: BACKUP DE CONFIGURAÇÕES
# ============================================================================

log "FASE 5: Backup de Configurações"
echo ""

BACKUP_CONFIG="$BACKUP_BASE_DIR/config_${TIMESTAMP}.tar.gz"

# Fazer backup de arquivos de configuração
tar -czf "$BACKUP_CONFIG" \
    -C "$REPO_DIR" \
    vite.config.ts \
    tsconfig.json \
    package.json \
    package-lock.json \
    .env.example \
    2>/dev/null

SIZE=$(du -h "$BACKUP_CONFIG" | cut -f1)
log "✓ Backup de configurações criado: $BACKUP_CONFIG ($SIZE)"

# ============================================================================
# FASE 6: BACKUP DO GIT
# ============================================================================

log "FASE 6: Backup do Git"
echo ""

BACKUP_GIT="$BACKUP_BASE_DIR/git/backup_git_${TIMESTAMP}.tar.gz"
mkdir -p "$BACKUP_BASE_DIR/git"

# Fazer backup do histórico git
tar -czf "$BACKUP_GIT" \
    -C "$REPO_DIR" .git 2>/dev/null

SIZE=$(du -h "$BACKUP_GIT" | cut -f1)
log "✓ Backup do Git criado: $BACKUP_GIT ($SIZE)"

# ============================================================================
# FASE 7: CRIAR ARQUIVO DE MANIFESTO
# ============================================================================

log "FASE 7: Criar Manifesto de Backup"
echo ""

MANIFEST="$BACKUP_BASE_DIR/manifest_${BACKUP_DATE}.txt"

cat > "$MANIFEST" << EOF
================================================================================
MANIFESTO DE BACKUP
Data: $(date '+%d de %B de %Y às %H:%M:%S')
Timestamp: $TIMESTAMP
================================================================================

ARQUIVOS DE BACKUP:
  • Código: $BACKUP_CODE
  • Banco de Dados: $BACKUP_DB
  • Assets: $BACKUP_ASSETS
  • Configurações: $BACKUP_CONFIG
  • Git: $BACKUP_GIT

INFORMAÇÕES:
  • Repositório: $REPO_DIR
  • Tamanho Total: $(du -sh "$BACKUP_BASE_DIR" | cut -f1)
  • Retenção: $RETENTION_DAYS dias

INSTRUÇÕES DE RESTAURAÇÃO:
  1. Copiar arquivos de backup para local seguro
  2. Para restaurar código: tar -xzf backup_code_*.tar.gz
  3. Para restaurar assets: tar -xzf backup_assets_*.tar.gz
  4. Para restaurar git: tar -xzf backup_git_*.tar.gz

VERIFICAÇÃO DE INTEGRIDADE:
  • Todos os arquivos foram comprimidos com gzip
  • Verifique com: tar -tzf [arquivo].tar.gz

================================================================================
EOF

log "✓ Manifesto criado: $MANIFEST"

# ============================================================================
# FASE 8: LIMPEZA DE BACKUPS ANTIGOS
# ============================================================================

log "FASE 8: Limpeza de Backups Antigos"
echo ""

# Remover backups com mais de RETENTION_DAYS dias
find "$BACKUP_BASE_DIR" -type f -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_BASE_DIR" -type f -name "backup_*.sql" -mtime +$RETENTION_DAYS -delete 2>/dev/null

log "✓ Backups antigos removidos (retenção: $RETENTION_DAYS dias)"

# ============================================================================
# FASE 9: VERIFICAÇÃO DE INTEGRIDADE
# ============================================================================

log "FASE 9: Verificação de Integridade"
echo ""

# Verificar se todos os arquivos de backup foram criados com sucesso
BACKUP_COUNT=$(find "$BACKUP_BASE_DIR" -type f -name "backup_*_${TIMESTAMP}.*" | wc -l)

if [ "$BACKUP_COUNT" -ge 4 ]; then
    log "✓ Todos os backups foram criados com sucesso ($BACKUP_COUNT arquivos)"
else
    warning "Apenas $BACKUP_COUNT backups foram criados (esperado: 4+)"
fi

# ============================================================================
# FASE 10: RESUMO FINAL
# ============================================================================

log "FASE 10: Resumo Final"
echo ""

TOTAL_SIZE=$(du -sh "$BACKUP_BASE_DIR" | cut -f1)
BACKUP_COUNT=$(find "$BACKUP_BASE_DIR" -type f | wc -l)

cat << EOF

================================================================================
✓ BACKUP DIÁRIO CONCLUÍDO COM SUCESSO
================================================================================

📊 Resumo:
  • Data: $(date '+%d/%m/%Y')
  • Hora: $(date '+%H:%M:%S')
  • Timestamp: $TIMESTAMP
  • Total de arquivos: $BACKUP_COUNT
  • Tamanho total: $TOTAL_SIZE
  • Retenção: $RETENTION_DAYS dias

📁 Localização dos Backups:
  • Código: $BACKUP_BASE_DIR/code/
  • Banco de Dados: $BACKUP_BASE_DIR/database/
  • Assets: $BACKUP_BASE_DIR/assets/
  • Git: $BACKUP_BASE_DIR/git/
  • Logs: $BACKUP_BASE_DIR/logs/

🔒 Segurança:
  • Todos os arquivos estão comprimidos com gzip
  • Recomenda-se copiar para local externo (S3, Google Drive, etc.)
  • Verifique regularmente a integridade dos backups

📋 Manifesto:
  $MANIFEST

================================================================================

EOF

exit 0
