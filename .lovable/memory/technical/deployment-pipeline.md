---
name: Deployment Pipeline
description: GitHub main atualiza o frontend e os robôs da Hostinger; o Lovable entrega commits sem pedir comandos manuais ao proprietário.
type: feature
---

**Fonte única de verdade (27/11/2026):**
- Código: repositório GitHub `ricodoutor-pixel/consultorio-medico-inteligente`, branch `main`.
- Frontend em produção: Hostinger servindo `www.plantayraiz.com.br`; DNS e domínio na Hostinger.
- Automações: VPS `srv2036020`, projeto `/opt/plantayraiz`, processos PM2 definidos em `ecosystem.config.cjs`.
- Backend: somente o Lovable Cloud oficial; funções são publicadas separadamente do frontend.

**Atualização automática informada pelo proprietário:**
- `/root/auto-deploy.sh` roda na VPS a cada cinco minutos, baixa a `main`, executa `pm2 startOrReload` e `pm2 save` e roda `npm install` quando `package.json` muda.
- No Lovable, a correção é entregue por commit; a plataforma envia o commit ao repositório ao final da entrega. Não pedir que o Dr. Edilson execute comandos.
- O commit disponível não comprova deploy concluído. Quando houver acesso remoto autorizado, confirmar `/var/log/plantayraiz-autodeploy.log` e os processos PM2.
- Se o log informar `PULADO: alteracoes locais na VPS`, inspecionar e incorporar as alterações locais ao GitHub antes de continuar.
- Para desfazer, criar commit de reversão; nunca usar `push --force`.

**Limites operacionais:**
- O Lovable não executa SSH na VPS. Os caminhos remotos autorizados e os comandos de emergência estão em `docs/OPERACAO_VPS_AGENTES.md`.
- Processos em `DESLIGADOS` no `ecosystem.config.cjs` não podem ser religados pelo deploy ou pelo watchdog.
- Workflows antigos de Cloudflare Pages e Hostinger permanecem desativados; não reativar sem decisão formal.

**Quando o site publicado divergir:**
1. Confirmar que o commit chegou à `main`.
2. Confirmar a conclusão do auto-deploy por evidência remota, sem presumir sucesso apenas pelo commit.
3. Limpar cache LiteSpeed/CDN quando necessário e recarregar sem cache.
4. Se o problema for apenas cache do service worker, ajustar `CACHE_VERSION` em `public/sw.js` sem forçar reload durante atendimento ou pagamento.

Não recriar o site nem trocar o backend para contornar cache ou divergência de deploy.
