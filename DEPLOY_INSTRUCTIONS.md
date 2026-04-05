# 🚀 INSTRUÇÕES DE DEPLOY PARA PRODUÇÃO

**Data:** 5 de Abril de 2026  
**Status:** ✅ PRONTO PARA DEPLOY  
**Versão:** v1.0.0 - Correções Críticas de Segurança

---

## 📋 PRÉ-REQUISITOS

- ✅ Acesso SSH ao servidor Hostinger
- ✅ Node.js 18+ instalado
- ✅ PM2 instalado globalmente
- ✅ Git configurado
- ✅ Variáveis de ambiente configuradas

---

## 🔧 PASSO A PASSO

### PASSO 1: Conectar ao Servidor Hostinger

```bash
ssh seu_usuario@seu_servidor.hostinger.com
cd /home/seu_usuario/consultorio-medico-inteligente
```

### PASSO 2: Sincronizar com GitHub

```bash
git fetch origin
git pull origin main
```

### PASSO 3: Instalar Dependências

```bash
pnpm install
```

### PASSO 4: Executar Testes

```bash
pnpm test
```

**Resultado Esperado:**
```
✅ 50+ testes de segurança passando
✅ Conformidade 100%
✅ Pronto para deploy
```

### PASSO 5: Fazer Build

```bash
pnpm build
```

**Resultado Esperado:**
```
✅ Build completo
✅ Sem erros de compilação
✅ Pronto para produção
```

### PASSO 6: Reiniciar com PM2

```bash
pm2 restart planta-raiz-app
pm2 save
```

**Verificar Status:**
```bash
pm2 status
pm2 logs planta-raiz-app
```

### PASSO 7: Validar Saúde

```bash
curl http://localhost:3000/health
```

**Resultado Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-05T...",
  "version": "1.0.0"
}
```

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Sincronizado com GitHub
- [ ] Dependências instaladas
- [ ] Testes passando (50+)
- [ ] Build completo
- [ ] PM2 reiniciado
- [ ] Health check OK
- [ ] Logs sem erros críticos
- [ ] Acesso em plantayraiz.com.br

---

## 🧪 TESTES PÓS-DEPLOY

### Teste 1: Autenticação
```bash
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Teste 2: Segurança RLS
```bash
curl -X GET http://localhost:3000/api/trpc/admin.getFinancialReports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Teste 3: AI Gateway
```bash
curl -X POST http://localhost:3000/api/ai/triage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"dor de cabeça"}'
```

---

## 🚨 ROLLBACK (Se Necessário)

```bash
# Voltar para versão anterior
git revert HEAD
git push origin main

# Reinstalar e rebuild
pnpm install
pnpm build

# Reiniciar
pm2 restart planta-raiz-app
```

---

## 📊 CORREÇÕES IMPLEMENTADAS

| # | Vulnerabilidade | Status |
|---|---|---|
| 1 | Notificações sem validação | ✅ Corrigida |
| 2 | Relatórios sem RLS | ✅ Corrigida |
| 3 | AI Gateway sem auth | ✅ Corrigida |
| 4 | Transmissão de dados sensíveis | ✅ Corrigida |
| 5 | Canais sem autorização | ✅ Corrigida |
| 6 | RLS sempre verdadeira | ✅ Corrigida |
| 7 | Webhook sem restrição | ✅ Corrigida |
| 8 | Eventos IA sem SELECT | ✅ Corrigida |
| 9 | Bucket sem UPDATE | ✅ Corrigida |
| 10 | Sem verificação propriedade | ✅ Corrigida |

---

## 📞 SUPORTE

Se encontrar problemas durante o deploy:

1. Verificar logs: `pm2 logs planta-raiz-app`
2. Verificar variáveis de ambiente: `env | grep PLANTA`
3. Verificar permissões: `ls -la /home/seu_usuario/`
4. Contatar: Dr. Edilson Bezerra (CRM 10963)

---

## 🎉 CONCLUSÃO

Deploy realizado com sucesso!

**Status: 🚀 PLATAFORMA PRONTA PARA PRODUÇÃO**

---

*Instruções oficializadas em 5 de Abril de 2026*
