#!/bin/bash

# CONFIGURAR GIT HOOKS PARA BACKUP AUTOMÁTICO
# Executa backup automaticamente a cada commit

PROJECT_DIR="/home/ubuntu/planta-e-raiz"
BACKUP_DIR="$PROJECT_DIR/.backup"
GIT_HOOKS_DIR="$PROJECT_DIR/.git/hooks"

echo "🔧 Configurando Git Hooks para backup automático..."

# Criar hook post-commit
cat > "$GIT_HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash

# Executar backup após cada commit
BACKUP_SCRIPT="$(git rev-parse --show-toplevel)/.backup/backup.sh"

if [ -f "$BACKUP_SCRIPT" ]; then
    echo "🔄 Executando backup automático após commit..."
    bash "$BACKUP_SCRIPT" > /dev/null 2>&1 &
fi
EOF

chmod +x "$GIT_HOOKS_DIR/post-commit"
echo "✅ Git hook post-commit configurado"

# Criar hook pre-push
cat > "$GIT_HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

# Executar backup antes de fazer push
BACKUP_SCRIPT="$(git rev-parse --show-toplevel)/.backup/backup.sh"

if [ -f "$BACKUP_SCRIPT" ]; then
    echo "🔄 Executando backup antes de push..."
    bash "$BACKUP_SCRIPT" > /dev/null 2>&1
fi

exit 0
EOF

chmod +x "$GIT_HOOKS_DIR/pre-push"
echo "✅ Git hook pre-push configurado"

echo ""
echo "✅ Git hooks configurados com sucesso!"
echo ""
echo "Agora o backup será executado automaticamente:"
echo "  • Após cada commit (post-commit)"
echo "  • Antes de cada push (pre-push)"
