# 👥 GUIA DE TESTES COM USUÁRIOS REAIS

**Objetivo:** Validar todas as funcionalidades com usuários reais antes de expansão completa  
**Duração:** 1 semana (Semana 1 de produção)  
**Participantes:** 5-10 usuários beta

---

## 📋 RECRUTAMENTO DE USUÁRIOS BETA

### Perfis Necessários

**Pacientes (3-4 usuários)**
- Idade: 18-65 anos
- Experiência com tecnologia: Básica a Avançada
- Interesse: Telemedicina
- Disponibilidade: 2 horas para testes

**Médicos (2-3 usuários)**
- Especialidade: Clínica Geral, Cannabis Medicinal, Dermatologia
- CRM ativo
- Experiência com telemedicina: Sim
- Disponibilidade: 3 horas para testes

**Lojistas (2-3 usuários)**
- Tipo: Farmácia, Loja de Produtos Naturais
- Experiência com e-commerce: Sim
- Disponibilidade: 2 horas para testes

### Critérios de Seleção

- [ ] Acesso a dispositivos (desktop + mobile)
- [ ] Conexão de internet estável
- [ ] Navegadores modernos (Chrome, Safari, Firefox)
- [ ] Disponibilidade para feedback
- [ ] Assinatura de NDA (opcional)

---

## 🧪 FLUXOS DE TESTE

### FLUXO 1: Registro de Paciente

**Duração:** 15 minutos  
**Objetivo:** Validar onboarding de paciente

**Passos:**

1. **Acessar Site**
   - [ ] Homepage carrega em < 2s
   - [ ] Design é atraente
   - [ ] CTA "Registrar" está visível
   - [ ] Navegação é intuitiva

2. **Clicar em Registrar**
   - [ ] Formulário abre corretamente
   - [ ] Campos estão claros
   - [ ] Validação de email funciona
   - [ ] Validação de senha funciona

3. **Preencher Dados**
   - [ ] Nome completo
   - [ ] Email válido
   - [ ] Senha forte
   - [ ] Aceitar termos

4. **Verificação de Email**
   - [ ] Email recebido em < 1 min
   - [ ] Link de verificação funciona
   - [ ] Email confirmado com sucesso

5. **Verificação de WhatsApp**
   - [ ] Código enviado via WhatsApp
   - [ ] Código recebido em < 30s
   - [ ] Código válido por 10 min
   - [ ] Verificação bem-sucedida

6. **Fazer Login**
   - [ ] Login funciona
   - [ ] Dashboard carrega
   - [ ] Dados do usuário corretos

**Feedback Esperado:**
- Facilidade: 1-10 ___
- Clareza: 1-10 ___
- Tempo: Aceitável? Sim/Não
- Problemas: _______________

---

### FLUXO 2: Escolher Plano e Fazer Pagamento

**Duração:** 20 minutos  
**Objetivo:** Validar checkout e pagamento

**Passos:**

1. **Ver Planos**
   - [ ] Tabela de planos visível
   - [ ] 5 planos listados
   - [ ] Preços corretos
   - [ ] Benefícios claros

2. **Comparar Planos**
   - [ ] Diferenças entre planos claras
   - [ ] Recomendação por perfil funciona
   - [ ] CTA "Escolher Plano" visível

3. **Selecionar Plano**
   - [ ] Plano selecionado (ex: Usuário R$29)
   - [ ] Resumo do plano correto
   - [ ] Botão "Pagar" funciona

4. **Checkout**
   - [ ] Formulário de pagamento abre
   - [ ] Mercado Pago integrado
   - [ ] Opções de pagamento: Crédito, Débito, Pix
   - [ ] Parcelamento disponível

5. **Pagamento (Teste)**
   - [ ] Usar cartão de teste Mercado Pago
   - [ ] Número: 4111 1111 1111 1111
   - [ ] Validade: 11/25
   - [ ] CVV: 123
   - [ ] Pagamento processado

6. **Confirmação**
   - [ ] Email de confirmação recebido
   - [ ] Dashboard atualizado
   - [ ] Benefícios do plano ativados
   - [ ] Acesso ao shopping liberado

**Feedback Esperado:**
- Confiança no checkout: 1-10 ___
- Segurança: 1-10 ___
- Clareza de preços: 1-10 ___
- Problemas: _______________

---

### FLUXO 3: Agendar Consulta

**Duração:** 15 minutos  
**Objetivo:** Validar agendamento de consulta

**Passos:**

1. **Buscar Médico**
   - [ ] Página de médicos carrega
   - [ ] Filtros funcionam (especialidade, localização)
   - [ ] Lista de médicos exibida
   - [ ] Foto e dados do médico visíveis

2. **Selecionar Médico**
   - [ ] Clicar em médico (ex: Dr. Edilson Bezerra)
   - [ ] Perfil do médico abre
   - [ ] Especialidade: Cannabis Medicinal
   - [ ] Avaliações visíveis
   - [ ] Horários disponíveis listados

3. **Escolher Horário**
   - [ ] Calendário funciona
   - [ ] Horários disponíveis em verde
   - [ ] Horários indisponíveis em cinza
   - [ ] Clicar em horário desejado

4. **Confirmar Agendamento**
   - [ ] Resumo da consulta correto
   - [ ] Data e hora corretas
   - [ ] Médico correto
   - [ ] Botão "Confirmar" funciona

5. **Consentimento Médico**
   - [ ] Formulário de consentimento abre
   - [ ] Termos claros e legíveis
   - [ ] Checkbox para aceitar
   - [ ] Botão "Assinar Digitalmente" funciona

6. **Assinatura Digital (Clicksign)**
   - [ ] Documento enviado para assinatura
   - [ ] Email de assinatura recebido
   - [ ] Link de assinatura funciona
   - [ ] Documento assinado com sucesso

**Feedback Esperado:**
- Facilidade de agendamento: 1-10 ___
- Clareza de horários: 1-10 ___
- Confiança no processo: 1-10 ___
- Problemas: _______________

---

### FLUXO 4: Consulta em Tempo Real

**Duração:** 30 minutos  
**Objetivo:** Validar vídeo consulta

**Passos:**

1. **Entrar na Sala de Consulta**
   - [ ] 15 min antes: Notificação recebida
   - [ ] Link de acesso visível
   - [ ] Clicar em "Entrar na Consulta"
   - [ ] Jitsi Meet carrega

2. **Testes de Áudio/Vídeo**
   - [ ] Câmera funciona
   - [ ] Microfone funciona
   - [ ] Áudio do outro lado funciona
   - [ ] Vídeo do outro lado funciona

3. **Durante a Consulta**
   - [ ] Qualidade de vídeo: boa
   - [ ] Latência: < 1s
   - [ ] Sem travamentos
   - [ ] Chat funciona (se necessário)

4. **Compartilhamento de Tela**
   - [ ] Médico compartilha tela
   - [ ] Imagem clara
   - [ ] Sem lag

5. **Prescrição**
   - [ ] Médico prescreve medicamento
   - [ ] Prescrição digital gerada
   - [ ] Download disponível
   - [ ] Email com prescrição recebido

6. **Encerramento**
   - [ ] Botão "Encerrar Consulta" funciona
   - [ ] Consulta gravada (se ativada)
   - [ ] Link de gravação enviado
   - [ ] Feedback solicitado

**Feedback Esperado:**
- Qualidade de vídeo: 1-10 ___
- Qualidade de áudio: 1-10 ___
- Experiência geral: 1-10 ___
- Problemas técnicos: _______________

---

### FLUXO 5: Marketplace de Produtos

**Duração:** 15 minutos  
**Objetivo:** Validar busca e compra de produtos

**Passos:**

1. **Acessar Shopping**
   - [ ] Menu "Shopping" visível
   - [ ] Shopping carrega em < 2s
   - [ ] Categorias listadas

2. **Buscar Produto**
   - [ ] Buscar "Óleo de Cannabis"
   - [ ] Resultados aparecem
   - [ ] Filtros funcionam (preço, avaliação)
   - [ ] Ordenação funciona

3. **Ver Produto**
   - [ ] Foto do produto clara
   - [ ] Descrição completa
   - [ ] Preço visível
   - [ ] Avaliações de clientes

4. **Comparar Preços**
   - [ ] 3 melhores preços listados
   - [ ] Lojistas diferentes
   - [ ] Frete calculado
   - [ ] Prazo de entrega visível

5. **Adicionar ao Carrinho**
   - [ ] Quantidade selecionável
   - [ ] Botão "Adicionar" funciona
   - [ ] Produto adicionado ao carrinho
   - [ ] Notificação de sucesso

6. **Checkout**
   - [ ] Carrinho atualizado
   - [ ] Total correto
   - [ ] Frete correto
   - [ ] Botão "Comprar" funciona

**Feedback Esperado:**
- Facilidade de busca: 1-10 ___
- Clareza de preços: 1-10 ___
- Confiança na compra: 1-10 ___
- Problemas: _______________

---

### FLUXO 6: Sistema de Afiliados

**Duração:** 15 minutos  
**Objetivo:** Validar sistema de afiliados

**Passos:**

1. **Acessar Dashboard de Afiliado**
   - [ ] Menu "Afiliado" visível
   - [ ] Dashboard carrega
   - [ ] Estatísticas visíveis

2. **Gerar Link de Afiliado**
   - [ ] Botão "Gerar Link" funciona
   - [ ] Link único gerado
   - [ ] Link copiável
   - [ ] QR code disponível

3. **Compartilhar Link**
   - [ ] Link funciona quando clicado
   - [ ] Referência rastreada
   - [ ] Usuário visto como referência

4. **Ver Comissões**
   - [ ] Dashboard mostra referências
   - [ ] Comissões calculadas (50% Nível 1)
   - [ ] Histórico de vendas
   - [ ] Ganhos totais

5. **Solicitar Saque**
   - [ ] Saldo disponível visível
   - [ ] Botão "Sacar" funciona
   - [ ] Formulário de saque abre
   - [ ] Valor selecionável
   - [ ] Taxa de saque (5%) exibida
   - [ ] Valor líquido correto

6. **Confirmação de Saque**
   - [ ] Saque processado
   - [ ] Confirmação por email
   - [ ] Pix recebido em < 1 hora
   - [ ] Extrato atualizado

**Feedback Esperado:**
- Facilidade de afiliação: 1-10 ___
- Clareza de comissões: 1-10 ___
- Confiança no sistema: 1-10 ___
- Problemas: _______________

---

## 📊 FORMULÁRIO DE FEEDBACK

```
USUÁRIO: _______________
DATA: _______________
DISPOSITIVO: Desktop / Mobile
NAVEGADOR: _______________

FLUXO TESTADO: _______________

FACILIDADE (1-10): ___
CLAREZA (1-10): ___
PERFORMANCE (1-10): ___
CONFIANÇA (1-10): ___

BUGS ENCONTRADOS:
1. _______________
2. _______________
3. _______________

SUGESTÕES DE MELHORIA:
1. _______________
2. _______________
3. _______________

RECOMENDARIA PARA AMIGOS?
Sim / Não / Talvez

COMENTÁRIOS ADICIONAIS:
_______________
_______________
```

---

## 🎯 CRITÉRIOS DE SUCESSO

**Dia 1 (Registro):**
- [ ] 100% dos usuários conseguem registrar
- [ ] Tempo médio < 5 min
- [ ] Satisfação > 8/10

**Dia 2 (Pagamento):**
- [ ] 100% dos pagamentos processados
- [ ] Sem erros de Mercado Pago
- [ ] Satisfação > 8/10

**Dia 3 (Consulta):**
- [ ] 100% das consultas agendadas
- [ ] Vídeo funciona sem problemas
- [ ] Satisfação > 8/10

**Dia 4 (Shopping):**
- [ ] 100% das buscas funcionam
- [ ] Comparação de preços funciona
- [ ] Satisfação > 8/10

**Dia 5 (Afiliados):**
- [ ] 100% dos links funcionam
- [ ] Comissões calculadas corretamente
- [ ] Satisfação > 8/10

---

## 🚀 PRÓXIMOS PASSOS

1. Recrutar usuários beta
2. Enviar guia de testes
3. Agendar sessões de teste
4. Coletar feedback
5. Priorizar bugs
6. Implementar fixes
7. Expandir para mais usuários

---

**Boa sorte com os testes! 🎉**
