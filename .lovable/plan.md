## Plano de execução — 3 correções críticas da auditoria

### 1. SEO: Prerender estático das páginas (corrige "invisível no Google")
**Problema:** SPA puro — Google recebe HTML vazio nas 40+ páginas de tratamento.

**Solução:** Adicionar **prerender em build-time** usando `vite-plugin-prerender-spa` (puppeteer headless). O build atual (`vite build`) continua igual; após gerar o `dist/`, o plugin "navega" em cada rota listada e salva um `index.html` com o conteúdo já renderizado dentro de `dist/tratamentos/epilepsia/index.html`, etc.

Rotas prerenderizadas (alta intenção SEO):
- `/`, `/como-funciona`, `/profissionais`, `/shopping`, `/faq`, `/precos`, `/planos`, `/club`
- `/tratamentos` + todas as 12 sub-rotas (`/tratamentos/epilepsia`, `/autismo`, `/parkinson`, `/dor-cronica`, `/ansiedade`, `/insonia`, `/fibromialgia`, `/esclerose-multipla`, `/tdah`, `/depressao`, `/tratamento-dor-cronica`, `/tratamento-ansiedade-saude-mental`)
- `/blog`, `/biblioteca`, `/ebook`, `/contato`, `/legal`

Rotas dinâmicas (login, dashboard, /pay, /carteira) **não** são prerenderizadas — continuam SPA puro.

**Resultado:** Googlebot recebe HTML completo com H1, descrição, sintomas, estudos clínicos, FAQ — tudo indexável. Tempo estimado para top 3 do Google em keywords como "cannabis medicinal epilepsia": 30–60 dias.

### 2. Loop viral pós-orientação (Planta-Coins + indicação)
**Problema:** Sistema de afiliados existe mas não aparece de forma proeminente após orientação.

**Solução:** Após o paciente concluir a sessão (página `PaymentSuccess` ou `Prontuario` pós-consulta), exibir um **card celebratório** automático:

> 🎉 Você ganhou **R$15 em Planta-Coins** por concluir sua orientação!
> Indique 1 amigo e ganhe **+R$10 extras** quando ele fizer a primeira orientação.
> [Copiar link de indicação] [Enviar pelo WhatsApp]

Componente novo: `PostConsultationViralLoop.tsx` — usa o sistema de afiliados existente (`useReferralTracking`), gera link personalizado, integra com WhatsApp Web (`wa.me/?text=...`).

### 3. Avaliação Google automática via Brisa WhatsApp
**Problema:** GMB sem fluxo ativo de coleta de reviews.

**Solução:** Adicionar trigger no edge function de finalização de orientação (`brisa-post-consultation` ou similar) que envia, **24h após a sessão**, mensagem via Twilio:

> Olá [nome]! Como foi sua orientação com o Dr. Edilson? 💚
> Se ajudou, você pode deixar uma avaliação no Google em 30 segundos: https://g.page/r/[review-id]/review

Implementação: cron job `nps-and-google-review-cron` (pg_cron diário) que busca orientações concluídas há 24h sem review enviada, dispara Twilio, marca `google_review_requested_at`.

### Detalhes técnicos
- `vite-plugin-prerender-spa` instalado como devDependency
- Hook `vite.config.ts` no array de plugins (somente em mode='production')
- `react-helmet-async` já está em uso → metadados ficam corretos no HTML prerenderizado
- Schema.org JSON-LD existente (`SearchEngineOptimization.tsx`) também é capturado
- Tabela `consultations` ganha coluna `google_review_requested_at TIMESTAMPTZ`
- Para o loop viral, reuso de `src/hooks/useReferralTracking.ts` (já existe)

### Ordem de execução
1. Prerender (maior impacto, sem risco visual)
2. Loop viral pós-orientação (componente novo na tela de sucesso)
3. Cron Google Review (migration + edge function)

**O que NÃO mudo:** zero alterações visuais nas páginas existentes (memória `no-visual-changes`). Fluxo de pagamento e Brisa intactos.