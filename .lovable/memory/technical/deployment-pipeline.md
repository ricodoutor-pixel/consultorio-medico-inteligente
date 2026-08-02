---
name: Deployment Pipeline
description: Hostinger (auto-deploy do GitHub main) é o único deploy oficial do frontend. Cloudflare Pages e workflow Hostinger antigo estão desativados.
type: feature
---

**Fonte única de verdade (02/08/2026):**
- Código: repositório GitHub, branch `main` (publish do Lovable → commit em `main`).
- Frontend em produção: **Hostinger** (Node.js app com auto-deploy do repo) servindo `www.plantayraiz.com.br`. DNS/domínio na Hostinger.
- Backend: Supabase Edge Functions (deploy imediato, independente do frontend).

**Workflows desativados (não reativar sem decisão formal):**
- `.github/workflows/deploy-cloudflare-pages.yml.disabled` — causava duas versões do site no ar/confusão de cache.
- `.github/workflows/deploy-hostinger.yml.disabled` — tinha `git revert HEAD` em `failure()`.

**Checklist quando o site no ar difere do ambiente de trabalho:**
1. Publicar no Lovable (gera commit em `main`).
2. Hostinger → hPanel → app Node.js → "Reimplantar" (ou confirmar deploy automático concluído).
3. Hostinger → Limpar cache (LiteSpeed/CDN).
4. Ctrl+Shift+R no navegador; se persistir, subir `CACHE_VERSION` em `public/sw.js`.
NÃO recriar o site do zero — o problema é sempre cache/deploy duplicado, nunca o código.
