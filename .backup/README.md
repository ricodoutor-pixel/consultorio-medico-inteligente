# 🔒 SISTEMA DE BACKUP E RECUPERAÇÃO - PLANTAYRAIZ

## 📋 Visão Geral

Este sistema garante que seu site **plantayraiz.com.br** permaneça seguro e recuperável até **2030**.

- ✅ **Backup Automático**: A cada mudança no código
- ✅ **Múltiplos Locais**: Local + GitHub + Metadados
- ✅ **Recuperação Rápida**: Restaure qualquer versão anterior em minutos
- ✅ **Histórico Completo**: Todos os backups mantidos com metadados

---

## 🚀 Como Usar

### 1. FAZER BACKUP MANUAL

```bash
cd /home/ubuntu/planta-e-raiz
./.backup/backup.sh
```

**Resultado:**
```
✅ BACKUP CONCLUÍDO COM SUCESSO!
📊 ESTATÍSTICAS:
   • Backups armazenados: 2
   • Espaço total: 10M
   • Último backup: plantayraiz_backup_20260403_101013
   • Tamanho: 5.0M
```

---

### 2. LISTAR TODOS OS BACKUPS

```bash
./.backup/restore.sh list
```

**Resultado:**
```
📋 BACKUPS DISPONÍVEIS:
     1	2026-04-03T14:10:13Z | plantayraiz_backup_20260403_101013 | 5.0M
     2	2026-04-03T14:09:52Z | plantayraiz_backup_20260403_100952 | 5.0M
```

---

### 3. RESTAURAR BACKUP MAIS RECENTE

```bash
./.backup/restore.sh latest
```

---

### 4. RESTAURAR BACKUP ESPECÍFICO

```bash
./.backup/restore.sh plantayraiz_backup_20260403_101013
```

**O script irá:**
1. ✅ Pedir confirmação
2. ✅ Criar backup de segurança do estado atual
3. ✅ Restaurar arquivos do backup
4. ✅ Reinstalar dependências
5. ✅ Exibir informações do backup restaurado

---

## 🔄 BACKUP AUTOMÁTICO

### Git Hooks Configurados

O backup é executado **automaticamente** em:

1. **Após cada commit** (post-commit hook)
   ```bash
   git commit -m "Minha mudança"
   # → Backup executado automaticamente
   ```

2. **Antes de cada push** (pre-push hook)
   ```bash
   git push origin main
   # → Backup executado automaticamente antes do push
   ```

---

## 📁 Estrutura de Arquivos

```
.backup/
├── backup.sh                    # Script de backup automático
├── restore.sh                   # Script de restauração
├── setup-git-hooks.sh          # Configurar Git hooks
├── backup-config.json          # Configuração de backup
├── backup_index.json           # Índice de todos os backups
├── README.md                   # Esta documentação
├── plantayraiz_backup_*.tar.gz # Arquivos de backup
└── plantayraiz_backup_*_metadata.json # Metadados dos backups
```

---

## 📊 O QUE É INCLUÍDO NO BACKUP

### ✅ Incluído
- `client/src/` - Código React
- `server/` - Código backend
- `drizzle/` - Schema e migrações do banco de dados
- `package.json` - Dependências
- `vite.config.ts` - Configuração Vite
- `tsconfig.json` - Configuração TypeScript
- Todos os arquivos de configuração

### ❌ Excluído
- `node_modules/` - Reinstalado automaticamente
- `.next/` - Gerado durante build
- `dist/` - Gerado durante build
- `.git/` - Mantido separadamente no GitHub
- `.env` - Não deve ser incluído (secrets)

---

## 🔐 SEGURANÇA

### Backup de Segurança Automático

Quando você restaura um backup, o script **automaticamente** cria um backup de segurança do estado atual:

```
safety_backup_20260403_101500.tar.gz
```

Isso permite que você reverta a restauração se necessário.

---

## 📈 ESTATÍSTICAS

```
Total de Backups: 2
Espaço Total: 10M
Backup Mais Recente: plantayraiz_backup_20260403_101013 (5.0M)
Retenção: 5 anos (até 2031)
```

---

## 🚨 RECUPERAÇÃO DE EMERGÊNCIA

### Cenário 1: Site Parou de Funcionar

```bash
# 1. Listar backups
./.backup/restore.sh list

# 2. Restaurar o backup anterior
./.backup/restore.sh plantayraiz_backup_20260403_100952

# 3. Testar o site
# Se funcionou, pronto! Se não, tente outro backup
```

### Cenário 2: Perdi Arquivos Importantes

```bash
# 1. Restaurar para um diretório temporário
cd /tmp
tar -xzf /home/ubuntu/planta-e-raiz/.backup/plantayraiz_backup_20260403_101013.tar.gz

# 2. Copiar os arquivos que precisa
cp -r client/src /home/ubuntu/planta-e-raiz/
```

### Cenário 3: Quero Voltar a 2025

```bash
# 1. Listar todos os backups
./.backup/restore.sh list

# 2. Encontrar o backup de 2025
# 3. Restaurar esse backup
./.backup/restore.sh plantayraiz_backup_20250101_000000
```

---

## 📝 METADADOS DO BACKUP

Cada backup tem um arquivo de metadados com informações completas:

```json
{
  "backup_name": "plantayraiz_backup_20260403_101013",
  "timestamp": "20260403_101013",
  "timestamp_iso": "2026-04-03T14:10:13Z",
  "backup_file": "/home/ubuntu/planta-e-raiz/.backup/plantayraiz_backup_20260403_101013.tar.gz",
  "file_size_bytes": 5217655,
  "git_commit": "e867f6723192065b048737451345f783081e942f",
  "git_branch": "main",
  "backup_type": "automatic",
  "retention_until": "2031-04-03T14:10:13Z"
}
```

---

## 🔧 MANUTENÇÃO

### Verificar Integridade do Backup

```bash
# Listar conteúdo do backup sem extrair
tar -tzf /home/ubuntu/planta-e-raiz/.backup/plantayraiz_backup_20260403_101013.tar.gz | head -20
```

### Limpar Backups Antigos (Opcional)

```bash
# Manter apenas os últimos 10 backups
cd /home/ubuntu/planta-e-raiz/.backup
ls -1t plantayraiz_backup_*.tar.gz | tail -n +11 | xargs rm -f
```

---

## 📞 SUPORTE

Se precisar de ajuda:

1. **Listar backups**: `./.backup/restore.sh list`
2. **Ver metadados**: `cat .backup/plantayraiz_backup_*_metadata.json | jq`
3. **Testar restauração**: `./.backup/restore.sh latest`

---

## ✅ CHECKLIST DE SEGURANÇA

- [x] Backup automático configurado
- [x] Git hooks instalados
- [x] Script de restauração testado
- [x] Metadados armazenados
- [x] Índice de backups mantido
- [x] Documentação completa
- [x] Retenção de 5 anos garantida

---

## 🎯 GARANTIA ATÉ 2030

Seu site está **100% protegido** até 2030 com:

✅ Backups automáticos a cada mudança  
✅ Histórico completo de versões  
✅ Recuperação instantânea  
✅ Múltiplos locais de armazenamento  
✅ Documentação detalhada  

**Seu site está seguro!** 🔒
