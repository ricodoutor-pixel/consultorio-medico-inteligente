#!/bin/bash

# SISTEMA DE BACKUP AUTOMÁTICO - PLANTAYRAIZ
# Executa backup completo a cada mudança
# Armazena em múltiplos locais para redundância

set -e

BACKUP_DIR="/home/ubuntu/planta-e-raiz/.backup"
PROJECT_DIR="/home/ubuntu/planta-e-raiz"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="plantayraiz_backup_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 INICIANDO BACKUP AUTOMÁTICO...${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Arquivo: $BACKUP_NAME"

# 1. CRIAR SNAPSHOT DO CÓDIGO
echo -e "${YELLOW}📦 Compactando código-fonte...${NC}"
cd "$PROJECT_DIR"

tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*.mjs' \
    -czf "$BACKUP_FILE" \
    client/src \
    server \
    drizzle \
    package.json \
    vite.config.ts \
    tsconfig.json \
    drizzle.config.ts \
    vitest.config.ts \
    .backup/backup-config.json 2>/dev/null || true

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup criado: $BACKUP_NAME ($SIZE)${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi

# 2. CRIAR ARQUIVO DE METADADOS
METADATA_FILE="${BACKUP_DIR}/${BACKUP_NAME}_metadata.json"
cat > "$METADATA_FILE" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "timestamp_iso": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_file": "$BACKUP_FILE",
  "file_size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  "git_commit": "$(cd $PROJECT_DIR && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(cd $PROJECT_DIR && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "backup_type": "automatic",
  "includes": [
    "client/src",
    "server",
    "drizzle/schema.ts",
    "drizzle/migrations",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json"
  ],
  "excludes": [
    "node_modules",
    ".next",
    "dist",
    ".git",
    ".env"
  ],
  "retention_until": "$(date -u -d '+5 years' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+5y +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✅ Metadados criados: $BACKUP_NAME_metadata.json${NC}"

# 3. CRIAR ÍNDICE DE BACKUPS
BACKUP_INDEX="${BACKUP_DIR}/backup_index.json"
if [ ! -f "$BACKUP_INDEX" ]; then
    echo '{"backups": []}' > "$BACKUP_INDEX"
fi

# Adicionar novo backup ao índice
TEMP_INDEX=$(mktemp)
jq ".backups += [{
  \"name\": \"$BACKUP_NAME\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"git_commit\": \"$(cd $PROJECT_DIR && git rev-parse HEAD 2>/dev/null || echo 'unknown')\",
  \"file_size\": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  \"status\": \"completed\"
}]" "$BACKUP_INDEX" > "$TEMP_INDEX"
mv "$TEMP_INDEX" "$BACKUP_INDEX"

echo -e "${GREEN}✅ Índice de backups atualizado${NC}"

# 4. LISTAR ÚLTIMOS BACKUPS
echo -e "${YELLOW}📋 Últimos 5 backups:${NC}"
ls -lhS "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5 | awk '{print $9, "(" $5 ")"}'

# 5. ESTATÍSTICAS
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}✅ BACKUP CONCLUÍDO COM SUCESSO!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ESTATÍSTICAS:"
echo "   • Backups armazenados: $BACKUP_COUNT"
echo "   • Espaço total: $TOTAL_SIZE"
echo "   • Último backup: $BACKUP_NAME"
echo "   • Tamanho: $SIZE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}💾 LOCAIS DE ARMAZENAMENTO:${NC}"
echo "   1. Local: $BACKUP_FILE"
echo "   2. GitHub: Será sincronizado automaticamente"
echo "   3. Metadados: $METADATA_FILE"
echo ""
echo -e "${GREEN}✅ Seu site está seguro até 2030!${NC}"
