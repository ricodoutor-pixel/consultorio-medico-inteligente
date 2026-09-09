# Governança Oficial — Banco Unificado Planta y Raíz (09/09/2026)

Este documento estabelece o protocolo operacional definitivo, inviolável e unificado de dados para a plataforma **Planta y Raíz** ([plantayraiz.com.br](https://www.plantayraiz.com.br)).

---

## 1. Identificação do Banco Oficial Único

* **Projeto Oficial (ÚNICO PERMITIDO):** `shmbwdjuddvquszwkvuq`
* **URL:** `https://shmbwdjuddvquszwkvuq.supabase.co`
* **Chave Pública (anon):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ`
* **Projeto Legado (`tkxxoghzhvhjzdoomgss`):** DESATIVADO. **Zero leituras e zero escritas.**
* **Segurança de Chaves:** A chave de serviço (`service_role`) permanece restrita às variáveis de ambiente de backend/servidor, **nunca** exposta em código-fonte, prompts, logs ou commits.

---

## 2. Ordem Obrigatória de Inserção de Cadastros

### A. Médico / Prescritor
1. **Autenticação (Auth):** Criar o usuário de autenticação no projeto oficial.
2. **Perfil (`public.profiles`):** `id` (= `auth.users.id`), `full_name`, `phone`, `cpf`, `date_of_birth`, `avatar_url`, `city`, `region`, `country`, `cep`, endereço e `pix_key`.
3. **Registro Médico (`public.doctors`):** `user_id`, `crm`, `crm_state`, `specialty`, `document_type`, `country`, `city`, `is_verified = false`, `is_approved_by_admin = false`, `kyc_status = 'pending'`.
4. **Documentos KYC (`public.doctor_kyc_documents`):** Um registro por documento anexado, contendo `doctor_user_id`, `document_kind`, `storage_path`, `mime_type`, `size_bytes`, `verification_status = 'pending'`.

### B. Farmácia Parceira
- `public.profiles`: `company_name`, `trade_name`, `cnpj`, `crf`, `anvisa_auth`.
- `public.vendors`: `is_active = false` e `is_kyc_approved = false` (aguardando termo de adesão assinado e `mp_collector_id`).

### C. Paciente
- `public.profiles` com `user_type = 'patient'` ou `role = 'patient'`.

---

## 3. Regras Operacionais Rígidas

1. **Armazenamento de Arquivos:** Todo anexo vai para os buckets privados de KYC. **Nunca** gravar arquivo em base64 em colunas de texto.
2. **Avatares:** Upload no Storage e salvamento da URL pública correspondente. **Nunca** usar `data:` em `avatar_url`.
3. **Aprovação Manual Exclusiva:** **Nunca** marcar `is_verified = true` ou `is_approved_by_admin = true` de forma automática. A aprovação é prerrogativa exclusiva do Dr. Edilson no painel `/admin/aprovacoes-medicas`.
4. **Integridade de Dados:** Nunca inventar dados; campos não informados permanecem `null`.
5. **Prevenção de Duplicidades:** Verificar antes por `CRM + UF` e por `CPF/CNPJ`. Se já existir, atualizar o registro existente completando campos faltantes.
6. **Preservação de Registros:** **Nunca** apagar registros reais nem documentos KYC.
7. **Zero Cadastros de Teste:** Nenhuma criação de perfil fictício. A única conta oficial de referência é `contato@plantayraiz.com.br`.

---

## 4. Critérios de Aceite das Páginas Administrativas

* **Médicos:** Aparecem em `/admin/aprovacoes-medicas` com documentos abríveis em um clique.
* **Pacientes:** Aparecem em `/admin/aprovacoes-pacientes` com dados reais (CPF, telefone, cidade, atendimentos e pagamentos vinculados).
* **Farmácias:** Aparecem em `/admin/aprovacoes-farmacias`, inativas até aprovação e credenciamento.
* **Ordenação da Esteira:** Automática por nível documental (Inicial → Intermediário → Avançado → VIP), mantendo Dr. Edilson, Dra. Suelen e Dr. Daniel fixados no topo.

---

## 5. Rotina de Monitoramento 24h

* Checar novos cadastros a cada ciclo.
* Completar campos pendentes e acionar cobrança documental via WhatsApp do profissional.
* Reportar diariamente o consolidado: total de profissionais, verificados, pendentes, documentação completa, novos registros em 24h, pacientes e farmácias.
* Preservar integralmente o design, preços e políticas RLS da plataforma.
