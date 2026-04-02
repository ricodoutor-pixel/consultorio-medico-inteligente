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
