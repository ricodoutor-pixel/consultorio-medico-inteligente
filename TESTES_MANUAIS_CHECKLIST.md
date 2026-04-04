# 🧪 CHECKLIST DE TESTES MANUAIS - PLANTAYRAIZ.COM.BR

## ✅ TESTE 1: FLUXO DE COMPRA COMPLETO

### Pré-requisitos
- [ ] Acesso a plantayraiz.com.br
- [ ] Navegador moderno (Chrome, Safari, Firefox)
- [ ] Dispositivo: Desktop, Tablet, Mobile

### Etapas
- [ ] **1.1** Acessar página inicial
- [ ] **1.2** Clicar em "Shop" no menu
- [ ] **1.3** Visualizar lista de produtos
- [ ] **1.4** Clicar em "Adicionar ao Carrinho"
- [ ] **1.5** Verificar badge do carrinho (número atualizado)
- [ ] **1.6** Clicar no ícone do carrinho
- [ ] **1.7** Verificar modal com itens
- [ ] **1.8** Alterar quantidade (+ e -)
- [ ] **1.9** Clicar em "Ir para Checkout"
- [ ] **1.10** Preencher endereço de entrega
- [ ] **1.11** Verificar cálculo de frete
- [ ] **1.12** Aplicar cupom de desconto (se houver)
- [ ] **1.13** Clicar em "Continuar para Pagamento"

**Status:** ⏳ Aguardando teste

---

## ✅ TESTE 2: INTEGRAÇÃO MERCADO PAGO

### Pré-requisitos
- [ ] Estar na página de checkout
- [ ] Credenciais Mercado Pago configuradas
- [ ] Cartão de teste disponível

### Etapas
- [ ] **2.1** Selecionar "Cartão de Crédito"
- [ ] **2.2** Preencher número do cartão
- [ ] **2.3** Preencher validade (MM/YY)
- [ ] **2.4** Preencher CVV
- [ ] **2.5** Preencher nome do titular
- [ ] **2.6** Selecionar parcelamento (1x)
- [ ] **2.7** Clicar em "Pagar"
- [ ] **2.8** Aguardar processamento
- [ ] **2.9** Verificar página de sucesso
- [ ] **2.10** Confirmar número do pedido
- [ ] **2.11** Verificar email de confirmação

**Cartão de Teste Mercado Pago:**
```
Número: 5031 7557 3453 2521
Validade: 11/25
CVV: 123
Titular: TEST USER
```

**Status:** ⏳ Aguardando credenciais

---

## ✅ TESTE 3: AGENDAMENTO COM WHATSAPP

### Pré-requisitos
- [ ] Usuário autenticado
- [ ] Número WhatsApp real
- [ ] Brisa IA configurada

### Etapas
- [ ] **3.1** Clicar em "Agendar Consulta"
- [ ] **3.2** Selecionar "Dr. Edilson Bezerra"
- [ ] **3.3** Escolher data disponível
- [ ] **3.4** Escolher horário
- [ ] **3.5** Preencher motivo da consulta
- [ ] **3.6** Clicar em "Confirmar Agendamento"
- [ ] **3.7** Verificar mensagem WhatsApp recebida
- [ ] **3.8** Validar link de confirmação
- [ ] **3.9** Clicar em link para confirmar
- [ ] **3.10** Verificar notificação para médico

**Número da Brisa:** 55 11 99136-3154

**Status:** ⏳ Aguardando Twilio

---

## ✅ TESTE 4: TELEMEDICINA COM JITSI

### Pré-requisitos
- [ ] Agendamento confirmado
- [ ] Câmera e microfone funcionando
- [ ] Conexão de internet estável

### Etapas
- [ ] **4.1** Acessar página de consulta
- [ ] **4.2** Clicar em "Entrar na Sala"
- [ ] **4.3** Permitir acesso à câmera
- [ ] **4.4** Permitir acesso ao microfone
- [ ] **4.5** Aguardar médico conectar
- [ ] **4.6** Testar qualidade de vídeo
- [ ] **4.7** Testar qualidade de áudio
- [ ] **4.8** Usar chat durante consulta
- [ ] **4.9** Compartilhar tela (se necessário)
- [ ] **4.10** Finalizar consulta
- [ ] **4.11** Verificar receita digital gerada
- [ ] **4.12** Fazer download do PDF

**Status:** ⏳ Aguardando agendamento

---

## ✅ TESTE 5: TRIAGEM IA BRISA

### Pré-requisitos
- [ ] Usuário novo ou não autenticado
- [ ] Brisa IA ativa

### Etapas
- [ ] **5.1** Acessar página inicial
- [ ] **5.2** Clicar em "Iniciar Triagem"
- [ ] **5.3** Responder primeira pergunta
- [ ] **5.4** Verificar próxima pergunta
- [ ] **5.5** Continuar respondendo
- [ ] **5.6** Verificar análise de sintomas
- [ ] **5.7** Verificar recomendação de especialidade
- [ ] **5.8** Verificar sugestão de médicos próximos
- [ ] **5.9** Clicar em médico sugerido
- [ ] **5.10** Agendar consulta
- [ ] **5.11** Verificar histórico salvo

**Status:** ⏳ Pronto para teste

---

## ✅ TESTE 6: VALIDAÇÃO RDC 660

### Pré-requisitos
- [ ] Usuário médico autenticado
- [ ] Receita médica em PDF/JPG
- [ ] OCR IA ativa

### Etapas
- [ ] **6.1** Acessar "Prescrever"
- [ ] **6.2** Clicar em "Upload Receita"
- [ ] **6.3** Selecionar arquivo de receita
- [ ] **6.4** Aguardar processamento OCR
- [ ] **6.5** Verificar dados extraídos
- [ ] **6.6** Validar CRM médico
- [ ] **6.7** Validar CID-10
- [ ] **6.8** Validar medicamentos
- [ ] **6.9** Verificar confiança (> 85%)
- [ ] **6.10** Clicar em "Confirmar Prescrição"
- [ ] **6.11** Verificar armazenamento em S3

**Status:** ⏳ Aguardando receita

---

## ✅ TESTE 7: RESPONSIVIDADE MOBILE

### Pré-requisitos
- [ ] Dispositivo iOS (iPhone)
- [ ] Dispositivo Android
- [ ] Tablet

### Etapas iOS
- [ ] **7.1** Acessar site em iPhone
- [ ] **7.2** Verificar z-index (menu sobre conteúdo)
- [ ] **7.3** Verificar safe-area (notch)
- [ ] **7.4** Testar scroll sem travamentos
- [ ] **7.5** Testar botões com tamanho adequado
- [ ] **7.6** Testar formulários
- [ ] **7.7** Testar vídeo Jitsi

### Etapas Android
- [ ] **7.8** Acessar site em Android
- [ ] **7.9** Verificar layout responsivo
- [ ] **7.10** Testar scroll
- [ ] **7.11** Testar botões
- [ ] **7.12** Testar formulários
- [ ] **7.13** Testar vídeo Jitsi

### Etapas Tablet
- [ ] **7.14** Acessar site em iPad
- [ ] **7.15** Verificar layout otimizado
- [ ] **7.16** Testar todos os fluxos

**Status:** ⏳ Aguardando dispositivos

---

## ✅ TESTE 8: PERFORMANCE

### Pré-requisitos
- [ ] DevTools aberto
- [ ] Network throttling (3G)

### Etapas
- [ ] **8.1** Medir tempo de carregamento
- [ ] **8.2** Verificar tamanho do bundle
- [ ] **8.3** Verificar número de requisições
- [ ] **8.4** Testar com 3G simulado
- [ ] **8.5** Verificar Lighthouse score
- [ ] **8.6** Verificar Core Web Vitals
- [ ] **8.7** Verificar cache funcionando

**Metas:**
- Tempo de carregamento: < 2s
- Lighthouse: > 90
- CLS: < 0.1
- LCP: < 2.5s
- FID: < 100ms

**Status:** ⏳ Aguardando teste

---

## ✅ TESTE 9: SEGURANÇA

### Pré-requisitos
- [ ] DevTools aberto
- [ ] SSL Labs disponível

### Etapas
- [ ] **9.1** Verificar HTTPS ativo
- [ ] **9.2** Verificar certificado válido
- [ ] **9.3** Verificar CSP headers
- [ ] **9.4** Verificar HSTS headers
- [ ] **9.5** Verificar X-Content-Type-Options
- [ ] **9.6** Verificar X-Frame-Options
- [ ] **9.7** Testar SSL Labs (A+ esperado)
- [ ] **9.8** Verificar sem vulnerabilidades

**Status:** ⏳ Aguardando teste

---

## ✅ TESTE 10: ACESSIBILIDADE

### Pré-requisitos
- [ ] Leitor de tela (NVDA/JAWS)
- [ ] Axe DevTools instalado

### Etapas
- [ ] **10.1** Verificar contraste de cores
- [ ] **10.2** Verificar labels em formulários
- [ ] **10.3** Testar navegação por teclado
- [ ] **10.4** Testar com leitor de tela
- [ ] **10.5** Verificar ARIA labels
- [ ] **10.6** Verificar sem erros Axe
- [ ] **10.7** Verificar WCAG 2.1 AA

**Status:** ⏳ Aguardando teste

---

## 📊 RESUMO DE TESTES

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| 1 | Fluxo de Compra | ⏳ | Pronto |
| 2 | Mercado Pago | ⏳ | Aguardando credenciais |
| 3 | WhatsApp | ⏳ | Aguardando Twilio |
| 4 | Jitsi | ⏳ | Aguardando agendamento |
| 5 | IA Brisa | ⏳ | Pronto |
| 6 | RDC 660 | ⏳ | Aguardando receita |
| 7 | Mobile | ⏳ | Aguardando dispositivos |
| 8 | Performance | ⏳ | Pronto |
| 9 | Segurança | ⏳ | Pronto |
| 10 | Acessibilidade | ⏳ | Pronto |

---

## 🎯 PRÓXIMAS AÇÕES

1. Executar testes 1, 5, 8, 9, 10 agora
2. Aguardar credenciais Mercado Pago para teste 2
3. Aguardar Twilio para teste 3
4. Agendar consulta para teste 4
5. Obter receita para teste 6
6. Testar em dispositivos reais para teste 7

---

**Gerado:** 2026-04-04
**Status:** 🟡 AGUARDANDO TESTES MANUAIS
