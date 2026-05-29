---
name: Deployment Pipeline
description: Cloudflare Pages é o deploy oficial. Hostinger workflow desativado (causava auto-revert em failure).
type: feature
---

**Produção atual:** Cloudflare Pages (`server: cloudflare`, 234ms, status 200).
- Workflow ativo: `.github/workflows/deploy-cloudflare-pages.yml`
- Domínio: www.plantayraiz.com.br (CF DNS proxy ON)

**Hostinger workflow DESATIVADO** (`.github/workflows/deploy-hostinger.yml.disabled`):
- Motivo: falhas frequentes no FTP/smoke test
- Risco crítico removido: tinha `git revert HEAD` no `failure()` que revertia commits bons a cada falha
- Hostinger continua hospedando: nada (só Hospedagem Web vazia agora)

**Próximo passo:** Após VPS Oracle no ar (`docs/ORACLE_VM_DEPLOY.md`), apontar `api.plantayraiz.com.br` e `bot.plantayraiz.com.br` para a VM e cancelar VPS Hostinger.
