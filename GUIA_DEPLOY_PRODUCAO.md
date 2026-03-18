# 🚀 GUIA COMPLETO DE DEPLOY E TESTES - PLANTA & RAIZ 2026-2030

## 📋 ÍNDICE
1. [Configuração de Credenciais](#configuração-de-credenciais)
2. [Testes de Integração](#testes-de-integração)
3. [Sistema de Assinatura Digital](#sistema-de-assinatura-digital)
4. [Simulação de Consulta em Tempo Real](#simulação-de-consulta-em-tempo-real)
5. [Deploy em Produção](#deploy-em-produção)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 CONFIGURAÇÃO DE CREDENCIAIS

### 1. Mercado Pago

**Passo 1: Criar Conta**
- Acesse: https://www.mercadopago.com.br/developers/panel
- Faça login ou crie uma conta
- Vá para "Aplicações" → "Criar aplicação"

**Passo 2: Obter Credenciais**
- Public Key: `APP_USR-xxxxxxxxxxxxxxxx`
- Access Token: `APP_USR-xxxxxxxxxxxxxxxx`

**Passo 3: Configurar no .env**
```bash
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx
```

**Passo 4: Testar Conexão**
```bash
npm run test:mercado-pago
```

---

### 2. Twilio

**Passo 1: Criar Conta**
- Acesse: https://console.twilio.com/
- Faça login ou crie uma conta
- Vá para "Account" → "API Keys & tokens"

**Passo 2: Obter Credenciais**
- Account SID: `ACxxxxxxxxxxxxxxxx`
- Auth Token: `xxxxxxxxxxxxxxxx`

**Passo 3: Configurar Número WhatsApp**
- Vá para "Messaging" → "Try it out" → "Send a WhatsApp message"
- Obtenha seu número WhatsApp de teste
- Exemplo: `+5511987131241`

**Passo 4: Configurar no .env**
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+5511987131241
TWILIO_SMS_NUMBER=+5511987131241
```

**Passo 5: Testar Conexão**
```bash
npm run test:twilio
```

---

### 3. Google Maps

**Passo 1: Criar Projeto**
- Acesse: https://console.cloud.google.com/
- Crie um novo projeto
- Ative as APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API

**Passo 2: Criar Chave de API**
- Vá para "Credenciais" → "Criar credencial" → "Chave de API"
- Copie a chave gerada

**Passo 3: Configurar no .env**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxx
```

**Passo 4: Testar Conexão**
```bash
npm run test:google-maps
```

---

### 4. Clicksign (Assinatura Digital)

**Passo 1: Criar Conta**
- Acesse: https://app.clicksign.com/
- Faça login ou crie uma conta
- Vá para "Configurações" → "Integrações" → "API"

**Passo 2: Obter Chave de API**
- Copie a chave de API gerada

**Passo 3: Configurar no .env**
```bash
CLICKSIGN_API_KEY=xxxxxxxxxxxxxxxx
CLICKSIGN_SANDBOX_MODE=true  # Usar true para testes
```

**Passo 4: Testar Conexão**
```bash
npm run test:clicksign
```

---

## ✅ TESTES DE INTEGRAÇÃO

### 1. Teste de Pagamento (Mercado Pago)

**Arquivo:** `tests/integration/mercado-pago.test.ts`

```typescript
import { createPayment, getPaymentStatus } from '@/services/mercado-pago';

describe('Mercado Pago Integration', () => {
  it('should create a payment', async () => {
    const payment = await createPayment({
      planId: 'plan-vip',
      userId: 'user-123',
      amount: 99.00,
      currency: 'BRL',
      description: 'Plano Médico VIP',
      email: 'test@example.com',
      phone: '+5511987131241'
    });

    expect(payment.success).toBe(true);
    expect(payment.paymentId).toBeDefined();
    expect(payment.redirectUrl).toBeDefined();
  });

  it('should get payment status', async () => {
    const status = await getPaymentStatus('payment-123');
    expect(status.success).toBe(true);
    expect(status.status).toBeDefined();
  });
});
```

**Executar Teste:**
```bash
npm run test:mercado-pago
```

---

### 2. Teste de Verificação (Twilio)

**Arquivo:** `tests/integration/twilio.test.ts`

```typescript
import { 
  sendVerificationCode, 
  verifyCode 
} from '@/services/twilio-integration';

describe('Twilio Integration', () => {
  it('should send verification code', async () => {
    const result = await sendVerificationCode({
      phoneNumber: '+5511987131241',
      userId: 'user-123'
    });

    expect(result.success).toBe(true);
    expect(result.verificationSid).toBeDefined();
  });

  it('should verify code', async () => {
    const result = await verifyCode({
      phoneNumber: '+5511987131241',
      code: '123456',
      verificationSid: 'verification-123'
    });

    expect(result.success).toBe(true);
  });
});
```

**Executar Teste:**
```bash
npm run test:twilio
```

---

### 3. Teste de Vídeo Consulta (Jitsi)

**Arquivo:** `tests/integration/jitsi.test.ts`

```typescript
import { createConsultationRoom } from '@/services/jitsi-integration';

describe('Jitsi Integration', () => {
  it('should create consultation room', async () => {
    const consultation = await createConsultationRoom({
      consultationId: 'consult-123',
      doctorId: 'doctor-1',
      patientId: 'patient-1',
      doctorName: 'Dr. Edilson Bezerra',
      patientName: 'João Silva',
      doctorEmail: 'doctor@example.com',
      patientEmail: 'patient@example.com',
      startTime: new Date().toISOString(),
      duration: 30,
      specialty: 'Cannabis Medicinal',
      reason: 'Consulta inicial'
    });

    expect(consultation.success).toBe(true);
    expect(consultation.roomUrl).toBeDefined();
    expect(consultation.doctorJoinUrl).toBeDefined();
    expect(consultation.patientJoinUrl).toBeDefined();
  });
});
```

**Executar Teste:**
```bash
npm run test:jitsi
```

---

## 🔏 SISTEMA DE ASSINATURA DIGITAL

### Integração Clicksign

**Arquivo:** `src/services/clicksign-integration.ts`

```typescript
import axios from 'axios';

interface DocumentData {
  name: string;
  content: string;
  signers: Array<{
    name: string;
    email: string;
    phone: string;
  }>;
}

export async function createDocument(data: DocumentData) {
  const apiKey = process.env.CLICKSIGN_API_KEY;
  
  try {
    const response = await axios.post(
      'https://app.clicksign.com/api/v1/documents',
      {
        document: {
          original_file_name: data.name,
          file: Buffer.from(data.content).toString('base64')
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const documentId = response.data.document.uuid;

    // Adicionar signatários
    for (const signer of data.signers) {
      await axios.post(
        `https://app.clicksign.com/api/v1/documents/${documentId}/signers`,
        {
          signer: {
            name: signer.name,
            email: signer.email,
            phone_number: signer.phone
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Enviar para assinatura
    await axios.post(
      `https://app.clicksign.com/api/v1/documents/${documentId}/send`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      documentId,
      message: 'Documento enviado para assinatura'
    };
  } catch (error) {
    console.error('[Clicksign] Error:', error);
    return {
      success: false,
      message: 'Falha ao criar documento'
    };
  }
}
```

**Usar Assinatura Digital:**
```typescript
import { createDocument } from '@/services/clicksign-integration';

const result = await createDocument({
  name: 'Termo_de_Consentimento.pdf',
  content: pdfContent,
  signers: [
    {
      name: 'Dr. Edilson Bezerra',
      email: 'doctor@example.com',
      phone: '+5511987131241'
    },
    {
      name: 'João Silva',
      email: 'patient@example.com',
      phone: '+5511987654321'
    }
  ]
});
```

---

## 🎬 SIMULAÇÃO DE CONSULTA EM TEMPO REAL

### Fluxo Completo: Paciente → Dr. Edilson Bezerra

**Passo 1: Paciente Cria Conta**
```bash
# Acessar: https://plantayraiz.com.br
# Clicar em "Criar Conta"
# Preencher dados:
# - Nome: João Silva
# - Email: joao@example.com
# - Telefone: +5511987654321
# - Especialidade: Cannabis Medicinal
```

**Passo 2: Verificação de E-mail e WhatsApp**
```bash
# Receber código no WhatsApp
# Inserir código na plataforma
# Confirmar verificação
```

**Passo 3: Escolher Plano**
```bash
# Acessar: https://plantayraiz.com.br/plans
# Escolher: "Médico VIP" (R$ 99/mês)
# Clicar em "Assinar Agora"
```

**Passo 4: Pagamento**
```bash
# Redirecionar para Mercado Pago
# Usar cartão de teste: 4111 1111 1111 1111
# Data: 12/25
# CVV: 123
# Confirmar pagamento
```

**Passo 5: Agendar Consulta**
```bash
# Acessar: https://plantayraiz.com.br/dashboard/consultations
# Clicar em "Agendar Consulta"
# Selecionar Dr. Edilson Bezerra
# Escolher data/hora
# Confirmar agendamento
```

**Passo 6: Assinatura Digital**
```bash
# Receber e-mail com termo de consentimento
# Clicar no link do Clicksign
# Assinar digitalmente
# Confirmar assinatura
```

**Passo 7: Entrar na Consulta**
```bash
# Acessar: https://plantayraiz.com.br/dashboard/consultations
# Clicar em "Entrar na Consulta"
# Jitsi Meet abre automaticamente
# Ativar câmera e microfone
# Aguardar Dr. Edilson Bezerra
```

**Passo 8: Consulta em Tempo Real**
```bash
# Dr. Edilson Bezerra entra na sala
# Conversa de vídeo em tempo real
# Gravação automática da consulta
# Duração: 30 minutos
```

**Passo 9: Pós-Consulta**
```bash
# Encerrar consulta
# Receber link para download da gravação
# Receber receita digital (se aplicável)
# Agendar Smart-Refill (se medicamento prescrito)
```

**Passo 10: Follow-up Automático**
```bash
# D+7: Receber mensagem WhatsApp perguntando como está
# D+30: Receber mensagem WhatsApp com avaliação de 30 dias
# D-5 (Smart-Refill): Receber lembrete para renovar medicamento
```

---

## 🚀 DEPLOY EM PRODUÇÃO

### 1. Build

```bash
# Instalar dependências
npm install

# Build do projeto
npm run build

# Verificar build
ls -la dist/
```

### 2. Deploy (Opções)

#### Opção A: Vercel
```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

#### Opção B: Railway
```bash
npm install -g railway
railway login
railway up
```

#### Opção C: Render
```bash
# Conectar repositório GitHub
# Configurar variáveis de ambiente
# Deploy automático
```

#### Opção D: Docker
```bash
docker build -t plantayraiz:latest .
docker run -p 3000:3000 plantayraiz:latest
```

### 3. Configurar Domínio

```bash
# Apontar DNS para:
# plantayraiz.com.br → seu-app.vercel.app
# ou
# plantayraiz.com.br → seu-app.railway.app
```

---

## 📊 MONITORAMENTO

### 1. Prometheus + Grafana

**Iniciar Stack de Monitoramento:**
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

**Acessar:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### 2. Dashboards Grafana

**Importar Dashboards:**
1. Acessar Grafana
2. Clicar em "+" → "Import"
3. Usar IDs:
   - 1860: Node Exporter
   - 3662: Prometheus
   - 6417: Docker

### 3. Alertas

**Configurar Alertas:**
1. Acessar Prometheus
2. Ir para "Alerts"
3. Verificar regras em `alerts.yml`

**Alertas Configurados:**
- CPU > 80%
- Memória > 85%
- Taxa de erro > 1%
- Latência P95 > 500ms
- Downtime > 5 minutos

---

## 🐛 TROUBLESHOOTING

### Erro: "Mercado Pago API Key inválida"
```bash
# Verificar .env
cat .env | grep MERCADO_PAGO

# Testar conexão
curl -H "Authorization: Bearer $MERCADO_PAGO_ACCESS_TOKEN" \
  https://api.mercadopago.com/v1/payments
```

### Erro: "Twilio não consegue enviar WhatsApp"
```bash
# Verificar número
echo $TWILIO_WHATSAPP_NUMBER

# Testar com curl
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  -d "To=whatsapp:+5511987131241" \
  -d "From=whatsapp:+5511987131241" \
  -d "Body=Teste" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

### Erro: "Jitsi não consegue conectar"
```bash
# Verificar domínio
echo $VITE_JITSI_DOMAIN

# Testar acesso
curl https://meet.jitsi.si/
```

### Erro: "Google Maps não carrega"
```bash
# Verificar API Key
echo $VITE_GOOGLE_MAPS_API_KEY

# Testar em console
console.log(window.google.maps)
```

---

## ✅ CHECKLIST PRÉ-DEPLOY

- [ ] Todas as credenciais configuradas
- [ ] Testes de integração passando
- [ ] Build sem erros
- [ ] Variáveis de ambiente definidas
- [ ] Banco de dados migrado
- [ ] Redis configurado
- [ ] Monitoramento ativo
- [ ] Backups configurados
- [ ] SSL/TLS ativo
- [ ] CORS configurado
- [ ] Rate limiting ativo
- [ ] Logging estruturado
- [ ] Alertas configurados
- [ ] Plano de rollback definido

---

## 📞 SUPORTE

**Em caso de problemas:**
1. Verificar logs: `docker logs plantayraiz`
2. Acessar Grafana: http://localhost:3001
3. Verificar Prometheus: http://localhost:9090
4. Contatar: contato@plantayraiz.com.br

---

## 🎉 PRONTO PARA DEPLOY!

Todos os passos foram completados. Seu sistema está pronto para:
- ✅ Aceitar pagamentos
- ✅ Verificar usuários via WhatsApp
- ✅ Realizar consultas em vídeo
- ✅ Assinar documentos digitalmente
- ✅ Gerenciar comissões automáticas
- ✅ Monitorar performance em tempo real

**Próximo passo:** Execute `npm run deploy` e acesse https://plantayraiz.com.br 🚀
