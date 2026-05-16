# Plano — 8 melhorias da auditoria

Cada item é independente e pode ser entregue isoladamente sem alterar o visual existente da plataforma (memória `no-visual-changes`). Listo em ordem de **impacto x esforço**.

## Quick wins (baixo risco, alto impacto) — recomendo começar por aqui

### A. Badge "✓ Indicado pelo Dr. Edilson" nos produtos do Shopping
- Migration: `ALTER TABLE vendor_products ADD COLUMN endorsed_by_doctor BOOLEAN DEFAULT false`
- Componente `<DoctorEndorsedBadge />` (verde, ícone check) nos cards
- Toggle no admin (`AdminClinicas` ou novo `AdminProdutos`)
- **Esforço: 30 min**

### B. Showcase da biblioteca científica na homepage
- Novo componente `ScientificBadge.tsx`: count de `scientific_articles` + 3 títulos reais com link PubMed
- Inserido no `Index.tsx` entre depoimentos e gráfico de mercado
- **Esforço: 20 min**

### C. Loop de indicação no webhook do Mercado Pago
- Após `payment.approved` no `mercadopago-webhook`, disparar `brisa-ceo-orchestrator` com evento `orientacao_concluida`
- Mensagem WhatsApp via `evolution-api-proxy`: parabéns + Planta-Coins + link `plantayraiz.com.br?ref=USER_ID`
- Já existe `PostConsultationViralLoop` na tela — isto complementa via WhatsApp
- **Esforço: 30 min**

### D. Depoimentos com data + cidade + link Google Review
- Atualizar `src/data/testimonials.ts`: campos `city`, `date` (Mês/Ano), `googleReviewUrl?`
- Card mostra: "Maria S., São Paulo SP — Março 2026 — ⭐⭐⭐⭐⭐ ([ver no Google](url))"
- **Esforço: 20 min** (dados reais vêm depois)

## Médios (1-2h cada)

### E. Calculadora de tratamento na homepage
- Componente `TreatmentCalculator.tsx`: 5 perguntas (condição, idade, medicamentos, intensidade, duração)
- Reusa lógica do `QuizTriagem` simplificada (sem auth)
- Resultado: perfil canabinoide sugerido + CTA "Orientação Técnica R$30"
- Captura WhatsApp opcional no final → grava em `leads_contatos` (origem='calculadora')

### F. Ebook como lead magnet com captura WhatsApp
- `/ebook` ganha form: nome + WhatsApp (gate para download)
- Insere em `leads_contatos` com origem='ebook', tag='ebook-lead'
- Trigger: Brisa via Evolution envia link do PDF + sequência de nutrição
- PDF do ebook já existe? Confirmar com você

## Maiores (precisam decisão de modelo de negócio)

### G. Plano de assinatura R$79/mês para condições crônicas
- Tabela `subscriptions` já existe — criar plano "Crônico" no Mercado Pago
- Página `/planos/cronico` (epilepsia, Parkinson, autismo, dor crônica)
- Benefícios: 2 orientações/mês + renovação automática + 10% desconto shopping + acompanhamento Brisa
- **Decisão necessária:** preço final, % desconto, frequência exata

### H. Programa Médicos Embaixadores (30% + 10% MLM)
- Landing `/seja-medico`: pitch + calculadora "ganhe R$X/mês"
- Schema novo: `doctor_ambassador_referrals` (médico → paciente indicado)
- Split: 30% do valor da orientação validada pelo médico + 10% das orientações de pacientes que ele cadastrou
- Integração com sistema de afiliados existente (`useReferralTracking`)
- Migration em `affiliate_wallets` para tier "médico embaixador"
- **Decisão necessária:** valores finais, recorrência da comissão (vitalícia? 12 meses?), validação CRM obrigatória?

---

## Recomendação de execução
Sugiro fazer **A + B + C + D no primeiro batch** (sem decisões pendentes, ~2h total, sem mudança visual além dos badges/cards novos).

Depois entrar em E + F. Por último G + H que precisam confirmar números com você.

**Você confirma este batch (A→D) ou prefere outra ordem?**