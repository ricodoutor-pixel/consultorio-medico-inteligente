# 🚀 GUIA DE DEPLOYMENT
## Planta & Raiz 2026-2030

**Versão:** 0c724abc  
**Data:** 18 de Março de 2026  
**Status:** Pronto para Produção

---

## 📋 Pré-Requisitos

- Git configurado com credenciais GitHub
- Docker e Docker Compose instalados
- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 8.0+ (ou usar Docker)
- Redis 7+ (ou usar Docker)

---

## 🏗️ Opção 1: Deploy Local com Docker Compose

### 1. Clonar Repositório

```bash
git clone https://github.com/ricodoutor-pixel/consultorio-m-dico-inteligente.git
cd consultorio-m-dico-inteligente
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
nano .env
```

### 3. Iniciar Containers

```bash
# Build e start
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### 4. Executar Migrations

```bash
# Dentro do container
docker-compose exec app pnpm drizzle-kit migrate

# Ou localmente
pnpm drizzle-kit migrate
```

### 5. Acessar Aplicação

- **Frontend:** http://localhost:3000
- **PhpMyAdmin:** http://localhost:8080
- **Redis Commander:** http://localhost:8081

### 6. Parar Containers

```bash
docker-compose down

# Com volume cleanup
docker-compose down -v
```

---

## 🏗️ Opção 2: Deploy em Manus Cloud

### 1. Fazer Push para GitHub

```bash
git add .
git commit -m "Deploy para produção"
git push origin main
```

### 2. Configurar no Manus Dashboard

1. Acessar https://manus.im/dashboard
2. Criar novo projeto "Planta & Raiz"
3. Conectar repositório GitHub
4. Configurar branch: `main`
5. Adicionar variáveis de ambiente (secrets)

### 3. Configurar Secrets

No Manus Dashboard, adicionar:

```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=seu_secret_aqui
MERCADO_PAGO_ACCESS_TOKEN=token
TWILIO_ACCOUNT_SID=sid
TWILIO_AUTH_TOKEN=token
TWILIO_WHATSAPP_NUMBER=whatsapp:+55...
```

### 4. Fazer Deploy

```bash
# Manus faz deploy automático ao fazer push para main
# Ou manualmente no dashboard:
# Click em "Deploy" → "Deploy to Production"
```

### 5. Monitorar Deploy

```bash
# Ver logs em tempo real
manus logs planta-raiz-web

# Ver status
manus status planta-raiz-web

# Ver métricas
manus metrics planta-raiz-web
```

---

## 🏗️ Opção 3: Deploy em Vercel

### 1. Conectar Repositório

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 2. Configurar Variáveis

No Vercel Dashboard:
- Settings → Environment Variables
- Adicionar todas as variáveis do `.env.example`

### 3. Configurar Build

```bash
# vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### 4. Deploy Automático

Vercel faz deploy automático ao fazer push para main.

---

## 🏗️ Opção 4: Deploy em Railway

### 1. Conectar Repositório

1. Acessar https://railway.app
2. Click em "New Project"
3. Selecionar "Deploy from GitHub"
4. Autorizar e selecionar repositório

### 2. Adicionar Serviços

```bash
# MySQL
railway add mysql

# Redis
railway add redis
```

### 3. Configurar Variáveis

```bash
# No Railway Dashboard
DATABASE_URL=${{ Mysql.DATABASE_URL }}
REDIS_URL=${{ Redis.REDIS_URL }}
JWT_SECRET=seu_secret
```

### 4. Deploy

```bash
# Railway faz deploy automático
# Ou manualmente:
railway deploy
```

---

## 🏗️ Opção 5: Deploy em Render

### 1. Conectar Repositório

1. Acessar https://render.com
2. Click em "New +"
3. Selecionar "Web Service"
4. Conectar GitHub

### 2. Configurar Build

```
Build Command: pnpm install && pnpm build
Start Command: node dist/index.js
```

### 3. Adicionar Banco de Dados

```bash
# Criar MySQL database
# Criar Redis database
# Copiar connection strings
```

### 4. Configurar Variáveis

```
DATABASE_URL=mysql://...
REDIS_URL=redis://...
JWT_SECRET=seu_secret
```

### 5. Deploy

Render faz deploy automático ao fazer push.

---

## 🔍 Verificação Pós-Deploy

### 1. Health Check

```bash
curl https://seu-dominio.com/api/health
# Resposta esperada: { "status": "ok" }
```

### 2. Verificar Banco de Dados

```bash
# Conectar ao MySQL
mysql -h host -u user -p database

# Verificar tabelas
SHOW TABLES;

# Verificar dados
SELECT COUNT(*) FROM users;
```

### 3. Verificar Logs

```bash
# Procurar por erros
grep -i error logs/app.log

# Procurar por warnings
grep -i warning logs/app.log
```

### 4. Testar Endpoints

```bash
# Teste de autenticação
curl -X GET https://seu-dominio.com/api/trpc/auth.me

# Teste de planos
curl -X GET https://seu-dominio.com/api/trpc/plans.list
```

---

## 🔄 Rollback

### Se Algo Der Errado

```bash
# Ver histórico de commits
git log --oneline

# Reverter para commit anterior
git revert <commit-hash>
git push origin main

# Ou fazer reset (cuidado!)
git reset --hard <commit-hash>
git push -f origin main
```

### Rollback no Manus

```bash
# Ver deployments anteriores
manus deployments list

# Fazer rollback
manus rollback <deployment-id>
```

---

## 📊 Monitoramento

### Configurar Alertas

```bash
# Sentry para erros
SENTRY_DSN=https://...@sentry.io/...

# Datadog para métricas
DD_API_KEY=...
DD_SITE=datadoghq.com

# Slack para notificações
SLACK_WEBHOOK=https://hooks.slack.com/...
```

### Métricas Importantes

- **Uptime:** Deve estar acima de 99.9%
- **Latência P95:** Deve estar abaixo de 500ms
- **Taxa de Erro:** Deve estar abaixo de 0.1%
- **CPU:** Deve estar abaixo de 70%
- **Memória:** Deve estar abaixo de 80%

---

## 🔐 Segurança em Produção

### Checklist

- [ ] Usar HTTPS/TLS
- [ ] Configurar CORS corretamente
- [ ] Habilitar rate limiting
- [ ] Configurar WAF (Web Application Firewall)
- [ ] Usar secrets seguros (não em código)
- [ ] Fazer backup de banco de dados
- [ ] Configurar monitoring e alertas
- [ ] Testar disaster recovery
- [ ] Documentar runbooks de incidentes
- [ ] Fazer auditorias de segurança

---

## 📈 Escalabilidade

### Quando Escalar

- Usuários ativos > 1.000
- Requisições/segundo > 100
- Tamanho do banco > 10GB
- Latência P95 > 500ms

### Estratégias de Escalabilidade

1. **Horizontal Scaling**
   - Adicionar mais instâncias
   - Load balancer (nginx, HAProxy)
   - Auto-scaling baseado em CPU/memória

2. **Vertical Scaling**
   - Aumentar CPU/memória da instância
   - Upgrade de banco de dados

3. **Database Scaling**
   - Read replicas
   - Sharding
   - Caching (Redis)

4. **CDN**
   - Cloudflare
   - AWS CloudFront
   - Bunny CDN

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar connection string
echo $DATABASE_URL

# Testar conexão
mysql -h host -u user -p -e "SELECT 1"

# Verificar firewall
telnet host 3306
```

### Erro: "Out of memory"

```bash
# Aumentar limite de memória
docker-compose.yml:
  mem_limit: 2g

# Ou no servidor
ulimit -m unlimited
```

### Erro: "Port already in use"

```bash
# Encontrar processo na porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 pnpm dev
```

### Erro: "Migrations failed"

```bash
# Verificar status
pnpm drizzle-kit status

# Gerar migrations
pnpm drizzle-kit generate

# Migrar com verbose
pnpm drizzle-kit migrate --verbose
```

---

## 📞 Suporte

- **Documentação:** https://plantaraiz.com.br/docs
- **Issues:** https://github.com/ricodoutor-pixel/consultorio-m-dico-inteligente/issues
- **Email:** contato@plantaraiz.com.br
- **Slack:** #planta-raiz-dev

---

## 📋 Checklist de Deploy

- [ ] Código revisado e testado
- [ ] Testes unitários passando (19/19)
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] Backups realizados
- [ ] Monitoring configurado
- [ ] Alertas configurados
- [ ] Runbook de incidentes preparado
- [ ] Stakeholders notificados
- [ ] Deploy realizado
- [ ] Health checks passando
- [ ] Smoke tests realizados
- [ ] Monitoramento ativo

---

**Status:** ✅ Pronto para Produção  
**Última Atualização:** 18 de Março de 2026  
**Versão:** 0c724abc
