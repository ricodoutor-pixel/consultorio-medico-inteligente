#!/bin/bash

# Script de Deploy Otimizado para Hostinger
# Resolve problemas de timeout, memória e cache

set -e

echo "🚀 Iniciando deploy otimizado para Hostinger..."

# 1. Limpar cache
echo "🧹 Limpando cache..."
rm -rf node_modules dist .vite

# 2. Instalar dependências com otimizações
echo "📦 Instalando dependências..."
npm install --legacy-peer-deps --prefer-offline --no-audit

# 3. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
export VITE_APP_TITLE="Planta & Raiz"
export VITE_SUPABASE_PROJECT_ID="shmbwdjuddvquszwkvuq"
export VITE_SUPABASE_URL="https://shmbwdjuddvquszwkvuq.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ"

# 4. Fazer build
echo "🔨 Fazendo build..."
npm run build

# 5. Verificar se build foi bem-sucedido
if [ -d "dist" ]; then
  echo "✅ Build concluído com sucesso!"
  ls -lah dist/
else
  echo "❌ Build falhou!"
  exit 1
fi

echo "🎉 Deploy pronto para Hostinger!"
