#!/bin/bash

# SISTEMA DE RESTAURAÇÃO - PLANTAYRAIZ
# Restaura o site a partir de qualquer backup anterior
# Uso: ./restore.sh <backup_name>

set -e

BACKUP_DIR="/home/ubuntu/planta-e-raiz/.backup"
PROJECT_DIR="/home/ubuntu/planta-e-raiz"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de ajuda
show_help() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        SISTEMA DE RESTAURAÇÃO - PLANTAYRAIZ              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Uso: $0 [opção]"
    echo ""
    echo "Opções:"
    echo "  list              - Listar todos os backups disponíveis"
    echo "  latest            - Restaurar o backup mais recente"
    echo "  <backup_name>     - Restaurar um backup específico"
    echo ""
    echo "Exemplos:"
    echo "  $0 list"
    echo "  $0 latest"
    echo "  $0 plantayraiz_backup_20260403_120000"
    echo ""
}

# Função para listar backups
list_backups() {
    echo -e "${BLUE}📋 BACKUPS DISPONÍVEIS:${NC}"
    echo ""
    
    if [ ! -f "$BACKUP_DIR/backup_index.json" ]; then
        echo -e "${RED}❌ Nenhum backup encontrado${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Índice de Backups:${NC}"
    jq -r '.backups[] | "\(.timestamp) | \(.name) | \(.file_size) bytes | Commit: \(.git_commit)"' "$BACKUP_DIR/backup_index.json" | nl
    
    echo ""
    echo -e "${YELLOW}Arquivos de Backup:${NC}"
    ls -lhS "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{printf "%s  %10s  %s\n", $6, $5, $9}' | nl
    
    echo ""
    echo -e "${BLUE}Total de backups: $(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)${NC}"
}

# Função para restaurar backup
restore_backup() {
    local backup_name=$1
    local backup_file="$BACKUP_DIR/${backup_name}.tar.gz"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup não encontrado: $backup_name${NC}"
        echo -e "${YELLOW}Use '$0 list' para ver backups disponíveis${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  ATENÇÃO: Você está prestes a restaurar o site!${NC}"
    echo -e "${YELLOW}Backup: $backup_name${NC}"
    echo -e "${YELLOW}Arquivo: $backup_file${NC}"
    echo ""
    read -p "Deseja continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}Restauração cancelada${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔄 Iniciando restauração...${NC}"
    
    # Criar backup de segurança do estado atual
    echo -e "${YELLOW}💾 Criando backup de segurança do estado atual...${NC}"
    SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar --exclude='node_modules' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='.git' \
        -czf "$SAFETY_BACKUP" \
        -C "$PROJECT_DIR" \
        client/src server drizzle package.json 2>/dev/null || true
    echo -e "${GREEN}✅ Backup de segurança criado: $SAFETY_BACKUP${NC}"
    
    # Restaurar arquivos
    echo -e "${YELLOW}📂 Restaurando arquivos...${NC}"
    cd "$PROJECT_DIR"
    tar -xzf "$backup_file"
    
    echo -e "${GREEN}✅ Arquivos restaurados${NC}"
    
    # Reinstalar dependências
    echo -e "${YELLOW}📦 Reinstalando dependências...${NC}"
    if command -v pnpm &> /dev/null; then
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    fi
    
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
    
    # Ler metadados
    METADATA_FILE="$BACKUP_DIR/${backup_name}_metadata.json"
    if [ -f "$METADATA_FILE" ]; then
        echo ""
        echo -e "${BLUE}📋 INFORMAÇÕES DO BACKUP:${NC}"
        jq '.' "$METADATA_FILE" | head -15
    fi
    
    echo ""
    echo -e "${GREEN}✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}Próximos passos:${NC}"
    echo "  1. Verificar se o site está funcionando"
    echo "  2. Testar todas as funcionalidades"
    echo "  3. Se houver problemas, use outro backup"
    echo ""
    echo -e "${BLUE}Backup de segurança (estado anterior): $SAFETY_BACKUP${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# MAIN
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

case "$1" in
    list)
        list_backups
        ;;
    latest)
        LATEST=$(ls -1t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1 | xargs basename | sed 's/\.tar\.gz$//')
        if [ -z "$LATEST" ]; then
            echo -e "${RED}❌ Nenhum backup encontrado${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Restaurando backup mais recente: $LATEST${NC}"
        restore_backup "$LATEST"
        ;;
    help|-h|--help)
        show_help
        ;;
    *)
        restore_backup "$1"
        ;;
esac
