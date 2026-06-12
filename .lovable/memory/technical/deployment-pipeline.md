---
name: Deployment Pipeline
description: Cloudflare Pages é o deploy oficial. Hostinger workflow desativado (causava auto-revert em failure).
type: feature
---

**Produção atual:** Cloudflare Pages no frontend + Railway no runtime do WhatsApp/Evolution.
- Workflow ativo: `.github/workflows/deploy-cloudflare-pages.yml`
- Domínio: www.plantayraiz.com.br (CF DNS proxy ON)
- Endpoint operacional do WhatsApp: `https://api-whatsapp.plantayraiz.com.br/manager/`

**Hostinger workflow DESATIVADO** (`.github/workflows/deploy-hostinger.yml.disabled`):
- Motivo: falhas frequentes no FTP/smoke test
- Risco crítico removido: tinha `git revert HEAD` no `failure()` que revertia commits bons a cada falha
- Hostinger continua hospedando: nada (só Hospedagem Web vazia agora)

**Regra atual:** não usar mais Oracle/Hostinger VPS para o fluxo Brisa. A operação do WhatsApp deve considerar Railway como origem da Evolution até nova decisão formal.
