# 🤖 CONFIGURAÇÃO DE AUTOMAÇÃO - PLANTAYRAIZ.COM.BR

**Data:** 04 de Abril de 2026  
**Status:** ✅ Pronto para Configuração

---

## 📋 SCRIPTS DE AUTOMAÇÃO CRIADOS

### 1. Deploy Automático para Produção
**Arquivo:** `deploy-production.sh`  
**Função:** Automatizar deploy para o Hostinger  
**Uso:**
```bash
./deploy-production.sh
```

**Fases:**
- ✅ Validação pré-deploy
- ✅ Criar backup
- ✅ Build final
- ✅ Testes pré-deploy
- ✅ Push para GitHub
- ✅ Webhook do Hostinger

---

### 2. Monitoramento 24/7 de Performance
**Arquivo:** `monitoring-24h.sh`  
**Função:** Monitorar performance contínuamente  
**Uso:**
```bash
# Monitorar por 24 horas
./monitoring-24h.sh 24h

# Monitorar continuamente (daemon)
./monitoring-24h.sh daemon

# Verificações rápidas
./monitoring-24h.sh quick
```

**Verificações:**
- ✅ Disponibilidade do site (HTTP status)
- ✅ Tempo de resposta (< 3s)
- ✅ Certificado SSL
- ✅ Recursos críticos
- ✅ Banco de dados

**Threshold:** 3000ms (3 segundos)

---

### 3. Backup Automático Diário
**Arquivo:** `backup-daily.sh`  
**Função:** Fazer backup completo do site  
**Uso:**
```bash
./backup-daily.sh
```

**Backup de:**
- ✅ Código-fonte (excluindo node_modules)
- ✅ Banco de dados
- ✅ Assets e imagens
- ✅ Configurações
- ✅ Histórico Git

**Retenção:** 30 dias  
**Localização:** `/home/ubuntu/backups/`

---

## 🔄 CONFIGURAÇÃO DE CRON JOBS

### Opção 1: Usando Crontab (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Adicionar as seguintes linhas:

# Backup Automático Diário (02:00 AM)
0 2 * * * /tmp/consultorio-audit/backup-daily.sh >> /tmp/backups/cron_backup.log 2>&1

# Monitoramento de Performance (A cada 5 minutos)
*/5 * * * * /tmp/consultorio-audit/monitoring-24h.sh quick >> /tmp/monitoring/cron_monitoring.log 2>&1

# Verificação de Saúde (A cada hora)
0 * * * * curl -s https://plantayraiz.com.br/api/health >> /tmp/monitoring/health_check.log 2>&1

# Limpeza de Logs Antigos (Semanalmente - Domingo 03:00 AM)
0 3 * * 0 find /tmp/monitoring -name '*.log' -mtime +7 -delete && find /tmp/backups -name '*.log' -mtime +7 -delete

# Sincronização com GitHub (01:00 AM)
0 1 * * * cd /tmp/consultorio-audit && git pull origin main >> /tmp/monitoring/git_sync.log 2>&1
```

### Opção 2: Usando GitHub Actions (Recomendado)

Criar arquivo `.github/workflows/automation.yml`:

```yaml
name: Automação Plantayraiz

on:
  schedule:
    # Backup diário às 02:00 AM
    - cron: '0 2 * * *'
    # Monitoramento a cada 5 minutos
    - cron: '*/5 * * * *'
    # Verificação de saúde a cada hora
    - cron: '0 * * * *'

jobs:
  backup:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *'
    steps:
      - uses: actions/checkout@v3
      - name: Executar Backup
        run: ./backup-daily.sh

  monitoring:
    runs-on: ubuntu-latest
    if: github.event.schedule == '*/5 * * * *'
    steps:
      - uses: actions/checkout@v3
      - name: Executar Monitoramento
        run: ./monitoring-24h.sh quick

  health-check:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Verificar Saúde
        run: curl -s https://plantayraiz.com.br/api/health
```

### Opção 3: Usando Hostinger Cron Jobs

1. Acesse o painel do Hostinger
2. Vá para **Cron Jobs**
3. Adicione os seguintes comandos:

```
# Backup diário
0 2 * * * /home/ubuntu/scripts/backup-daily.sh

# Monitoramento
*/5 * * * * /home/ubuntu/scripts/monitoring-24h.sh quick

# Verificação de saúde
0 * * * * curl -s https://plantayraiz.com.br/api/health
```

---

## 📊 CRONOGRAMA DE TAREFAS AUTOMÁTICAS

| Hora | Tarefa | Frequência |
|------|--------|-----------|
| 01:00 AM | Sincronização com GitHub | Diariamente |
| 02:00 AM | Backup Automático | Diariamente |
| 03:00 AM | Limpeza de Logs | Semanalmente (Domingo) |
| A cada 5 min | Monitoramento de Performance | Contínuo |
| A cada hora | Verificação de Saúde | Contínuo |

---

## 📁 LOCALIZAÇÃO DOS LOGS

```
/tmp/monitoring/
  ├── monitoring_[timestamp].log
  ├── alerts_[timestamp].log
  ├── cron_monitoring.log
  ├── health_check.log
  └── git_sync.log

/tmp/backups/
  ├── code/
  │   └── backup_code_[timestamp].tar.gz
  ├── database/
  │   └── backup_db_[timestamp].sql
  ├── assets/
  │   └── backup_assets_[timestamp].tar.gz
  ├── git/
  │   └── backup_git_[timestamp].tar.gz
  └── cron_backup.log
```

---

## 🔍 MONITORAMENTO DE ALERTAS

### Alertas Automáticos Acionados Quando:

1. **Site Indisponível**
   - HTTP status ≠ 200
   - Ação: Notificação imediata

2. **Tempo de Resposta Lento**
   - Tempo > 3000ms
   - Ação: Alerta de performance

3. **Certificado SSL Próximo do Vencimento**
   - Menos de 30 dias
   - Ação: Notificação de renovação

4. **Recurso Crítico Indisponível**
   - index.html, assets, favicon
   - Ação: Alerta crítico

5. **Banco de Dados Indisponível**
   - /api/health retorna erro
   - Ação: Alerta crítico

---

## 🔐 SEGURANÇA DE BACKUPS

### Recomendações:

1. **Copiar para Armazenamento Externo**
   ```bash
   # AWS S3
   aws s3 sync /tmp/backups s3://plantayraiz-backups/

   # Google Drive
   rclone sync /tmp/backups gdrive:plantayraiz-backups/

   # Dropbox
   rclone sync /tmp/backups dropbox:plantayraiz-backups/
   ```

2. **Criptografar Backups**
   ```bash
   gpg --symmetric backup_code_*.tar.gz
   ```

3. **Verificar Integridade**
   ```bash
   tar -tzf backup_code_*.tar.gz > /dev/null
   ```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Copiar scripts para `/home/ubuntu/scripts/`
- [ ] Tornar scripts executáveis: `chmod +x *.sh`
- [ ] Configurar cron jobs (opção 1, 2 ou 3)
- [ ] Criar diretórios de logs: `mkdir -p /tmp/monitoring /tmp/backups`
- [ ] Testar cada script manualmente
- [ ] Verificar logs após primeira execução
- [ ] Configurar alertas (email, WhatsApp, Slack)
- [ ] Documentar procedimentos de recuperação

---

## 🚀 PRÓXIMOS PASSOS

1. **Imediato:** Executar primeiro backup
   ```bash
   ./backup-daily.sh
   ```

2. **Curto Prazo:** Configurar cron jobs
   ```bash
   crontab -e
   ```

3. **Médio Prazo:** Integrar com alertas
   - Email
   - WhatsApp
   - Slack

4. **Longo Prazo:** Implementar observabilidade avançada
   - Prometheus
   - Grafana
   - ELK Stack

---

## 📞 SUPORTE

Para dúvidas ou problemas:
1. Verificar logs em `/tmp/monitoring/` e `/tmp/backups/`
2. Consultar documentação dos scripts
3. Testar manualmente cada script

---

**Documento Gerado:** 04 de Abril de 2026  
**Status:** ✅ Pronto para Implementação
