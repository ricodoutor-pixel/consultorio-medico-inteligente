# 🏥 PROMPT FINAL PARA LOVABLE.DEV - PLANTA & RAIZ CLÍNICA DIGITAL

---

## 🎯 OBJETIVO GERAL

Desenvolver o **MVP da Planta & Raiz**, uma **clínica digital robusta de telemedicina** especializada em terapias canabinoides e clínica geral, com segurança LGPD, prescrição médica RDC 660 e estética profissional.

---

## 🛠️ CONFIGURAÇÕES TÉCNICAS

### Stack Tecnológico
- **Frontend:** React 19 + Tailwind CSS 4 + Lucide Icons
- **Backend:** Node.js + Express + tRPC
- **Banco de Dados:** MySQL/TiDB
- **Autenticação:** Manus OAuth + JWT
- **Telemedicina:** WebRTC/Jitsi
- **Pagamento:** Mercado Pago
- **Armazenamento:** S3 (CDN)

### Design System
- **Paleta Principal:** Verde Floresta (#10B981, #059669, #047857)
- **Paleta Secundária:** Branco Off-white (#F9FAFB, #F3F4F6)
- **Acentos:** Azul Médico (#0EA5E9), Vermelho Alerta (#EF4444)
- **Tipografia:** Inter/Poppins (Google Fonts)
- **Ícones:** Lucide React (24px, 32px, 48px)

### Responsividade
- **Mobile:** 320px - 640px (foco principal)
- **Tablet:** 640px - 1024px
- **Desktop:** 1024px+
- **Mobile-first:** Todos os componentes começam mobile

---

## 📋 FUNCIONALIDADES OBRIGATÓRIAS

### 1️⃣ DASHBOARD DO PACIENTE

#### Layout Principal
```
┌─────────────────────────────────────────┐
│ Header: Logo | Minhas Consultas | Menu  │
├─────────────────────────────────────────┤
│ Welcome Card: "Bem-vindo, [Nome]"       │
│ Próxima Consulta: [Data/Hora/Médico]    │
├─────────────────────────────────────────┤
│ Seções:                                 │
│ • Próximas Consultas (Cards)            │
│ • Histórico de Consultas (Lista)        │
│ • Minhas Prescrições (Cards)            │
│ • Documentos/Exames (Upload)            │
│ • Educação ao Paciente (Cards)          │
└─────────────────────────────────────────┘
```

#### Componentes
- **Welcome Card:** Saudação personalizada + próxima consulta
- **Próximas Consultas:** Cards com data, hora, médico, especialidade, botão "Entrar na Consulta"
- **Histórico de Consultas:** Lista com data, médico, duração, status (concluída/cancelada)
- **Minhas Prescrições:** Cards com data, medicamento, dosagem, botão "Visualizar PDF"
- **Upload de Documentos:** Drag-and-drop para exames, históricos, documentos
- **Educação ao Paciente:** Cards com artigos sobre regulamentação ANVISA, uso terapêutico

#### Dados Exibidos
- Nome do paciente
- Email
- Telefone (mascarado)
- Data de nascimento
- CPF (mascarado)
- Próximas consultas (máx 3)
- Histórico (últimas 10)
- Prescrições ativas
- Documentos enviados

---

### 2️⃣ MÓDULO DE PRESCRIÇÃO RDC 660

#### Interface do Médico
```
┌─────────────────────────────────────────┐
│ Nova Prescrição - RDC 660               │
├─────────────────────────────────────────┤
│ Paciente: [Seletor com busca]           │
│ Data: [Data picker]                     │
│ Validade: [30/60/90 dias]               │
├─────────────────────────────────────────┤
│ Medicamento:                            │
│ • Tipo: [Óleo/Flor/Cápsula/Tópico]     │
│ • Canabinoides: THC [%] | CBD [%]      │
│ • Concentração: [mg/mL]                 │
│ • Dosagem: [mg] a cada [horas]         │
│ • Quantidade: [mL/g]                    │
│ • Via de Administração: [Oral/Tópica]  │
├─────────────────────────────────────────┤
│ Indicação Clínica: [Textarea]           │
│ Observações: [Textarea]                 │
│ Termo de Responsabilidade: [Checkbox]   │
├─────────────────────────────────────────┤
│ [Gerar PDF] [Enviar por Email] [Salvar] │
└─────────────────────────────────────────┘
```

#### Campos Específicos
- **Paciente:** Busca por nome/CPF com validação
- **Tipo de Medicamento:** Óleo, Flor, Cápsula, Tópico, Sublingual
- **Canabinoides:** Sliders para THC (0-30%) e CBD (0-30%)
- **Concentração:** Campo numérico (mg/mL)
- **Dosagem:** Campo numérico + seletor de frequência
- **Quantidade:** Campo numérico + unidade (mL, g, cápsulas)
- **Via de Administração:** Oral, Tópica, Sublingual, Inalação
- **Indicação Clínica:** Textarea com sugestões (epilepsia, dor, ansiedade, etc)
- **Termo de Responsabilidade:** Checkbox obrigatório + link para termo completo
- **Assinatura Digital:** Campo para assinatura do médico

#### Exportação
- **PDF:** Documento profissional com logo, dados do paciente, medicamento, dosagem, termo
- **Email:** Envio automático para paciente + cópia para médico
- **Histórico:** Salvo no banco de dados com data/hora/médico

#### Validações
- ✅ Paciente selecionado
- ✅ Medicamento preenchido
- ✅ Dosagem válida
- ✅ Termo aceito
- ✅ Médico autenticado

---

### 3️⃣ SISTEMA DE AGENDAMENTO

#### Calendário Interativo
```
┌─────────────────────────────────────────┐
│ Agendar Consulta                        │
├─────────────────────────────────────────┤
│ Especialidade: [Seletor]                │
│ Médico: [Seletor com foto]              │
│ Data: [Calendário com datas livres]     │
│ Horário: [Slots disponíveis]            │
│ Tipo: [Presencial/Telemedicina]         │
│ Motivo: [Textarea]                      │
│ Triagem: [Perguntas sobre saúde]        │
├─────────────────────────────────────────┤
│ [Confirmar] [Cancelar]                  │
└─────────────────────────────────────────┘
```

#### Componentes
- **Seletor de Especialidade:** Clínica Geral, Cannabis Medicinal, Neurologia, etc
- **Seletor de Médico:** Cards com foto, nome, especialidade, avaliação
- **Calendário:** Mostrar apenas datas disponíveis (próximos 30 dias)
- **Slots de Horário:** Mostrar horários livres (ex: 09:00, 09:30, 10:00)
- **Tipo de Consulta:** Presencial ou Telemedicina
- **Motivo da Consulta:** Textarea para descrever queixa principal
- **Triagem:** Perguntas sobre condições de saúde (veja seção Onboarding)

#### Integração com Checkout
- Após confirmar agendamento, redirecionar para checkout Mercado Pago
- Valores: Consulta Inicial (R$ 150), Retorno (R$ 100), Prescrição (R$ 80)
- Após pagamento confirmado, enviar email com link para telemedicina

#### Notificações
- Email: Confirmação de agendamento + link para consulta
- SMS: Lembrete 24h antes (opcional)
- Push: Notificação 15min antes (se app mobile)

---

### 4️⃣ SALA DE TELEMEDICINA

#### Interface da Consulta
```
┌─────────────────────────────────────────┐
│ Consulta com Dr. [Nome] - [Data/Hora]   │
├──────────────────┬──────────────────────┤
│ Vídeo do Médico  │ Chat Lateral:        │
│ (WebRTC/Jitsi)   │ • Mensagens          │
│                  │ • Arquivos           │
│ Botões:          │ • Links              │
│ • Mute           │                      │
│ • Câmera         │ Anotações do Médico: │
│ • Compartilhar   │ • Prontuário         │
│ • Encerrar       │ • Prescrição         │
│                  │ • Receita            │
└──────────────────┴──────────────────────┘
```

#### Componentes
- **Vídeo Principal:** Integração com WebRTC/Jitsi (full HD)
- **Chat Lateral:** Mensagens em tempo real entre paciente e médico
- **Compartilhamento de Tela:** Médico pode compartilhar documentos/imagens
- **Anotações do Médico:** Área para fazer anotações durante consulta
- **Prontuário Eletrônico:** Acesso rápido ao histórico do paciente
- **Botões de Controle:** Mute, câmera, compartilhar, encerrar
- **Temporizador:** Mostrar duração da consulta

#### Funcionalidades
- ✅ Vídeo HD com baixa latência
- ✅ Chat com suporte a emojis e arquivos
- ✅ Compartilhamento de tela
- ✅ Gravação (com consentimento)
- ✅ Prescrição em tempo real
- ✅ Anotações sincronizadas

#### Segurança
- ✅ Conexão criptografada (HTTPS/WSS)
- ✅ Autenticação de paciente e médico
- ✅ Timeout automático após 30 min de inatividade
- ✅ Logs de acesso

---

### 5️⃣ SEGURANÇA LGPD

#### Banners de Consentimento
```
┌─────────────────────────────────────────┐
│ ⚠️ Consentimento LGPD                   │
│                                         │
│ Ao usar esta plataforma, você concorda │
│ com nossa Política de Privacidade.      │
│                                         │
│ Seus dados são protegidos conforme a    │
│ Lei Geral de Proteção de Dados (LGPD). │
│                                         │
│ [Li e Aceito] [Política] [Contato]     │
└─────────────────────────────────────────┘
```

#### Máscaras de Privacidade
- **CPF:** 123.456.789-** (últimos 2 dígitos ocultos)
- **Telefone:** (11) 9****-**** (últimos 4 dígitos ocultos)
- **Email:** user@emai****.com (domínio parcialmente oculto)
- **Cartão:** **** **** **** 1234 (últimos 4 dígitos visíveis)

#### Políticas Implementadas
- ✅ Política de Privacidade (link no footer)
- ✅ Termos de Uso (link no footer)
- ✅ Termo de Consentimento LGPD (banner ao primeiro acesso)
- ✅ Direito de Acesso aos Dados (página de dados pessoais)
- ✅ Direito de Exclusão (botão "Deletar Conta")
- ✅ Direito de Portabilidade (botão "Exportar Dados")

#### Criptografia
- ✅ Dados sensíveis criptografados no banco
- ✅ Conexão HTTPS/TLS 1.3
- ✅ Tokens JWT com expiração
- ✅ Senhas com hash bcrypt

---

## 🎯 FLUXOS DE USUÁRIO

### FLUXO 1: ONBOARDING DO PACIENTE

```
1. Paciente acessa plantayraiz.com.br
   ↓
2. Clica em "Criar Conta"
   ↓
3. Preenche dados básicos:
   - Nome completo
   - Email
   - Telefone
   - Data de nascimento
   - CPF
   ↓
4. Aceita Termos + LGPD
   ↓
5. Preenche Triagem de Saúde:
   - Condições de saúde atuais
   - Medicamentos em uso
   - Alergias
   - Histórico familiar
   - Motivo da consulta
   ↓
6. Seleciona especialidade e médico
   ↓
7. Escolhe data/hora disponível
   ↓
8. Confirma agendamento
   ↓
9. Redireciona para checkout Mercado Pago
   ↓
10. Após pagamento, acesso ao dashboard
    ↓
11. Email com link para telemedicina (se consulta hoje)
```

### FLUXO 2: CONSULTA TELEMEDICINA

```
1. Paciente clica em "Entrar na Consulta"
   ↓
2. Verifica câmera e microfone
   ↓
3. Entra na sala de telemedicina
   ↓
4. Médico entra na sala
   ↓
5. Consulta ocorre com:
   - Vídeo HD
   - Chat lateral
   - Anotações do médico
   ↓
6. Médico gera prescrição (se necessário)
   ↓
7. Prescrição enviada para paciente por email
   ↓
8. Consulta encerrada
   ↓
9. Paciente recebe feedback e avaliação
```

### FLUXO 3: PRESCRIÇÃO RDC 660

```
1. Médico acessa "Nova Prescrição"
   ↓
2. Seleciona paciente
   ↓
3. Preenche dados do medicamento:
   - Tipo (óleo, flor, cápsula, etc)
   - Canabinoides (THC%, CBD%)
   - Concentração (mg/mL)
   - Dosagem (mg a cada X horas)
   - Quantidade (mL/g)
   - Via de administração
   ↓
4. Preenche indicação clínica
   ↓
5. Aceita termo de responsabilidade
   ↓
6. Clica em "Gerar PDF"
   ↓
7. PDF é gerado com assinatura digital
   ↓
8. Prescrição é enviada para paciente por email
   ↓
9. Prescrição é salva no histórico do paciente
```

---

## 🎨 DESIGN ESPECÍFICO

### Paleta de Cores
```
Verde Floresta (Primária):
- #10B981 (Verde claro - botões, links)
- #059669 (Verde médio - hover)
- #047857 (Verde escuro - active)

Branco Off-white (Fundo):
- #FFFFFF (Branco puro)
- #F9FAFB (Off-white leve)
- #F3F4F6 (Off-white médio)

Acentos:
- #0EA5E9 (Azul médico - informações)
- #EF4444 (Vermelho alerta - avisos)
- #FBBF24 (Amarelo - atenção)

Neutros:
- #1F2937 (Texto escuro)
- #6B7280 (Texto médio)
- #D1D5DB (Bordas)
```

### Componentes
- **Botões:** Verde com hover mais escuro, texto branco
- **Cards:** Fundo off-white com borda cinza clara
- **Inputs:** Borda cinza, foco verde
- **Headers:** Verde com ícones brancos
- **Badges:** Verde claro com texto verde escuro
- **Alerts:** Vermelho para erros, amarelo para avisos, azul para info

### Tipografia
- **Headlines:** Poppins Bold (32px, 28px, 24px)
- **Subtítulos:** Poppins SemiBold (20px, 18px)
- **Body:** Inter Regular (16px, 14px)
- **Small:** Inter Regular (12px, 11px)
- **Monospace:** JetBrains Mono (código, prescrição)

### Ícones
- **Lucide React:** 24px padrão, 32px para destaque
- **Cores:** Verde primária, cinza para desabilitado
- **Espaçamento:** 8px entre ícone e texto

---

## 📱 RESPONSIVIDADE

### Mobile (320px - 640px)
- ✅ Stack vertical de componentes
- ✅ Botões full-width
- ✅ Texto reduzido (14px body)
- ✅ Menu hamburger
- ✅ Modais em fullscreen
- ✅ Calendário simplificado

### Tablet (640px - 1024px)
- ✅ 2 colunas em alguns layouts
- ✅ Botões com padding reduzido
- ✅ Texto normal (16px body)
- ✅ Menu horizontal
- ✅ Modais centralizados

### Desktop (1024px+)
- ✅ 3+ colunas em alguns layouts
- ✅ Botões com padding normal
- ✅ Texto normal (16px body)
- ✅ Menu horizontal completo
- ✅ Modais com max-width

---

## 🔐 SEGURANÇA

### Autenticação
- ✅ Manus OAuth (login social)
- ✅ JWT com refresh token
- ✅ Expiração de sessão (30 min)
- ✅ Logout automático

### Criptografia
- ✅ HTTPS/TLS 1.3
- ✅ Dados sensíveis criptografados
- ✅ Senhas com bcrypt
- ✅ Tokens assinados

### Validação
- ✅ Validação de entrada (Zod)
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ SQL injection prevention

### Conformidade
- ✅ LGPD (Lei Geral de Proteção de Dados)
- ✅ HIPAA-like (proteção de dados médicos)
- ✅ ANVISA (regulamentação de cannabis)
- ✅ CFM (Conselho Federal de Medicina)

---

## 📊 DADOS E INTEGRAÇÃO

### Banco de Dados
```sql
-- Tabelas principais
users (id, email, nome, cpf, telefone, data_nascimento)
medicos (id, user_id, crm, especialidade, bio, foto)
pacientes (id, user_id, triagem_json, documentos)
consultas (id, paciente_id, medico_id, data, status, notas)
prescricoes (id, paciente_id, medico_id, medicamento_json, pdf_url)
pagamentos (id, consulta_id, valor, status, mercado_pago_id)
```

### APIs Externas
- **Mercado Pago:** Checkout de pagamento
- **Jitsi/WebRTC:** Telemedicina
- **SendGrid:** Envio de emails
- **AWS S3:** Armazenamento de arquivos
- **Manus OAuth:** Autenticação

### Integração com Backend
```
Frontend (React) ↔ tRPC ↔ Backend (Node.js) ↔ MySQL
                  ↓
            Validação Zod
            Autenticação JWT
            Criptografia
```

---

## 🚀 INSTRUÇÕES FINAIS

### Para o Lovable
1. **Copie este prompt completo**
2. **Cole no Lovable.dev**
3. **Clique em "Generate"**
4. **Aguarde a geração do código**
5. **Revise e ajuste conforme necessário**

### Para Integração com GitHub
1. **Clone o repositório:** `ricodoutor-pixel/consultorio-medico-inteligente`
2. **Copie o código do Lovable** para `client/src/`
3. **Conecte com backend Node.js** (já implementado)
4. **Execute:** `pnpm install && pnpm dev`
5. **Deploy:** `pnpm build && git push`

### Próximos Passos
1. ✅ Gerar interface no Lovable
2. ✅ Integrar com backend
3. ✅ Testar fluxos
4. ✅ Deploy em Hostinger
5. ✅ Promover para médicos

---

## 📞 SUPORTE

Se precisar de:
- ✅ Script de API de prescrição
- ✅ Integração com banco de dados
- ✅ Testes automatizados
- ✅ Deploy em Hostinger
- ✅ Otimização de performance

**É só me pedir!**

---

**Status:** ✅ PRONTO PARA LOVABLE.DEV

**Transforme isso na #1 clínica digital do Brasil!** 🚀
