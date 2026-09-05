# Arquitetura do Prontuário Eletrônico Estruturado & Auditoria Clínica
**Projeto**: Planta y Raiz (`consultorio-medico-inteligente`)  
**Data**: 05 de Setembro de 2026  
**Regulamentação Vigente**: Resolução CFM nº 1.821/2007, CFM nº 2.314/2022 e Lei Geral de Proteção de Dados (Lei nº 13.709/2018)

---

## 1. Diretrizes Regulatórias do CFM e LGPD

O Prontuário Eletrônico do Paciente (PEP) da plataforma Planta y Raiz foi desenhado para atender estritamente aos seguintes preceitos ético-legais:

1. **Imutabilidade e Não-Repúdio (CFM nº 1.821/2007)**:
   Uma vez assinado pelo médico, o prontuário é selado (`is_sealed = true`). Nenhuma rotina de aplicação possui permissão para executar comandos `UPDATE` ou `DELETE` sobre registros médicos finalizados.
2. **Retenção Compulsória por 20 Anos**:
   Os registros médicos eletrônicos são protegidos contra expurgo por triggers do banco de dados PostgreSQL (`enforce_medical_records_immutability`).
3. **Auditoria de Acesso (LGPD Art. 18 / CFM nº 2.314/2022 Art. 8º)**:
   Todo acesso de leitura, exportação ou auditoria gera um registro no log permanente (`medical_record_access_log`), contendo o carimbo de data/hora (UTC), endereço IP, agente de navegação e papel do usuário (médico, paciente, auditor).

---

## 2. Estrutura do Esquema de Dados (`medical_records`)

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | Identificador único universal do prontuário |
| `patient_id` | `UUID` | Referência à conta do paciente (`auth.users`) |
| `doctor_id` | `UUID` | Referência ao cadastro do médico homologado (`doctors`) |
| `consultation_id` | `UUID` | Identificador da sessão de telemedicina vinculada |
| `chief_complaint` | `TEXT` | Queixa principal relatada pelo paciente |
| `anamnese` | `TEXT` | Histórico da doença atual (HDA) e antecedentes |
| `exame_fisico` | `TEXT` | Avaliação clínica e sinais vitais remotos coletados |
| `diagnosis` | `TEXT` | Diagnóstico descritivo |
| `diagnosis_cid` | `VARCHAR` | Código internacional de doenças (CID-10 / CID-11) |
| `hipotese_diagnostica` | `TEXT` | Hipótese e diagnósticos diferenciais |
| `conduta` | `TEXT` | Conduta terapêutica e plano de cuidado |
| `treatment_plan` | `TEXT` | Prescrição sugerida, dosagens e orientações |
| `prescricao_snapshot` | `JSONB` | Fotografia imutável dos medicamentos prescritos |
| `record_hash` | `TEXT` | Hash criptográfico SHA-256 gerado automaticamente |
| `is_sealed` | `BOOLEAN` | Trava de imutabilidade ativada |
| `created_at` | `TIMESTAMPTZ`| Carimbo de tempo de criação com precisão milissegundos |

---

## 3. Trilha de Auditoria de Acesso (`medical_record_access_log`)

Cada visualização pelo paciente, médico ou administrador dispara uma entrada na tabela de log:
- `record_id`: Prontuário consultado.
- `accessed_by_user_id`: Identificação de quem consultou.
- `access_role`: Papel (`patient`, `doctor`, `admin`, `auditor`).
- `access_type`: Modalidade de consulta (`view`, `export_pdf`, `export_fhir`, `audit`).
- `ip_address`: IP do solicitante para fins periciais.

---

## 4. Garantia Criptográfica de Integridade

Na inserção de qualquer prontuário, a trigger do banco de dados `trg_generate_medical_record_hash` concatena os dados clínicos essenciais e calcula a impressão digital criptográfica via algoritmo SHA-256. Qualquer tentativa de alteração manual ou corrupção de dados é detectada pela conferência do hash.
