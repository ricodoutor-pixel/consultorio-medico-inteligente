#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🔍 AUDITORIA COMPLETA - PLANTA & RAIZ 🔍              ║"
echo "║                                                                ║"
echo "║  Executando 20 testes de auditoria em tempo real...           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se Playwright está instalado
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install --save-dev @playwright/test

echo ""
echo -e "${BLUE}🚀 Iniciando testes...${NC}"
echo ""

# Executar testes
npx playwright test tests/auditoria-completa.spec.ts --reporter=html,json,junit

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "📊 Relatórios gerados:"
    echo "  - HTML Report: playwright-report/index.html"
    echo "  - JSON Report: test-results.json"
    echo "  - JUnit Report: junit.xml"
    echo ""
    echo -e "${GREEN}🟢 PLANTA & RAIZ ESTÁ PRONTO PARA PRODUÇÃO!${NC}"
else
    echo ""
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "📊 Verifique o relatório em: playwright-report/index.html"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
