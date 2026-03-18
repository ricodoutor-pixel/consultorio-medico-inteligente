# 📊 PLANO DE MONITORAMENTO DE PERFORMANCE - PRODUÇÃO

**Data:** 18 de Março de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Implementação  
**Ambiente:** Produção (plantayraiz.com.br)

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Monitoramento](#arquitetura-de-monitoramento)
3. [Métricas Críticas](#métricas-críticas)
4. [Sistema de Alertas](#sistema-de-alertas)
5. [Dashboards](#dashboards)
6. [Procedimentos de Escalabilidade](#procedimentos-de-escalabilidade)
7. [Plano de Resposta a Incidentes](#plano-de-resposta-a-incidentes)
8. [SLAs e Objetivos](#slas-e-objetivos)

---

## 🎯 VISÃO GERAL

### Objetivo
Monitorar a performance da plataforma Planta & Raiz em produção com alertas automáticos, dashboards em tempo real e procedimentos de escalabilidade para garantir uptime de 99.9% e performance ótima.

### Escopo
- Monitoramento de aplicação (frontend + backend)
- Monitoramento de banco de dados
- Monitoramento de infraestrutura
- Monitoramento de integrações externas
- Alertas automáticos
- Dashboards em tempo real
- Relatórios de performance

### Stakeholders
- DevOps Lead
- Backend Lead
- Frontend Lead
- DBA
- Security Lead
- CEO/Product

---

## 🏗️ ARQUITETURA DE MONITORAMENTO

### Stack de Monitoramento

```
┌─────────────────────────────────────────────────────────┐
│                    APLICAÇÃO PLANTA & RAIZ              │
│  (Frontend React + Backend Node.js + Database MySQL)    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              CAMADA DE INSTRUMENTAÇÃO                   │
│  - Logs Estruturados (Winston/Pino)                     │
│  - Métricas (Prometheus/StatsD)                         │
│  - Rastreamento Distribuído (Jaeger/Zipkin)            │
│  - APM (Application Performance Monitoring)             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│           COLETA E ARMAZENAMENTO DE DADOS               │
│  - Prometheus (Métricas)                                │
│  - ELK Stack (Logs)                                     │
│  - InfluxDB (Time-Series)                               │
│  - Jaeger (Traces)                                      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│           PROCESSAMENTO E ALERTAS                       │
│  - AlertManager (Prometheus)                            │
│  - Custom Alert Engine                                  │
│  - Webhook Handlers                                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         NOTIFICAÇÃO E ESCALAÇÃO                         │
│  - Slack                                                │
│  - PagerDuty                                            │
│  - Email                                                │
│  - SMS (Crítico)                                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          VISUALIZAÇÃO E ANÁLISE                         │
│  - Grafana (Dashboards)                                 │
│  - Kibana (Logs)                                        │
│  - Custom Dashboard                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 MÉTRICAS CRÍTICAS

### 1. Métricas de Aplicação

#### Frontend
| Métrica | Target | Alerta | Crítico |
|---------|--------|--------|---------|
| TTFB (Time to First Byte) | <200ms | >300ms | >500ms |
| FCP (First Contentful Paint) | <500ms | >1s | >2s |
| LCP (Largest Contentful Paint) | <1.2s | >2.5s | >4s |
| CLS (Cumulative Layout Shift) | <0.1 | >0.25 | >0.5 |
| FID (First Input Delay) | <100ms | >300ms | >500ms |
| Taxa de Erro JS | <0.1% | >0.5% | >1% |
| Requisições Bloqueadas | 0 | >5 | >10 |

#### Backend
| Métrica | Target | Alerta | Crítico |
|---------|--------|--------|---------|
| Tempo de Resposta P50 | <50ms | >100ms | >200ms |
| Tempo de Resposta P95 | <200ms | >500ms | >1s |
| Tempo de Resposta P99 | <500ms | >1s | >2s |
| Taxa de Erro 5xx | <0.1% | >0.5% | >1% |
| Taxa de Erro 4xx | <1% | >5% | >10% |
| Requisições/segundo | >1000 | <500 | <100 |
| Taxa de Sucesso | >99.9% | <99% | <95% |

#### Endpoints Críticos
| Endpoint | Target P95 | Alerta | Crítico |
|----------|-----------|--------|---------|
| POST /api/trpc/auth.login | <200ms | >500ms | >1s |
| POST /api/trpc/plans.subscribe | <300ms | >1s | >2s |
| POST /api/trpc/consultations.create | <500ms | >2s | >5s |
| GET /api/trpc/dashboard.metrics | <100ms | >300ms | >500ms |
| POST /api/trpc/payments.process | <1s | >3s | >5s |

### 2. Métricas de Banco de Dados

| Métrica | Target | Alerta | Crítico |
|---------|--------|--------|---------|
| Tempo de Query P95 | <50ms | >100ms | >200ms |
| Conexões Ativas | <100 | >150 | >200 |
| Conexões em Pool | >80% | <50% | <20% |
| Replicação Lag | <1s | >5s | >10s |
| Tamanho do Log Binário | <10GB | >20GB | >50GB |
| Taxa de Slow Queries | <1% | >5% | >10% |
| Espaço em Disco Livre | >30% | <20% | <10% |

### 3. Métricas de Infraestrutura

| Métrica | Target | Alerta | Crítico |
|---------|--------|--------|---------|
| CPU | <70% | >80% | >90% |
| Memória | <75% | >85% | >95% |
| Disco | <70% | >80% | >90% |
| Rede (Entrada) | <500Mbps | >750Mbps | >900Mbps |
| Rede (Saída) | <500Mbps | >750Mbps | >900Mbps |
| Latência de Rede | <10ms | >20ms | >50ms |
| Packet Loss | <0.1% | >0.5% | >1% |

### 4. Métricas de Negócio

| Métrica | Target | Alerta | Crítico |
|---------|--------|--------|---------|
| Consultas Ativas | >100 | <50 | <10 |
| Taxa de Conversão | >75% | <60% | <40% |
| Tempo Médio de Consulta | <30min | >45min | >60min |
| Pacientes Ativos | >1000 | <500 | <100 |
| Receita Diária | >R$10k | <R$5k | <R$1k |
| Taxa de Reembolso | <1% | >2% | >5% |
| Satisfação do Usuário | >4.5/5 | <4/5 | <3/5 |

---

## 🚨 SISTEMA DE ALERTAS

### 1. Configuração de Alertas

#### Alerta de Severidade: CRÍTICO
**Condição:** Métrica crítica ultrapassada  
**Ação Imediata:**
- Notificação Slack em #alerts-critical
- SMS para on-call engineer
- PagerDuty escalation
- Abertura automática de incident

**Exemplos:**
- Taxa de erro 5xx > 1%
- Tempo de resposta P95 > 1s
- CPU > 90%
- Memória > 95%
- Banco de dados indisponível
- Receita diária < R$1k

#### Alerta de Severidade: ALTO
**Condição:** Métrica de alerta ultrapassada  
**Ação Imediata:**
- Notificação Slack em #alerts-high
- Email para DevOps Lead
- PagerDuty notification

**Exemplos:**
- Taxa de erro 5xx > 0.5%
- Tempo de resposta P95 > 500ms
- CPU > 80%
- Memória > 85%
- Conexões DB > 150
- Taxa de conversão < 60%

#### Alerta de Severidade: MÉDIO
**Condição:** Métrica de aviso ultrapassada  
**Ação Imediata:**
- Notificação Slack em #alerts-medium
- Email para Backend/Frontend Lead

**Exemplos:**
- Taxa de erro 4xx > 5%
- TTFB > 300ms
- Disco > 80%
- Slow queries > 5%
- Satisfação < 4/5

#### Alerta de Severidade: BAIXO
**Condição:** Métrica de informação  
**Ação Imediata:**
- Log em #alerts-info
- Relatório diário

**Exemplos:**
- Requisições/segundo < 500
- Conexões em pool < 50%
- Replicação lag < 5s

### 2. Regras de Alerta (Prometheus)

```yaml
# Alertas Críticos
- alert: HighErrorRate5xx
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 1m
  severity: critical

- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  severity: critical

- alert: DatabaseDown
  expr: up{job="mysql"} == 0
  for: 1m
  severity: critical

- alert: HighCPUUsage
  expr: node_cpu_usage > 0.9
  for: 5m
  severity: critical

- alert: HighMemoryUsage
  expr: node_memory_usage > 0.95
  for: 5m
  severity: critical

# Alertas Altos
- alert: MediumErrorRate5xx
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.005
  for: 5m
  severity: high

- alert: MediumResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
  for: 10m
  severity: high

- alert: HighDiskUsage
  expr: node_disk_usage > 0.8
  for: 10m
  severity: high

# Alertas Médios
- alert: HighErrorRate4xx
  expr: rate(http_requests_total{status=~"4.."}[5m]) > 0.05
  for: 15m
  severity: medium

- alert: SlowQueries
  expr: rate(mysql_slow_queries[5m]) > 0.05
  for: 15m
  severity: medium
```

### 3. Canais de Notificação

#### Slack
```
#alerts-critical    → Alertas críticos (24/7)
#alerts-high        → Alertas altos (horário comercial)
#alerts-medium      → Alertas médios (resumo diário)
#alerts-info        → Alertas baixos (log apenas)
#incidents          → Discussão de incidentes
#deployments        → Notificações de deploy
```

#### PagerDuty
- **Escalation Policy:** On-call engineer → Team Lead → Manager
- **Timeout:** 5 minutos entre escalações
- **Crítico:** Chamada telefônica imediata

#### Email
- **Crítico:** Imediato para toda a equipe
- **Alto:** Imediato para DevOps Lead
- **Médio:** Resumo diário às 9:00 AM

#### SMS
- **Crítico apenas:** Para on-call engineer

---

## 📈 DASHBOARDS

### 1. Dashboard de Visão Geral (Home)

**Componentes:**
- Status geral da plataforma (🟢 Healthy / 🟡 Degraded / 🔴 Down)
- Uptime (últimas 24h, 7d, 30d)
- Alertas ativos (críticos, altos, médios)
- Requisições/segundo (gráfico em tempo real)
- Taxa de erro (gráfico em tempo real)
- Latência P95 (gráfico em tempo real)
- Eventos recentes (últimas 10)

### 2. Dashboard de Performance (Backend)

**Componentes:**
- Tempo de resposta por endpoint (P50, P95, P99)
- Taxa de erro por endpoint
- Requisições/segundo por endpoint
- Distribuição de status HTTP
- Taxa de erro por tipo (5xx, 4xx, 3xx)
- Latência de banco de dados
- Tempo de processamento de fila

### 3. Dashboard de Frontend

**Componentes:**
- TTFB, FCP, LCP, CLS, FID
- Taxa de erro JavaScript
- Requisições bloqueadas
- Performance por página
- Performance por navegador
- Performance por dispositivo
- Performance por localização geográfica

### 4. Dashboard de Banco de Dados

**Componentes:**
- Tempo de query (P50, P95, P99)
- Slow queries (top 10)
- Conexões ativas
- Uso de pool de conexões
- Tamanho do banco de dados
- Replicação lag
- Espaço em disco livre

### 5. Dashboard de Infraestrutura

**Componentes:**
- CPU por servidor
- Memória por servidor
- Disco por servidor
- Rede (entrada/saída)
- Latência de rede
- Packet loss
- Uptime por servidor

### 6. Dashboard de Negócio

**Componentes:**
- Receita diária
- Taxa de conversão
- Consultas ativas
- Pacientes ativos
- Médicos ativos
- Lojas ativas
- Satisfação do usuário
- NPS (Net Promoter Score)

### 7. Dashboard de Agentes IA

**Componentes:**
- Status de cada agente (Brisa, CEO, ANVISA, Verdinho)
- Requisições processadas por agente
- Taxa de sucesso por agente
- Tempo de processamento por agente
- Erros por agente
- Fila de processamento
- Uptime de cada agente

### 8. Dashboard de Integrações

**Componentes:**
- Status Twilio (SMS/WhatsApp)
- Status Mercado Pago
- Status Jitsi
- Status Clicksign
- Status Google Maps
- Taxa de sucesso por integração
- Latência por integração
- Erros por integração

---

## 🔄 PROCEDIMENTOS DE ESCALABILIDADE

### 1. Escalabilidade Horizontal (Servidores)

**Gatilho:** CPU > 80% por 10 minutos OU Memória > 85% por 10 minutos

**Procedimento:**
1. AlertManager dispara alerta "HighResourceUsage"
2. Auto-scaler verifica métricas
3. Se CPU > 80% E Requisições/seg > 500:
   - Provisionar novo servidor
   - Adicionar ao load balancer
   - Executar health check
   - Remover do alerta
4. Se CPU < 50% por 30 minutos:
   - Remover servidor extra
   - Atualizar load balancer

**Tempo de Escalabilidade:**
- Provisionar novo servidor: 2-3 minutos
- Adicionar ao load balancer: 30 segundos
- Health check: 1 minuto
- **Total:** ~4 minutos

### 2. Escalabilidade de Banco de Dados

**Gatilho:** Conexões > 150 OU Slow queries > 10%

**Procedimento:**
1. Aumentar pool de conexões (de 100 para 150)
2. Se problema persiste:
   - Ativar read replicas
   - Distribuir leitura entre replicas
   - Manter escrita no master
3. Se ainda persistir:
   - Adicionar cache (Redis)
   - Implementar query optimization
   - Escalar verticalmente

**Tempo de Escalabilidade:**
- Aumentar pool: 1 minuto
- Ativar replicas: 5-10 minutos
- Adicionar cache: 10-15 minutos

### 3. Escalabilidade de Cache

**Gatilho:** Cache hit rate < 50% OU Latência P95 > 500ms

**Procedimento:**
1. Aumentar tamanho do Redis (de 2GB para 4GB)
2. Adicionar mais instâncias de cache
3. Implementar cache warming
4. Otimizar TTL de cache

**Tempo de Escalabilidade:**
- Aumentar tamanho: 2-3 minutos
- Adicionar instância: 3-5 minutos
- Cache warming: 5-10 minutos

### 4. Escalabilidade de CDN

**Gatilho:** Latência de assets > 1s OU Banda > 900Mbps

**Procedimento:**
1. Adicionar mais edge locations
2. Aumentar cache TTL
3. Implementar lazy loading
4. Otimizar tamanho de assets

**Tempo de Escalabilidade:**
- Adicionar edge location: 5-10 minutos
- Aumentar TTL: 1 minuto
- Otimizar assets: 15-30 minutos

---

## 🆘 PLANO DE RESPOSTA A INCIDENTES

### 1. Severidade de Incidentes

#### CRÍTICO (P1)
- Plataforma completamente indisponível
- Taxa de erro > 50%
- Perda de dados
- Violação de segurança

**Tempo de Resposta:** < 5 minutos  
**Tempo de Resolução:** < 30 minutos  
**Escalonamento:** Imediato para CEO

#### ALTO (P2)
- Funcionalidade crítica indisponível
- Taxa de erro > 10%
- Performance severamente degradada
- Afeta > 10% dos usuários

**Tempo de Resposta:** < 15 minutos  
**Tempo de Resolução:** < 2 horas  
**Escalonamento:** Para Tech Lead

#### MÉDIO (P3)
- Funcionalidade secundária indisponível
- Taxa de erro 1-10%
- Performance degradada
- Afeta < 10% dos usuários

**Tempo de Resposta:** < 1 hora  
**Tempo de Resolução:** < 8 horas  
**Escalonamento:** Para Engineer

#### BAIXO (P4)
- Funcionalidade menor afetada
- Taxa de erro < 1%
- Sem impacto no negócio

**Tempo de Resposta:** < 1 dia  
**Tempo de Resolução:** < 1 semana  
**Escalonamento:** Para backlog

### 2. Procedimento de Resposta

```
1. DETECÇÃO (Automática via AlertManager)
   └─ Alerta dispara
   └─ Notificação enviada

2. CONFIRMAÇÃO (< 5 min)
   └─ On-call engineer verifica
   └─ Abre incident no PagerDuty
   └─ Notifica stakeholders

3. INVESTIGAÇÃO (< 15 min)
   └─ Analisa logs
   └─ Verifica métricas
   └─ Identifica causa raiz

4. MITIGAÇÃO (< 30 min)
   └─ Aplica fix temporário
   └─ Restaura serviço
   └─ Monitora estabilidade

5. RESOLUÇÃO (< 2 horas)
   └─ Implementa fix permanente
   └─ Testa em staging
   └─ Deploy em produção

6. PÓS-INCIDENTE (< 24 horas)
   └─ Documentação
   └─ Root cause analysis
   └─ Plano de prevenção
   └─ Reunião com equipe
```

### 3. Runbook de Incidentes Comuns

#### Incidente: Taxa de Erro 5xx > 1%

**Causa Provável:**
1. Erro de aplicação
2. Banco de dados indisponível
3. Integração externa falha
4. Falta de memória

**Procedimento:**
1. Verificar logs de aplicação
2. Verificar status de banco de dados
3. Verificar status de integrações
4. Verificar uso de memória
5. Se memória alta: reiniciar aplicação
6. Se BD down: failover para replica
7. Se integração down: usar fallback

#### Incidente: Latência P95 > 1s

**Causa Provável:**
1. Banco de dados lento
2. Query não otimizada
3. Falta de cache
4. Rede congestionada

**Procedimento:**
1. Verificar slow queries
2. Verificar índices de BD
3. Verificar cache hit rate
4. Verificar uso de rede
5. Se BD lento: adicionar índice
6. Se cache baixo: aumentar TTL
7. Se rede congestionada: escalar

#### Incidente: Banco de Dados Indisponível

**Causa Provável:**
1. Servidor down
2. Disco cheio
3. Muitas conexões
4. Replicação lag alto

**Procedimento:**
1. Verificar status do servidor
2. Verificar espaço em disco
3. Verificar conexões ativas
4. Se servidor down: failover
5. Se disco cheio: limpar logs
6. Se muitas conexões: aumentar pool
7. Se replicação lag: sincronizar

---

## 📊 SLAS E OBJETIVOS

### Uptime SLA

| Período | Target | Downtime Permitido |
|---------|--------|-------------------|
| Mensal | 99.9% | ~43 minutos |
| Trimestral | 99.9% | ~2.2 horas |
| Anual | 99.9% | ~8.7 horas |

### Performance SLA

| Métrica | Target | Penalty |
|---------|--------|---------|
| Latência P95 | <500ms | 10% crédito se > 1s |
| Taxa de Erro | <0.1% | 5% crédito se > 0.5% |
| Disponibilidade | 99.9% | 10% crédito se < 99% |

### Objetivos de Performance

| Métrica | Mês 1 | Mês 3 | Mês 6 |
|---------|-------|-------|-------|
| Latência P95 | <500ms | <300ms | <200ms |
| Taxa de Erro | <0.5% | <0.2% | <0.1% |
| Uptime | 99.5% | 99.8% | 99.9% |
| Requisições/seg | 500 | 1000 | 2000 |

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Configurar Prometheus + AlertManager
- [ ] Configurar Grafana com dashboards
- [ ] Configurar ELK Stack para logs
- [ ] Configurar Jaeger para traces
- [ ] Integrar Slack com AlertManager
- [ ] Integrar PagerDuty
- [ ] Configurar auto-scaler
- [ ] Documentar runbooks
- [ ] Treinar equipe
- [ ] Teste de carga
- [ ] Teste de failover
- [ ] Teste de escalabilidade
- [ ] Validar SLAs
- [ ] Deploy em produção

---

## 📞 CONTATOS DE EMERGÊNCIA

| Papel | Nome | Telefone | Email | Disponibilidade |
|-------|------|----------|-------|-----------------|
| DevOps Lead | [Nome] | [Tel] | [Email] | 24/7 |
| Backend Lead | [Nome] | [Tel] | [Email] | 24/7 |
| Frontend Lead | [Nome] | [Tel] | [Email] | 9-18 |
| DBA | [Nome] | [Tel] | [Email] | 24/7 |
| Security | [Nome] | [Tel] | [Email] | 24/7 |
| CEO | [Nome] | [Tel] | [Email] | 9-18 |

---

## 📚 REFERÊNCIAS

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [ELK Stack Guide](https://www.elastic.co/guide/index.html)
- [SRE Book - Google](https://sre.google/books/)
- [Observability Engineering - O'Reilly](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)

---

**Assinado:** Manus IA  
**Data:** 18 de Março de 2026  
**Versão:** 1.0.0  
**Próxima Revisão:** 30 de Abril de 2026
