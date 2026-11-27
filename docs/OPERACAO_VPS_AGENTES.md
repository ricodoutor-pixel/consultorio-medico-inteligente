# Operação da VPS para todos os agentes

Atualizado em 27/11/2026 a partir das instruções enviadas pelo Dr. Edilson. Este documento define o caminho de trabalho; não comprova, por si só, o estado atual dos processos remotos.

## Regra principal

O agente que recebe uma falha operacional deve conduzi-la até a solução pelos acessos disponíveis, sem transferir a tarefa a outro agente nem pedir que o Dr. Edilson execute comandos. Responder em português simples e relatar apenas o que foi confirmado.

## Servidor e serviços

- Hostinger, VPS `srv2036020`, IP `179.236.244.168`, usuário `root`.
- Projeto em `/opt/plantayraiz`; processos gerenciados pelo PM2 com `ecosystem.config.cjs`.
- Processos autorizados: `brisa-live-responder`, `doctor-kyc-listener`, `sysadmin-watchdog`, `partner-meeting-scheduler`, `organic-analytics-reporter`, `email-bounce-guardian`, `brevo-multi-pipeline` e `brevo-whatsapp-inviter`.
- WhatsApp: Evolution API em `whatsapp.plantayraiz.com.br`, instância `plantayraiz`; automação n8n em contêiner Docker.
- Código: GitHub `ricodoutor-pixel/consultorio-medico-inteligente`, branch `main`.
- Banco e funções do site: somente o Lovable Cloud oficial vinculado ao projeto.

A lista acima não revoga as travas de `ecosystem.config.cjs`: processos legados em `DESLIGADOS` continuam desligados e o watchdog não pode religá-los.

## Caminho 1 — GitHub e atualização automática

Este é o caminho usado pelo Lovable e está disponível para todos os agentes com acesso ao repositório.

1. A VPS executa `/root/auto-deploy.sh` a cada cinco minutos.
2. O script baixa a `main`, executa `pm2 startOrReload` e `pm2 save`; se `package.json` mudar, executa `npm install`.
3. Para corrigir, alterar o código, rodar os testes e enviar o commit à `main`. No Lovable, o commit é enviado pela plataforma ao final da entrega.
4. A atualização é esperada em até cinco minutos após o commit chegar à `main`; confirmar pelo registro `/var/log/plantayraiz-autodeploy.log` quando houver acesso remoto.
5. Para desfazer uma alteração defeituosa, usar um novo commit de reversão. Nunca usar `push --force`.
6. Se o registro informar `PULADO: alteracoes locais na VPS`, inspecionar as mudanças locais por um dos acessos remotos e incorporá-las ao GitHub antes de continuar.

O Lovable não executa SSH na VPS. Quando uma automação precisa ser alterada, o Lovable entrega e confirma o commit; a atualização automática faz a implantação. Não pedir comandos manuais ao Dr. Edilson.

## Caminho 2 — SSH no computador autorizado

Claude Code no VS Code e Antigravity podem usar o terminal do computador do Dr. Edilson:

```bash
ssh root@179.236.244.168
```

Se for necessário criar uma chave, usar `ssh-keygen -t ed25519 -C "agentes-plantayraiz"`; gerar sem senha somente com concordância do proprietário. Exibir apenas a chave pública (`.pub`). Nunca mostrar, copiar ou enviar a chave privada.

## Caminho 3 — Console web da Hostinger

No hPanel, abrir VPS `srv2036020` → Console web. Esse caminho fornece terminal root ao agente que estiver autorizado a operar o navegador.

## Comandos de diagnóstico e emergência para agentes com acesso remoto

```bash
cd /opt/plantayraiz
pm2 ls
pm2 logs NOME --lines 50 --nostream
pm2 restart NOME
pm2 stop NOME && pm2 save
pm2 startOrReload ecosystem.config.cjs --update-env && pm2 save
git log -5 --oneline
git status
tail -n 30 /var/log/plantayraiz-autodeploy.log
docker ps
```

Esses comandos são instruções para o agente com acesso, não uma solicitação para o Dr. Edilson executá-los.

## Regras permanentes

1. Primeiro estancar, depois corrigir: se um processo estiver enviando mensagens erradas ou em massa, pará-lo imediatamente pelo acesso remoto disponível e só depois investigar.
2. Toda correção definitiva vai para o GitHub; alterações feitas somente no servidor se perdem e podem travar a atualização automática.
3. Segredos ficam apenas no `.env` da VPS e nos segredos do backend. Nunca escrever segredos em chat, commits, logs ou capturas de tela. O repositório é público.
4. Não apagar dados de pacientes, tabelas ou backups. Migrações somente aditivas.
5. Manter a identidade `Enfª Brisa, assistente virtual`; mensagens a médicos são assinadas `Enfª Brisa, marketing médico`.
6. Alterar somente o que foi pedido ou o que está comprovadamente quebrado; não mudar o restante da plataforma.
7. Ao terminar, informar em português: o problema, a correção, a evidência de funcionamento e o commit.
8. Distinguir sempre entre configuração fornecida, commit disponível e estado remoto confirmado. Não afirmar que a VPS atualizou sem evidência do deploy ou do processo em execução.
