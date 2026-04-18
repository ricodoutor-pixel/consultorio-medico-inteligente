# 📲 Sincronização Catálogo WhatsApp Business — Planta y Raiz

> ⚠️ **Configuração manual obrigatória** no Meta Business Manager.  
> A API do WhatsApp Cloud não permite criar catálogos programaticamente — apenas consumi-los.

---

## 1️⃣ Perfil Profissional do WhatsApp Business

Acesse: **Meta Business Suite → WhatsApp → Perfil da Empresa**

| Campo | Valor |
|---|---|
| **Nome da Empresa** | Planta y Raiz — Telemedicina Cannabis |
| **Categoria** | Saúde / Serviços Médicos |
| **Descrição** | Telemedicina especializada em Cannabis Medicinal. Dr. Edilson Bezerra (CRM ativo). Consultas online, prescrição digital e acompanhamento. |
| **E-mail** | contato@plantayraiz.com.br |
| **Site** | https://plantayraiz.com.br |
| **Endereço** | (escritório oficial cadastrado) |
| **Horário** | Seg–Sex 09h–18h |

---

## 2️⃣ Catálogo de Serviços (2 produtos)

Acesse: **Meta Commerce Manager → Catálogos → Adicionar Itens**

### 🌍 Produto 1 — Consultoria Internacional Dr. Edilson
| Campo | Valor |
|---|---|
| **Nome** | Consultoria Internacional — Dr. Edilson |
| **Preço** | USD 10.00 |
| **SKU** | CONS-INTL-EDILSON |
| **Descrição** | Consulta online em inglês/espanhol com Dr. Edilson Bezerra. Avaliação de prescrição internacional para Cannabis Medicinal. |
| **Link de Checkout** | https://plantayraiz.com.br/checkout?produto=intl |
| **Imagem** | `/public/dr-edilson.png` |

### 🇧🇷 Produto 2 — Consultoria Nacional Dr. Edilson
| Campo | Valor |
|---|---|
| **Nome** | Consultoria Nacional — Dr. Edilson |
| **Preço** | BRL 30.00 |
| **SKU** | CONS-NAC-EDILSON |
| **Descrição** | Consulta online com Dr. Edilson. Prescrição digital ICP-Brasil válida em todo território nacional. |
| **Link de Checkout** | https://plantayraiz.com.br/checkout?produto=nacional |
| **Imagem** | `/public/dr-edilson.png` |

---

## 3️⃣ Handoff do PDF (Receita) via WhatsApp

✅ **Já implementado** no edge function `whatsapp-chatbot`:
- Após confirmação de pagamento (`payment.approved`), o webhook do Mercado Pago aciona `send-prescription-pdf`
- O PDF assinado (ICP-Brasil) é enviado como `MediaUrl` na mensagem do Twilio
- Validador de Hash garante integridade do documento

---

## 4️⃣ Vincular Catálogo ao WhatsApp

1. **Meta Business Suite → WhatsApp → Configurações → Catálogo**
2. Selecionar o catálogo "Planta y Raiz Serviços"
3. Ativar **"Mostrar catálogo no perfil"**
4. Enviar teste: `oi` → bot deve responder com botão **"Ver Catálogo"**

---

## 5️⃣ Filtro de Emergência (já ativo)

Termos interceptados antes da IA responder:
`infarto`, `ataque cardíaco`, `avc`, `suicídio`, `não consigo respirar`, `engasgado`

→ Resposta automática: **"Em caso de emergência, ligue SAMU 192 ou procure o hospital mais próximo agora."**

---

**Status:** Pronto para sincronização manual no Meta Business Manager.
