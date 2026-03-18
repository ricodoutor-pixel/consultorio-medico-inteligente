# Planta & Raiz 2026-2030 - TODO

## Fase 1: Arquitetura e Schema de Banco de Dados
- [x] Projetar schema de usuários com roles (médico, lojista, afiliado, admin)
- [x] Projetar tabelas de planos SaaS (5 planos com benefícios)
- [x] Projetar tabelas de assinaturas e pagamentos
- [x] Projetar tabelas de afiliados e comissões (3 níveis)
- [x] Projetar tabelas de transações financeiras e saques
- [x] Projetar tabelas de verificação (e-mail, WhatsApp)
- [x] Projetar tabelas de agentes IA (Brisa, CEO, ANVISA, Verdinho)

## Fase 2: Autenticação
- [x] Implementar verificação de e-mail obrigatória (schema criado)
- [x] Implementar verificação de código WhatsApp obrigatória (schema criado)
- [ ] Implementar fluxo de boas-vindas com e-mail automático
- [ ] Integrar Twilio para envio de WhatsApp
- [ ] Criar testes de autenticação

## Fase 3: Gestão de Planos SaaS
- [x] Criar tabela comparativa visual dos 5 planos (Plans.tsx)
- [x] Implementar lógica de upgrade/downgrade de planos (routers tRPC)
- [ ] Integrar Mercado Pago para pagamentos
- [ ] Implementar webhooks de pagamento
- [ ] Criar dashboard de gerenciamento de assinatura

## Fase 4: Sistema de Afiliados
- [x] Implementar cálculo de comissões (50%, 5%, 2%) (db.ts + testes)
- [x] Criar dashboard de afiliados com rastreamento de referências (AffiliateDashboard.tsx)
- [x] Implementar geração de links de afiliado únicos (AffiliateDashboard.tsx)
- [ ] Implementar sistema de pagamento de comissões
- [ ] Criar relatórios de desempenho de afiliados

## Fase 5: Gestão Financeira
- [x] Implementar cálculo de taxa de administração (5%) (db.ts + testes)
- [x] Implementar cálculo de taxa de saque (5%, com isenção para Clínica Família) (db.ts + testes)
- [ ] Implementar sistema de saques (CEO agent)
- [ ] Criar dashboard financeiro com relatórios
- [ ] Implementar auditoria de transações

## Fase 6: Interface Tech-Luxury
- [x] Implementar Dark Mode como padrão (index.css com tema emerald/cyan)
- [x] Criar layout base com navegação (Home.tsx)
- [x] Implementar dashboard do Médico (DoctorDashboard.tsx)
- [x] Implementar dashboard do Lojista (StoreDashboard.tsx)
- [x] Implementar dashboard do Afiliado (AffiliateDashboard.tsx)
- [x] Implementar página de planos SaaS (Plans.tsx)
- [ ] Implementar página de perfil do usuário

## Fase 7: Agentes IA
- [x] Implementar Enfermeira Brisa (triagem clínica, matching geográfico, pós-venda D+7/D+30, Smart-Refill) (agents.ts)
- [x] Implementar Manus CEO (gestão financeira, automação de pagamentos, divisão de comissões) (agents.ts)
- [x] Implementar Guardião ANVISA (auditoria OCR, validação de CRM, conformidade de laudos) (agents.ts)
- [x] Implementar Verdinho (concierge, suporte técnico, gestão logística) (agents.ts)

## Fase 8: Integrações Externas
- [ ] Integrar Mercado Pago (pagamentos)
- [ ] Integrar Twilio (WhatsApp)
- [ ] Integrar Clicksign (assinaturas)
- [ ] Integrar Jitsi (vídeo consultas)
- [x] Agentes IA com LLM integrado (agents.ts)

## Fase 9: Testes e Deploy
- [x] Testes unitários de gestão financeira (19 testes passando)
- [ ] Testar fluxo completo de autenticação
- [ ] Testar fluxo de assinatura e pagamento
- [ ] Testar sistema de afiliados
- [ ] Fazer push para GitHub
- [ ] Configurar deploy automático

## Fase 10: Documentação e Relatório
- [ ] Gerar relatório de implementação
- [ ] Documentar arquitetura
- [ ] Documentar APIs
- [ ] Criar guia de uso para usuários
