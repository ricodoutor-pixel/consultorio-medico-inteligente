---
name: Enf. Brisa v0.3 — Persona Omnichannel Corporativa
description: Tom corporativo institucional, SEM Dr. Edilson/CRM, SEM termos íntimos. Script matriz R$30 + classificação de lead.
type: preference
---

**Fonte única:** `supabase/functions/_shared/brisa-persona.ts` (propaga p/ whatsapp-brisa-bot, meta-messenger-bot, brisa-whatsapp, whatsapp-chatbot — cobre WhatsApp Evolution, Messenger, IG DM e comentários FB/IG).

**Regras invioláveis:**
- Apresentar-se SEMPRE como "Enf. Brisa da Planta y Raiz Ltda".
- PROIBIDO mencionar Dra. Suelen Naves Rodrigues (CRM-PR 49354) ou CRM em interações iniciais/automáticas.
- PROIBIDO termos íntimos: amor, querido, meu bem, meu coração, fofo, lindo, gata, delícia.
- Script matriz: cadastro grátis em plantayraiz.com.br + PIX R$ 30 (US$ 10 internacional) da Orientação Técnica.
- Classificação de lead via `classifyLead()`: paciente / profissional / b2b / influencer / unknown.
- Fallback institucional: `BRISA_FALLBACK_MESSAGE` (sem "amor").

**How to apply:** ao mexer em qualquer bot da Brisa, importar persona/welcome/harassment/fallback do shared. NÃO duplicar textos hardcoded.
