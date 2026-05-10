# Instruções para Injeção de Secrets (Ambiente Lovable/Supabase)

Para concluir a integração da infraestrutura soberana, os seguintes segredos devem ser configurados no seu ambiente de produção (Lovable ou Supabase Dashboard):

| Secret Name | Value / Description |
|-------------|---------------------|
| `EVOLUTION_API_KEY` | A chave mestre gerada na sua VPS. |
| `EVOLUTION_API_URL` | `https://api.plantayraiz.com.br` |
| `PLAUSIBLE_DOMAIN` | `plantayraiz.com.br` |

## Como configurar no Supabase:
1. Vá para o Dashboard do Supabase.
2. Navegue até **Edge Functions** -> **Manage Secrets**.
3. Adicione as chaves acima com seus respectivos valores.

## Como configurar no Lovable:
1. Use a ferramenta `add_secret` conforme solicitado pelo CEO.
2. Insira cada uma das chaves listadas acima.

---
**Status da Infraestrutura:**
- **Plausible Analytics:** Script injetado no `index.html`.
- **WhatsApp Webhook:** Função criada em `supabase/functions/whatsapp-callback`.
- **Endpoints VPS:** DNS propagado para `2.24.69.154`.
