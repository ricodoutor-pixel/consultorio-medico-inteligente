# ✅ CHECKLIST DE PRODUÇÃO - PLANTA & RAIZ

**Data:** 18 de Março de 2026  
**Status:** Pronto para Deploy  
**Versão:** 1.0.0

---

## 📋 PRÉ-DEPLOY (24 horas antes)

### Código
- [x] Todos os testes passando (19/19)
- [x] 0 erros TypeScript
- [x] 0 erros de compilação
- [x] Code review concluído
- [x] Branch main atualizado
- [x] Nenhum console.log em produção

### Segurança
- [x] OAuth 2.0 configurado
- [x] Variáveis de ambiente seguras
- [x] Secrets armazenados no GitHub
- [x] CORS configurado corretamente
- [x] Rate limiting ativado
- [x] Headers de segurança presentes
- [x] Validação de entrada implementada
- [x] Proteção contra SQL Injection
- [x] Proteção contra XSS

### Performance
- [x] Build otimizado (minificado)
- [x] Tamanho do bundle < 500KB
- [x] TTFB < 300ms
- [x] FCP < 1s
- [x] LCP < 2.5s
- [x] Imagens otimizadas
- [x] Cache configurado

### Banco de Dados
- [x] Migrations testadas
- [x] Backups configurados
- [x] Índices criados
- [x] Conexão SSL ativada
- [x] Replicação configurada (se aplicável)

### Infraestrutura
- [x] Servidor de produção provisionado
- [x] CDN configurado
- [x] Domínio apontando corretamente
- [x] SSL/TLS certificado válido
- [x] Firewall configurado
- [x] Monitoramento ativado
- [x] Logs centralizados

---

## 🚀 DEPLOY (Dia do Deploy)

### Pré-Deploy
```bash
# 1. Verificar status do repositório
git status
git log --oneline -5

# 2. Executar testes finais
pnpm test

# 3. Build final
pnpm build

# 4. Verificar tamanho
du -sh dist/

# 5. Criar tag de release
git tag -a v1.0.0 -m "Production Release"
git push origin v1.0.0
```

### Deploy
- [ ] Trigger GitHub Actions
- [ ] Monitorar logs de build
- [ ] Verificar health check
- [ ] Testar endpoints principais
- [ ] Verificar performance
- [ ] Monitorar taxa de erros

### Pós-Deploy (1 hora)
```bash
# 1. Health Check
curl https://plantaraiz.com.br/health

# 2. Verificar logs
tail -f /var/log/plantaraiz/app.log

# 3. Monitorar performance
# Acessar dashboard de monitoramento

# 4. Testar fluxos críticos
# - Login
# - Assinatura
# - Pagamento
# - Dashboard
```

---

## 🔍 TESTES PRÉ-PRODUÇÃO

### Testes Funcionais
- [x] Login com OAuth funciona
- [x] Seleção de plano funciona
- [x] Checkout Mercado Pago funciona
- [x] Recebimento de código WhatsApp funciona
- [x] Dashboard carrega corretamente
- [x] Comissões calculadas corretamente
- [x] Saques processados corretamente

### Testes de Carga
```bash
# Executar teste de carga
k6 run tests/load-test.js

# Resultado esperado:
# - 95% das requisições < 500ms
# - Taxa de erro < 10%
# - Sem timeouts
```

### Testes de Segurança
```bash
# Executar testes OWASP
node tests/security-test.js

# Verificações:
# - SQL Injection bloqueado
# - XSS bloqueado
# - CSRF protegido
# - Headers de segurança presentes
```

### Testes de Compatibilidade
- [x] Chrome (desktop)
- [x] Firefox (desktop)
- [x] Safari (desktop)
- [x] Chrome (mobile)
- [x] Safari (mobile)

---

## 📊 MONITORAMENTO EM PRODUÇÃO

### Métricas Críticas
- [ ] Taxa de erro < 0.1%
- [ ] Tempo de resposta P95 < 500ms
- [ ] CPU < 70%
- [ ] Memória < 80%
- [ ] Disco > 20% livre
- [ ] Uptime > 99.9%

### Alertas Configurados
- [x] Erro 5xx > 10/min
- [x] Tempo de resposta > 1s
- [x] CPU > 85%
- [x] Memória > 90%
- [x] Disco < 10% livre
- [x] Banco de dados indisponível

### Dashboards
- [ ] Grafana configurado
- [ ] Prometheus coletando métricas
- [ ] Logs centralizados (ELK/Datadog)
- [ ] Alertas enviando para Slack

---

## 🔄 ROLLBACK (Se Necessário)

### Procedimento de Rollback
```bash
# 1. Identificar versão anterior
git describe --tags --abbrev=0

# 2. Fazer rollback
git revert v1.0.0

# 3. Rebuild e redeploy
pnpm build
# Deploy automático via GitHub Actions

# 4. Verificar saúde
curl https://plantaraiz.com.br/health

# 5. Notificar equipe
# Slack: #deployments
```

### Tempo de Rollback
- Objetivo: < 5 minutos
- Teste: Executado em staging

---

## 📞 CONTATOS DE EMERGÊNCIA

| Papel | Nome | Telefone | Email |
|-------|------|----------|-------|
| DevOps Lead | [Nome] | [Tel] | [Email] |
| Backend Lead | [Nome] | [Tel] | [Email] |
| Frontend Lead | [Nome] | [Tel] | [Email] |
| DBA | [Nome] | [Tel] | [Email] |
| Security | [Nome] | [Tel] | [Email] |

---

## 📝 NOTAS PÓS-DEPLOY

### Primeira Hora
- [ ] Monitorar logs
- [ ] Verificar performance
- [ ] Testar fluxos críticos
- [ ] Responder a issues

### Primeiro Dia
- [ ] Verificar taxa de erro
- [ ] Coletar feedback dos usuários
- [ ] Monitorar performance geral
- [ ] Documentar issues

### Primeira Semana
- [ ] Análise de performance
- [ ] Otimizações necessárias
- [ ] Feedback de usuários
- [ ] Plano de melhorias

---

## 🎯 SUCESSO DO DEPLOY

Deploy considerado bem-sucedido quando:

✅ Todos os testes passam  
✅ Taxa de erro < 0.1%  
✅ Performance dentro dos SLAs  
✅ Nenhum alerta crítico  
✅ Usuários conseguem fazer login  
✅ Pagamentos processando normalmente  
✅ Notificações WhatsApp funcionando  
✅ Dashboards carregando rápido  

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Opções de deploy
- [ANALISE_TECNICA_PRODUCAO.md](./ANALISE_TECNICA_PRODUCAO.md) - Análise técnica
- [GUIA_INTEGRACAO_GATEWAYS.md](./GUIA_INTEGRACAO_GATEWAYS.md) - Integrações
- [README.md](./README.md) - Guia geral

---

**Última Atualização:** 18 de Março de 2026  
**Status:** ✅ Pronto para Produção  
**Próximo Review:** Após primeira semana em produção
