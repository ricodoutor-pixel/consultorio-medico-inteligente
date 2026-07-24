# CHANGELOG AUDITORIA & SEGURANÇA — PLANTA Y RAIZ

Este changelog registra todas as alterações efetuadas no frontend e nas integrações com o Supabase Backend para fins de rastreabilidade entre agentes, equipes e auditorias regulatórias (CFM / LGPD).

---

## [1.0.0] - 2026-07-24

### 1. Listagem Pública de Médicos (`doctors_public`)
- **Correção Urgente:** Atualizadas as chamadas de busca de médicos para utilizar exclusivamente a view pública `doctors_public` em:
  - `src/pages/Agendamento.tsx`
  - `src/pages/Profissionais.tsx`
  - `src/hooks/useRealProfessionals.ts`
  - `src/services/module3-clinic-triage.ts`
- **LGPD:** Fotos de documentos de CRM (`crm_front_url`, `crm_back_url`) e o status interno de KYC não são mais expostos para usuários não autenticados ou pacientes navegando na plataforma.

### 2. Módulo de Audit Log (`access_audit_log`)
- Criado o utilitário `src/services/auditLogger.ts` com suporte a execuções `best-effort` não-bloqueantes.
- Integrado o registro automático em `access_audit_log` para acessos de médicos e administradores a dados sensíveis de pacientes (prontuários, agendamentos, prescrições e TCLE).

### 3. UI de Prontuário Estruturado (`medical_records`)
- Criado o componente `src/components/MedicalRecordForm.tsx` com formulário contendo os 5 campos regulatórios:
  1. Queixa Principal (`chief_complaint`)
  2. História da Doença Atual (`history_present_illness`)
  3. Histórico Médico (`medical_history`)
  4. Exame Físico / Avaliação (`physical_exam`)
  5. Avaliação e Conduta (`assessment_plan`)
- Criado o componente `src/components/PatientMedicalRecordView.tsx` para exibição em modo somente-leitura aos pacientes.

### 4. Templates de Resposta (`doctor_message_templates`)
- Criado o componente `src/components/DoctorMessageTemplates.tsx` para gerenciamento CRUD (criar, editar, listar, excluir) de atalhos rápidos de mensagem pelo próprio médico logado.

### 5. Painel de Histórico do Paciente na Vídeo-Consulta
- Criado o componente `src/components/PatientHistoryPanel.tsx` integrado à tela de chamada por vídeo, permitindo ao médico visualizar histórico de consultas, prescrições anteriores, TCLE assinado e prontuários pregressos com audit log automático.

### 6. Dashboard Financeiro do Médico
- Atualizado o `ProfessionalDashboard.tsx` para calcular o faturamento faturado (consultas concluídas) e pendente a partir da tabela de agendamentos.

### 7. Revalidação Periódica de KYC
- Adicionado banner de alerta no dashboard do médico caso a validade dos documentos (`kyc_valid_until`) esteja a 30 dias de vencer ou vencida, com fluxo de reenvio de CRM.

### 8. Direitos do Titular LGPD (Art. 18)
- Atualizado o `src/pages/LGPDDireitos.tsx` para registrar solicitações de exportação ou eliminação diretamente na tabela `data_subject_requests`.
- Documentada a política de retenção legal de 20 anos para prontuários clínicos conforme Lei 13.787/2018 e CFM.

### 9. Autenticação 2FA (MFA) Obrigatória para Médicos
- Criado o componente `src/components/MFAEnrollment.tsx` para onboarding TOTP com QR Code nativo do Supabase Auth.
