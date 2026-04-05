# 📱 SISTEMA DE ALERTAS VIA WHATSAPP

**Data:** 04 de Abril de 2026  
**Status:** ✅ Pronto para Configuração

---

## 📋 RESUMO

Sistema completo de notificações em tempo real via WhatsApp para alertá-lo sobre:
- ✅ Indisponibilidade do site
- ✅ Performance degradada
- ✅ Erros críticos
- ✅ Banco de dados indisponível
- ✅ Certificado SSL próximo do vencimento

---

## 🚀 ARQUIVOS CRIADOS

### 1. `whatsapp-alerts.js` (Node.js)
**Descrição:** Serviço de monitoramento com notificações WhatsApp usando Twilio  
**Linguagem:** JavaScript/Node.js  
**Dependências:** `twilio`, `axios`

### 2. `monitoring-whatsapp.sh` (Bash)
**Descrição:** Script bash para monitoramento com alertas WhatsApp  
**Linguagem:** Bash  
**Dependências:** `curl`, `openssl`, `bc`

---

## 🔧 CONFIGURAÇÃO INICIAL

### Passo 1: Obter Credenciais Twilio

1. Acesse [twilio.com](https://www.twilio.com)
2. Crie uma conta (gratuita ou paga)
3. Vá para **Console** → **Account**
4. Copie:
   - **Account SID**
   - **Auth Token**
5. Vá para **Phone Numbers** → **Manage Numbers**
6. Obtenha um número WhatsApp (ex: `+14155238886`)

### Passo 2: Configurar Variáveis de Ambiente

```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
export TWILIO_ACCOUNT_SID="your_account_sid"
export TWILIO_AUTH_TOKEN="your_auth_token"
export TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
export OWNER_WHATSAPP="whatsapp:+5511999999999"  # Seu número

# Aplicar mudanças
source ~/.bashrc
```

### Passo 3: Instalar Dependências

**Para Node.js:**
```bash
npm install twilio axios
```

**Para Bash:**
```bash
# Verificar se curl, openssl e bc estão instalados
curl --version
openssl version
bc --version
```

---

## 📱 TIPOS DE ALERTAS

### 1. 🚨 Indisponibilidade do Site
**Trigger:** HTTP status ≠ 200  
**Cooldown:** 10 minutos  
**Mensagem:**
```
🚨 ALERTA CRÍTICO - Plantayraiz.com.br INDISPONÍVEL

❌ Status HTTP: [status]
⏰ Horário: [timestamp]
🌐 URL: https://plantayraiz.com.br
```

### 2. ⚠️ Performance Degradada
**Trigger:** Tempo de resposta > 3000ms  
**Cooldown:** 10 minutos  
**Mensagem:**
```
⚠️ ALERTA - Performance Degradada

🐌 Tempo de resposta: [ms]ms
⏰ Horário: [timestamp]
📊 Limite: 3000ms
```

### 3. 💾 Banco de Dados Indisponível
**Trigger:** /api/health retorna erro  
**Cooldown:** 10 minutos  
**Mensagem:**
```
💾 ALERTA CRÍTICO - Banco de Dados Indisponível

❌ Status: Sem conexão
⏰ Horário: [timestamp]
```

### 4. 🔐 SSL Próximo do Vencimento
**Trigger:** Menos de 30 dias para vencer  
**Cooldown:** 24 horas  
**Mensagem:**
```
🔐 AVISO - Certificado SSL Próximo do Vencimento

📅 Dias restantes: [days]
⏰ Horário: [timestamp]
```

### 5. ✅ Recuperação
**Trigger:** Serviço volta ao normal  
**Mensagem:**
```
✅ RECUPERAÇÃO - [Serviço] Restaurado

🟢 Status: Online
⏰ Horário: [timestamp]
```

---

## 🎯 COMO USAR

### Opção 1: Node.js

```bash
# Instalar dependências
npm install twilio axios

# Executar monitoramento
node whatsapp-alerts.js

# Ou importar como módulo
const alerts = require('./whatsapp-alerts.js');
alerts.startMonitoring();
```

### Opção 2: Bash

```bash
# Tornar executável
chmod +x monitoring-whatsapp.sh

# Monitoramento contínuo
./monitoring-whatsapp.sh monitor

# Teste rápido
./monitoring-whatsapp.sh quick

# Enviar teste de alerta
./monitoring-whatsapp.sh test
```

---

## 🔄 INTEGRAÇÃO COM CRON

### Adicionar ao Crontab

```bash
crontab -e

# Adicionar as seguintes linhas:

# Iniciar monitoramento com alertas (ao reiniciar o servidor)
@reboot /tmp/consultorio-audit/monitoring-whatsapp.sh monitor &

# Ou executar como daemon
0 * * * * pgrep -f "monitoring-whatsapp.sh monitor" || /tmp/consultorio-audit/monitoring-whatsapp.sh monitor &
```

### Ou usar Systemd

Criar arquivo `/etc/systemd/system/whatsapp-alerts.service`:

```ini
[Unit]
Description=WhatsApp Alerts for Plantayraiz
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/tmp/consultorio-audit/monitoring-whatsapp.sh monitor
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ativar serviço:
```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-alerts
sudo systemctl start whatsapp-alerts
```

---

## 📊 LOGS E HISTÓRICO

### Localização dos Logs

```
/tmp/whatsapp-alerts/
├── monitoring.log          # Todas as verificações
├── alerts.log              # Apenas alertas
└── .last_alert_*           # Rastreamento de cooldown
```

### Visualizar Logs

```bash
# Monitoramento em tempo real
tail -f /tmp/whatsapp-alerts/monitoring.log

# Apenas alertas
tail -f /tmp/whatsapp-alerts/alerts.log

# Alertas de hoje
grep "$(date +%Y-%m-%d)" /tmp/whatsapp-alerts/alerts.log
```

---

## 🧪 TESTE DO SISTEMA

### Teste 1: Verificação Rápida

```bash
./monitoring-whatsapp.sh quick
```

**Esperado:**
- ✅ Site disponível
- ✅ Tempo de resposta OK
- ✅ API saudável
- ✅ Certificado SSL válido

### Teste 2: Enviar Alerta de Teste

```bash
./monitoring-whatsapp.sh test
```

**Esperado:**
- ✅ Mensagem WhatsApp recebida em seu telefone

### Teste 3: Simular Falha

```bash
# Simular site indisponível (em outro terminal)
sudo iptables -A OUTPUT -d plantayraiz.com.br -j DROP

# Executar verificação
./monitoring-whatsapp.sh quick

# Restaurar
sudo iptables -D OUTPUT -d plantayraiz.com.br -j DROP
```

---

## 🔐 SEGURANÇA

### Recomendações

1. **Não commitar credenciais no Git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Usar arquivo `.env` para credenciais**
   ```bash
   # .env
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   ```

3. **Carregar variáveis de ambiente**
   ```bash
   source .env
   ./monitoring-whatsapp.sh monitor
   ```

4. **Limitar acesso aos logs**
   ```bash
   chmod 600 /tmp/whatsapp-alerts/*
   ```

---

## 🚨 TROUBLESHOOTING

### Problema: Mensagens não são enviadas

**Solução:**
1. Verificar credenciais Twilio
2. Verificar número de telefone (formato: `whatsapp:+55...`)
3. Verificar se conta Twilio tem créditos
4. Verificar logs: `tail -f /tmp/whatsapp-alerts/alerts.log`

### Problema: Muitos alertas (spam)

**Solução:**
1. Aumentar `ALERT_COOLDOWN` (padrão: 10 minutos)
2. Aumentar `CHECK_INTERVAL` (padrão: 5 minutos)
3. Aumentar `RESPONSE_THRESHOLD` (padrão: 3000ms)

### Problema: Certificado SSL não é verificado

**Solução:**
1. Verificar se `openssl` está instalado
2. Verificar conectividade com servidor
3. Verificar permissões de arquivo

---

## 📞 CONTATO TWILIO

- **Website:** https://www.twilio.com
- **Documentação:** https://www.twilio.com/docs
- **WhatsApp API:** https://www.twilio.com/whatsapp
- **Suporte:** https://support.twilio.com

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar conta Twilio
- [ ] Obter credenciais (SID, Token, Número)
- [ ] Configurar variáveis de ambiente
- [ ] Instalar dependências
- [ ] Testar verificação rápida
- [ ] Enviar alerta de teste
- [ ] Configurar cron job
- [ ] Verificar logs
- [ ] Documentar procedimentos

---

**Documento Gerado:** 04 de Abril de 2026  
**Status:** ✅ Pronto para Implementação
