# WhatsApp Business — Configuração do Perfil Profissional

> Configuração externa (Meta Business Manager) — não requer alteração de código.

## Número Brisa
**+55 11 99136-3154** (centralizador de triagem)

## 1. Perfil Institucional (Meta Business Suite → WhatsApp Manager)
- **Nome de exibição:** `Planta y Raiz - Clínica Internacional`
- **Categoria:** Saúde / Serviços médicos
- **Descrição:** "Mega Clínica Digital — Triagem, Consultoria e Prescrições. Atendimento 24/7 via Enfermeira Brisa (IA)."
- **Endereço:** mesmo do rodapé do site (escritório oficial)
- **Horário:** 24/7
- **E-mail:** contato@plantayraiz.com.br
- **Site:** https://consultorio-medico-inteligente.lovable.app

## 2. Catálogo de Serviços
Adicionar no Catálogo do WhatsApp Business:
| Item | Preço |
|------|-------|
| Consultoria Triagem (BR) | R$ 30,00 |
| Consultoria Triagem (Internacional) | US$ 10,00 |
| Acompanhamento mensal | R$ 99,00 |

## 3. Webhook ManyChat ↔ WhatsApp
- URL Webhook (Twilio): `https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/process-whatsapp-alerts`
- HMAC-SHA256: usar secret `TWILIO_WEBHOOK_SECRET`
- SLA de resposta da Brisa: **< 2s** (Edge Function `verdinho-chat`)

## 4. Re-scraping do Facebook
Após qualquer mudança em meta tags, executar:
- https://developers.facebook.com/tools/debug/ → colar URL → **Scrape Again**
- Repetir para: `/`, `/shopping`, `/blog`, `/quiz`, `/ebook`, `/dr-edilson`

## 5. Verificação de Performance
- Google PageSpeed Insights → testar todas as URLs principais
- LCP alvo: **< 2s** em 4G
- CLS: **< 0.1**
