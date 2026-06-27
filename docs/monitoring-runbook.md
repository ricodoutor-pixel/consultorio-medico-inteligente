# Runbook de monitoramento contínuo

## Objetivo
Manter o sistema monitorado sem alterar a interface.

## Comandos recomendados
- `bash scripts/monitor-health.sh`
- `curl -fsS https://plantayraiz.com.br/health`

## Ações em caso de falha
1. Verificar se o site responde.
2. Conferir logs do servidor e do workflow.
3. Revisar se há mudança recente no deploy.
4. Usar rollback se necessário.
