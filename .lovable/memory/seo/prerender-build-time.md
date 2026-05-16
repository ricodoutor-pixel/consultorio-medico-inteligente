---
name: SEO Prerender Build-Time
description: Script postbuild que gera HTML estático para Googlebot nas páginas de tratamento e principais rotas SEO
type: feature
---
Após `vite build`, o script `scripts/prerender-seo.ts` (rodado via `postbuild` no package.json) gera HTML estático em `dist/<rota>/index.html` para:

- Páginas de tratamento: `/tratamentos/{ansiedade,dor-cronica,epilepsia,insonia,depressao,fibromialgia,parkinson,autismo,esclerose-multipla,tdah}`
- Páginas estáticas principais: `/`, `/como-funciona`, `/precos`, `/faq`, `/shopping`, `/tratamentos`

Cada HTML estático contém: `<title>`, `<meta description>`, `<link canonical>`, `<meta og:*>` per-route, Schema.org `MedicalWebPage`, e conteúdo SEO (H1, parágrafos, listas, FAQ) dentro de `<div id="root">`. React's `createRoot` substitui esse conteúdo na hidratação — usuário vê SPA normal, Googlebot vê HTML completo.

**Não usa puppeteer/SSR** — apenas data → string templates. Funciona no build da Hostinger sem dependências pesadas.

Para adicionar nova rota: editar `STATIC_PAGES` ou `TREATMENTS` em `scripts/prerender-seo.ts`.
