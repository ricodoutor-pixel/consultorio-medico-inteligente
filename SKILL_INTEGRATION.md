# Integração da Skill: telemedicina-cannabis-platform

## Visão Geral

Este repositório utiliza a skill `telemedicina-cannabis-platform` como base arquitetural para toda a plataforma.

## Estrutura de Integração

### 1. Backend (Skill: 12 Routers)

Todos os routers implementam o padrão da skill:

```
server/routers/
├── onboarding.ts
├── intelligent-prescription.ts
├── telemedicine-ar.ts
├── pharmacy-integration.ts
├── scientific-library.ts
├── medical-mentorship.ts
├── free-courses.ts
├── peer-forum.ts
├── webinars.ts
├── volunteer-doctors.ts
├── affiliate-career.ts
└── social-impact.ts
```

### 2. Frontend (Skill: 14 Páginas)

Todos os componentes seguem o design system da skill.

### 3. Segurança (Skill: LGPD/ANVISA/CFM)

Implementação de segurança conforme skill.

### 4. Testes (Skill: 20 Testes E2E)

Suite de testes automatizados.

### 5. Marketing & SEO (Skill: Estratégias)

Documentação de estratégias.

## Padrões Implementados

✅ Validação com Zod
✅ Tratamento de erros
✅ Segurança (RLS, autorização)
✅ Notificações
✅ Logging/audit
✅ Design system
✅ Responsividade
✅ Testes E2E

---

**Status:** 🟢 IMPLEMENTADA
