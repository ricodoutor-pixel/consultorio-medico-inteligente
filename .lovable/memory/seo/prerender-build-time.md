---
name: SEO Prerender Build-Time (DESATIVADO)
description: Script de prerender SEO existe mas NÃO roda no build — causou tela preta em produção
type: feature
---

**Status:** DESATIVADO em 17/05/2026.

O script `scripts/prerender-seo.ts` gera HTML estático para 16 rotas em `dist/` injetando conteúdo SEO dentro de `<div id="root">`. Em produção (Hostinger), quando o React não conseguia hidratar/substituir esse conteúdo (bundle JS atrasado ou falha), o usuário ficava vendo apenas o texto SEO numa tela preta ("Orientação Técnica de Cannabis Medicinal — Dr. Edilson Bezerra...").

**Mudança:** o hook `postbuild` em `package.json` foi renomeado para `prerender:seo` (manual). O `vite build` agora produz apenas o SPA padrão. Para rodar o prerender manualmente: `bun run prerender:seo` após o build.

**Para reativar com segurança:** garantir que o bundle JS sempre carrega antes ou usar SSR real (Vite SSR / TanStack Start). Não reativar como `postbuild` sem testar produção.
