# 📱 GUIA COMPLETO DE CONFIGURAÇÃO TWILIO + WHATSAPP

**Data:** 04 de Abril de 2026  
**Status:** ✅ Pronto para Implementação Independente

---

## 🎯 OBJETIVO

Configurar sistema de alertas via WhatsApp para notificações em tempo real sobre:
- ✅ Indisponibilidade do site
- ✅ Performance degradada
- ✅ Erros críticos
- ✅ Banco de dados indisponível
- ✅ Certificado SSL próximo do vencimento

---

## 📋 PASSO 1: CRIAR CONTA TWILIO

### 1.1 Acessar Twilio
1. Abra navegador: https://www.twilio.com
2. Clique em **"Sign Up"** (canto superior direito)
3. Preencha formulário:
   - Email
   - Senha
   - Nome completo
   - País: Brasil
   - Telefone: +55 11 9999-9999

### 1.2 Verificar Email
1. Acesse seu email
2. Clique no link de verificação do Twilio
3. Confirme sua conta

### 1.3 Verificar Telefone
1. Twilio enviará código SMS para seu telefone
2. Digite o código na tela
3. Confirme

### 1.4 Responder Questões
Twilio fará perguntas sobre seu uso:
- **Caso de uso:** Alertas e Notificações
- **Linguagem:** JavaScript/Node.js
- **Produtos:** WhatsApp

---

## 🔑 PASSO 2: OBTER CREDENCIAIS

### 2.1 Acessar Console Twilio
1. Após login, você estará no **Twilio Console**
2. URL: https://www.twilio.com/console

### 2.2 Encontrar Account SID
1. No painel esquerdo, clique em **"Account"**
2. Você verá **"Account SID"** em destaque
3. **Copie e guarde em local seguro**

Exemplo:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Encontrar Auth Token
1. Ainda em **"Account"**, procure por **"Auth Token"**
2. Clique em ícone de olho para revelar
3. **Copie e guarde em local seguro**

Exemplo:
```
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE:** Nunca compartilhe estas credenciais!

---

## 📞 PASSO 3: CONFIGURAR NÚMERO WHATSAPP

### 3.1 Acessar Phone Numbers
1. No painel esquerdo, clique em **"Phone Numbers"**
2. Clique em **"Manage Numbers"**

### 3.2 Obter Número Twilio
1. Clique em **"Get a Number"**
2. Selecione país: **Brasil**
3. Procure por números com suporte a **WhatsApp**
4. Clique em **"Buy"** para o número desejado

Exemplo de número:
```
+55 11 99999-9999
```

### 3.3 Formatar para WhatsApp
Para usar com WhatsApp, formate como:
```
whatsapp:+5511999999999
```

---

## 🔗 PASSO 4: ATIVAR WHATSAPP

### 4.1 Acessar WhatsApp Sandbox
1. No painel esquerdo, vá para **"Messaging"**
2. Clique em **"Services"**
3. Clique em **"Create Service"**
4. Nome: `plantayraiz-alerts`
5. Clique em **"Create"**

### 4.2 Configurar WhatsApp
1. Na página do serviço, vá para **"Integration"**
2. Clique em **"WhatsApp"**
3. Clique em **"Connect WhatsApp Business Account"**

### 4.3 Usar WhatsApp Sandbox (Teste)
Se não tiver conta WhatsApp Business:
1. Use **WhatsApp Sandbox** do Twilio
2. Acesse: https://www.twilio.com/console/sms/whatsapp/learn
3. Siga as instruções para conectar seu WhatsApp pessoal ao sandbox

**Número Sandbox Twilio:**
```
whatsapp:+14155238886
```

---

## 📱 PASSO 5: CONECTAR SEU WHATSAPP

### 5.1 Enviar Mensagem de Teste
1. Abra WhatsApp em seu telefone
2. Envie mensagem para o número Twilio
3. Mensagem: `join [código]`

Exemplo:
```
join forest-pilot
```

### 5.2 Confirmar Conexão
1. Você receberá confirmação do Twilio
2. Agora seu WhatsApp está conectado ao sandbox

---

## 🧪 PASSO 6: TESTAR INTEGRAÇÃO

### 6.1 Usar Twilio Console para Teste
1. Vá para **"Messaging"** → **"Services"**
2. Selecione seu serviço
3. Clique em **"Send a Message"**
4. Preencha:
   - **From:** `whatsapp:+14155238886`
   - **To:** `whatsapp:+5511999999999` (seu número)
   - **Body:** Teste de mensagem
5. Clique em **"Send"**

### 6.2 Verificar Recebimento
1. Verifique seu WhatsApp
2. Você deve receber a mensagem de teste

---

## 💻 PASSO 7: CONFIGURAR CREDENCIAIS NO SERVIDOR

### 7.1 Criar Arquivo .env
```bash
# Criar arquivo
nano /tmp/consultorio-audit/.env

# Adicionar conteúdo:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
OWNER_WHATSAPP=whatsapp:+5511999999999
```

### 7.2 Carregar Variáveis
```bash
# Adicionar ao ~/.bashrc
export $(cat /tmp/consultorio-audit/.env | xargs)

# Aplicar mudanças
source ~/.bashrc
```

### 7.3 Verificar Variáveis
```bash
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_WHATSAPP_FROM
echo $OWNER_WHATSAPP
```

---

## 🚀 PASSO 8: INSTALAR E TESTAR SCRIPTS

### 8.1 Instalar Dependências

**Para Node.js:**
```bash
cd /tmp/consultorio-audit
npm install twilio axios
```

**Para Bash:**
```bash
# Verificar se curl, openssl, bc estão instalados
which curl openssl bc
```

### 8.2 Testar Script Bash
```bash
# Teste rápido
./monitoring-whatsapp.sh quick

# Enviar alerta de teste
./monitoring-whatsapp.sh test

# Monitoramento contínuo
./monitoring-whatsapp.sh monitor
```

### 8.3 Testar Script Node.js
```bash
# Executar
node whatsapp-alerts.js

# Ou importar em aplicação
const alerts = require('./whatsapp-alerts.js');
alerts.startMonitoring();
```

---

## 📊 PASSO 9: VALIDAR FLUXO COMPLETO

### 9.1 Checklist de Verificação

- [ ] Conta Twilio criada
- [ ] Account SID obtido
- [ ] Auth Token obtido
- [ ] Número WhatsApp configurado
- [ ] WhatsApp Sandbox conectado
- [ ] Teste de mensagem enviado com sucesso
- [ ] Credenciais configuradas no servidor
- [ ] Dependências instaladas
- [ ] Script bash testado
- [ ] Script Node.js testado
- [ ] Alertas recebidos no WhatsApp

### 9.2 Teste de Fluxo Completo

**Teste 1: Disponibilidade**
```bash
./monitoring-whatsapp.sh quick
# Esperado: ✅ Site disponível
```

**Teste 2: Alerta de Teste**
```bash
./monitoring-whatsapp.sh test
# Esperado: 📱 Mensagem recebida no WhatsApp
```

**Teste 3: Monitoramento Contínuo**
```bash
./monitoring-whatsapp.sh monitor
# Esperado: 🔄 Verificações a cada 5 minutos
```

---

## 📈 PASSO 10: CONFIGURAR MONITORAMENTO AUTOMÁTICO

### 10.1 Adicionar ao Crontab
```bash
crontab -e

# Adicionar:
@reboot /tmp/consultorio-audit/monitoring-whatsapp.sh monitor &
```

### 10.2 Ou Usar Systemd
```bash
# Criar arquivo
sudo nano /etc/systemd/system/whatsapp-alerts.service

# Adicionar conteúdo:
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

# Ativar
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-alerts
sudo systemctl start whatsapp-alerts
```

---

## 🔍 PASSO 11: MONITORAR LOGS

### 11.1 Visualizar Logs em Tempo Real
```bash
# Monitoramento
tail -f /tmp/whatsapp-alerts/monitoring.log

# Apenas alertas
tail -f /tmp/whatsapp-alerts/alerts.log
```

### 11.2 Analisar Alertas
```bash
# Alertas de hoje
grep "$(date +%Y-%m-%d)" /tmp/whatsapp-alerts/alerts.log

# Últimos 20 alertas
tail -20 /tmp/whatsapp-alerts/alerts.log
```

---

## 📋 FLUXO DE FUNCIONAMENTO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                   SISTEMA DE ALERTAS WHATSAPP               │
└─────────────────────────────────────────────────────────────┘

1. MONITORAMENTO CONTÍNUO
   ↓
   ./monitoring-whatsapp.sh monitor
   ↓
   Verificações a cada 5 minutos:
   • Disponibilidade (HTTP 200?)
   • Tempo de resposta (< 3s?)
   • API Health (/api/health)
   • Certificado SSL (< 30 dias?)

2. DETECÇÃO DE PROBLEMA
   ↓
   Se alguma verificação falhar:
   • Log de erro em /tmp/whatsapp-alerts/monitoring.log
   • Verificar cooldown (10 minutos)
   • Preparar mensagem de alerta

3. ENVIO DE ALERTA
   ↓
   send_whatsapp_alert()
   ↓
   Twilio API
   ↓
   WhatsApp Business API
   ↓
   Seu telefone

4. RECEBIMENTO
   ↓
   📱 Notificação no WhatsApp
   ↓
   Ler mensagem de alerta
   ↓
   Tomar ação corretiva

5. RECUPERAÇÃO
   ↓
   Próxima verificação detecta recuperação
   ↓
   Enviar notificação de sucesso
   ↓
   ✅ Problema resolvido
```

---

## 🎯 TIPOS DE ALERTAS E FLUXO

### Alerta 1: Site Indisponível
```
Check → HTTP ≠ 200 → Alert → WhatsApp → Ação
```

### Alerta 2: Performance Lenta
```
Check → Response > 3s → Alert → WhatsApp → Ação
```

### Alerta 3: Banco Indisponível
```
Check → API Health Error → Alert → WhatsApp → Ação
```

### Alerta 4: SSL Próximo Vencimento
```
Check → Days < 30 → Alert → WhatsApp → Ação
```

---

## 🔐 SEGURANÇA

### Recomendações
1. ✅ Nunca commitar `.env` no Git
2. ✅ Usar variáveis de ambiente
3. ✅ Limitar permissões de arquivos
4. ✅ Rotacionar tokens regularmente
5. ✅ Monitorar logs de acesso

### Arquivo .gitignore
```bash
echo ".env" >> /tmp/consultorio-audit/.gitignore
echo ".env.local" >> /tmp/consultorio-audit/.gitignore
```

---

## 📞 SUPORTE

### Twilio
- **Website:** https://www.twilio.com
- **Documentação:** https://www.twilio.com/docs
- **WhatsApp API:** https://www.twilio.com/whatsapp
- **Suporte:** https://support.twilio.com

### Plantayraiz
- **Logs:** `/tmp/whatsapp-alerts/`
- **Scripts:** `/tmp/consultorio-audit/`
- **Documentação:** `WHATSAPP_ALERTS_SETUP.md`

---

## ✅ CHECKLIST FINAL

- [ ] Conta Twilio criada
- [ ] Credenciais obtidas
- [ ] WhatsApp configurado
- [ ] Teste de mensagem bem-sucedido
- [ ] Scripts instalados
- [ ] Teste de alerta bem-sucedido
- [ ] Monitoramento iniciado
- [ ] Logs verificados
- [ ] Cron job configurado
- [ ] Documentação atualizada

---

**Documento Gerado:** 04 de Abril de 2026  
**Status:** ✅ Pronto para Configuração Independente  
**Tempo Estimado:** 30-45 minutos
