# Checklist de deploy e rollback

## Pré-deploy
- [ ] Validar ambiente com `getEnvValidationIssues`
- [ ] Confirmar conexão com banco e serviços críticos
- [ ] Revisar logs estruturados e alertas básicos
- [ ] Validar build local

## Deploy
- [ ] Executar `npm run validate:env`
- [ ] Executar `npm run deploy:check`
- [ ] Publicar versão com tag semântica
- [ ] Confirmar health check do sistema
- [ ] Validar integrações de pagamento, autenticação e WhatsApp

## Rollback
- [ ] Executar `bash scripts/rollback.sh <commit-or-tag>`
- [ ] Restaurar variáveis de ambiente se necessário
- [ ] Confirmar recuperação do sistema
