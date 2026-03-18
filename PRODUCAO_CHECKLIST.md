# ✅ CHECKLIST DE PRODUÇÃO - PLANTA & RAIZ 2026-2030

## 📋 PRÉ-DEPLOYMENT

### Configuração de Credenciais
- [ ] Mercado Pago API Key configurada
- [ ] Mercado Pago Public Key configurada
- [ ] Twilio Account SID configurado
- [ ] Twilio Auth Token configurado
- [ ] Twilio WhatsApp Number configurado
- [ ] Jitsi Domain configurado
- [ ] Google Maps API Key configurada
- [ ] Clicksign API Key configurada
- [ ] Database URL configurada
- [ ] Redis URL configurada
- [ ] JWT Secret configurado
- [ ] Session Secret configurado
- [ ] Manus OAuth configurado

### Validação de Credenciais
```bash
bash scripts/validate-credentials.sh
```
- [ ] Todas as credenciais validadas

### Testes
```bash
npm run test
npm run test:e2e:consultation
npm run test:integration
```
- [ ] Testes unitários passando
- [ ] Testes E2E passando
- [ ] Testes de integração passando

### Build
```bash
npm run build
```
- [ ] Build sem erros
- [ ] Build size < 500MB
- [ ] Todos os arquivos compilados

---

## 🚀 DEPLOYMENT

### Escolher Plataforma
- [ ] Vercel
- [ ] Railway
- [ ] Render
- [ ] Docker
- [ ] Outra: ___________

### Deploy
```bash
bash scripts/deploy.sh
```
- [ ] Deploy iniciado
- [ ] Deploy completado
- [ ] Domínio apontando corretamente

### Verificação Pós-Deploy
```bash
bash scripts/smoke-tests.sh
```
- [ ] Health check passando
- [ ] API respondendo
- [ ] Database conectado
- [ ] Redis conectado
- [ ] Prometheus ativo
- [ ] Grafana ativo

---

## 🔐 SEGURANÇA

### SSL/TLS
- [ ] Certificado SSL ativo
- [ ] HTTPS forçado
- [ ] HSTS header configurado

### Headers de Segurança
- [ ] Content-Security-Policy configurado
- [ ] X-Frame-Options configurado
- [ ] X-Content-Type-Options configurado
- [ ] Referrer-Policy configurado

### CORS
- [ ] CORS configurado para domínio correto
- [ ] Credenciais CORS habilitadas se necessário

### Rate Limiting
- [ ] Rate limiting ativo
- [ ] Limites apropriados configurados

### Backup & Disaster Recovery
- [ ] Backup automático configurado
- [ ] Retenção de backup definida
- [ ] Plano de recuperação documentado

---

## 📊 MONITORAMENTO

### Prometheus
- [ ] Prometheus rodando
- [ ] Scrape interval configurado
- [ ] Alertas configurados

### Grafana
- [ ] Grafana rodando
- [ ] Dashboards importados
- [ ] Alertas configurados

### Logs
- [ ] ELK Stack rodando (opcional)
- [ ] Logs sendo coletados
- [ ] Retenção de logs definida

### Alertas
- [ ] CPU > 80% alerta
- [ ] Memória > 85% alerta
- [ ] Taxa de erro > 1% alerta
- [ ] Latência P95 > 500ms alerta
- [ ] Downtime > 5 min alerta

---

## 🔄 INTEGRAÇÕES

### Mercado Pago
- [ ] Webhook configurado
- [ ] Pagamentos testados
- [ ] Assinaturas testadas
- [ ] Comissões testadas

### Twilio
- [ ] WhatsApp testado
- [ ] SMS testado
- [ ] Verificação de código testada
- [ ] Notificações testadas

### Jitsi
- [ ] Vídeo consulta testada
- [ ] Gravação testada
- [ ] Áudio/Vídeo funcionando

### Clicksign
- [ ] Documento criado testado
- [ ] Assinatura testada
- [ ] Download testado

### Google Maps
- [ ] Mapa carregando
- [ ] Busca funcionando
- [ ] Geocoding funcionando

---

## 📱 TESTES FUNCIONAIS

### Fluxo de Usuário
- [ ] Registro de paciente
- [ ] Verificação de e-mail
- [ ] Verificação de WhatsApp
- [ ] Login funcionando

### Fluxo de Pagamento
- [ ] Escolher plano
- [ ] Ir para checkout
- [ ] Pagamento processado
- [ ] Confirmação recebida

### Fluxo de Consulta
- [ ] Agendar consulta
- [ ] Consentimento assinado
- [ ] Entrar em vídeo consulta
- [ ] Consulta gravada
- [ ] Follow-up agendado

### Fluxo de Afiliado
- [ ] Gerar link de afiliado
- [ ] Rastrear referências
- [ ] Comissão calculada
- [ ] Saque processado

---

## 📈 PERFORMANCE

### Métricas Alvo
- [ ] TTFB < 200ms
- [ ] FCP < 500ms
- [ ] LCP < 1.2s
- [ ] P95 Latência < 500ms
- [ ] Taxa de erro < 0.1%
- [ ] Uptime > 99.9%

### Teste de Carga
```bash
npm run test:load
```
- [ ] Teste de carga passando
- [ ] 100+ usuários simultâneos
- [ ] Sem degradação significativa

### Otimização
- [ ] Compressão gzip ativa
- [ ] Cache de assets configurado
- [ ] CDN configurado (se aplicável)
- [ ] Imagens otimizadas

---

## 📚 DOCUMENTAÇÃO

- [ ] README.md atualizado
- [ ] GUIA_DEPLOY_PRODUCAO.md completo
- [ ] PRODUCAO_CHECKLIST.md completo
- [ ] API documentation atualizado
- [ ] Runbook de operações criado
- [ ] Plano de rollback documentado

---

## 👥 COMUNICAÇÃO

- [ ] Time notificado sobre deploy
- [ ] Clientes notificados sobre lançamento
- [ ] Suporte treinado
- [ ] Documentação compartilhada
- [ ] Contato de emergência definido

---

## 🎯 SIGN-OFF

| Papel | Nome | Data | Assinatura |
|-------|------|------|-----------|
| DevOps | _____________ | _______ | _____________ |
| QA | _____________ | _______ | _____________ |
| Product | _____________ | _______ | _____________ |
| CEO | _____________ | _______ | _____________ |

---

## 📞 CONTATOS DE EMERGÊNCIA

**DevOps Lead:** ________________  
**Phone:** ________________  
**Email:** ________________  

**Database Admin:** ________________  
**Phone:** ________________  
**Email:** ________________  

**Security Lead:** ________________  
**Phone:** ________________  
**Email:** ________________  

---

## 📝 NOTAS

```
[Espaço para notas adicionais]




```

---

## 🎉 DEPLOYMENT APPROVED

**Data:** _______________  
**Versão:** _______________  
**Ambiente:** Production  
**Status:** ✅ READY FOR PRODUCTION

---

**Próximo Passo:** Monitorar aplicação por 24h após deployment
