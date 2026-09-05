# Plano de Recuperação de Desastres (Disaster Recovery) & Continuidade de Negócios (BCP)
**Projeto**: Planta y Raiz (`consultorio-medico-inteligente`)  
**Data**: 05 de Setembro de 2026  
**Ambiente Oficial**: Supabase Production (`tkxxoghzhvhjzdoomgss.supabase.co`) + Cloudflare Pages CDN  
**Classificação**: Serviços de Saúde & Telemedicina Crítica  

---

## 1. Métricas de Resiliência: RTO & RPO

Para garantir a preservação da integridade assistencial e conformidade sanitária com a **Resolução CFM nº 2.314/2022** e a **Lei Geral de Proteção de Dados (LGPD)**, definem-se as metas operacionais:

| Métrica | Meta Operacional | Descrição |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **< 1 hora** | Tolerância máxima de perda transacional de dados clínicos e cadastros. |
| **RTO (Recovery Time Objective)** | **< 4 horas** | Tempo limite para restabelecimento total da operação de telemedicina e emissão de receitas após incidente catastrófico. |

---

## 2. Estratégia de Backup & Redundância

### 2.1. Banco de Dados Relacional (PostgreSQL)
- **Point-in-Time Recovery (PITR)**: Habilitado continuamente com retenção de WAL (Write-Ahead Logs) por 7 a 30 dias. Permite restauração granular para qualquer segundo prévio a uma falha lógica ou corrupção de dados.
- **Backups Diários Físicos e Lógicos**: Snapshots automatizados executados na janela de menor tráfego (03:00 UTC-3) com criptografia AES-256 e redundância geográfica em buckets isolados (Cold Storage).
- **Trilha de Auditoria Imutável**: As tabelas `medical_records`, `doctor_contracts` e `ai_agent_actions` utilizam modelo append-only com triggers restritivas que impedem comandos `UPDATE` e `DELETE`.

### 2.2. Armazenamento de Arquivos Clínicos (Storage Buckets)
- Os documentos armazenados em `legal-documents` (contratos assinados com SHA-512) e `kyc-documents` (dossiês de médicos e pacientes) contam com versionamento de objetos ativado e replicação assíncrona entre regiões AWS/Cloudflare.

---

## 3. Procedimento Operacional Padrão de Restauração (Failover)

### Passo 1: Declaração de Incidente e Isolamento
1. A equipe técnica notifica a Diretoria Clínica e aciona o comitê de crise.
2. Ativação da página de manutenção estática no Cloudflare via Edge Worker (`503 Service Unavailable - Manutenção Preventiva Programada`), preservando as sessões ativas do paciente.

### Passo 2: Restauração do Banco de Dados
1. No painel de gerenciamento Supabase ou via CLI (`supabase db restore`):
   ```bash
   # Restauração para timestamp específico imediatamente anterior à anomalia
   supabase db restore --timestamp "2026-09-05T12:00:00Z" --project-ref tkxxoghzhvhjzdoomgss
   ```
2. Execução da suite de validação de consistência:
   ```bash
   node scripts/e2e-system-integrity-check.cjs
   ```

### Passo 3: Reativação e Testes de Integridade Clínica
1. Verificação da integridade das chaves públicas e hashes SHA-512 dos contratos médicos.
2. Teste de conexão das Edge Functions (`generate-doctor-contract`, `brisa-chat`, etc.).
3. Desativação da página de contingência no Cloudflare (Purge Cache).

---

## 4. Calendário de Simulações & Auditoria Semestral

- **Frequência de Exercícios**: A cada 6 meses (março e setembro).
- **Escopo do Simulado**:
  - Restauração de dump completo em ambiente isolado (Staging).
  - Simulação de corrupção acidental de registro de prontuário e recuperação via PITR.
  - Verificação pericial dos logs de acesso (`medical_record_access_log`).
  - Emissão de Relatório Técnico de Conformidade assinado pelo Responsável Técnico de TI e Diretor Clínico.
