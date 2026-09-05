# Arquitetura de Agentes de Inteligência Artificial & Governança Clínica
**Projeto**: Planta y Raiz (`consultorio-medico-inteligente`)  
**Data**: 05 de Setembro de 2026  
**Responsabilidade Técnica**: Coordenação Médica & Engenharia de Software  

---

## 1. Visão Geral da Arquitetura Multiagente

A plataforma Planta y Raiz implementa um ecossistema integrado de agentes autônomos e assistivos de Inteligência Artificial orientados para saúde integral, telemedicina canabinoide e conformidade regulatória. 

Cada agente opera com escopo delimitado, diretrizes éticas rígidas e registro compulsório de auditoria na tabela `ai_agent_actions`.

```mermaid
flowchart TD
    User([Usuário / Paciente / Médico]) --> Gateway[API Gateway / Edge Functions]
    Gateway --> Dispatcher{Orquestrador de Agentes}
    
    Dispatcher --> Brisa[Enfª Brisa: Acolhimento & Triagem]
    Dispatcher --> Hunter[Brisa Lead Hunter: Extração CRM]
    Dispatcher --> Reg[Guia Regulatório Anvisa]
    Dispatcher --> Edilson[Copiloto Clínico Dr. Edilson]
    
    Brisa --> Audit[(ai_agent_actions)]
    Hunter --> Audit
    Reg --> Audit
    Edilson --> Audit
    
    Audit --> AdminPanel[/admin/ia-auditoria]
    AdminPanel --> HumanSupervision[Supervisão Médica / Human-in-the-loop]
```

---

## 2. Catálogo e Responsabilidades dos Agentes

### 2.1. Enfermeira Brisa (`enf_brisa`)
- **Papel**: Acolhimento humanizado, escuta qualificada e triagem pré-clínica.
- **Competências**:
  - Aplicação de questionário de triagem de sintomas e histórico prévio.
  - Condução do paciente para agendamento de consulta de telemedicina.
  - Orientações sanitárias e de bem-estar integral.
- **Diretrizes Éticas & Sanitárias**:
  - Não estabelece diagnósticos nem realiza prescrições terapêuticas.
  - Identifica-se expressamente como inteligência artificial assistiva orientadora.
  - Em situações de urgência/emergência, orienta a busca imediata de pronto-atendimento (SAMU 192 / UPA).

### 2.2. Brisa Lead Hunter (`lead_hunter`)
- **Papel**: Identificação, extração e qualificação de oportunidades comerciais no ecossistema.
- **Competências**:
  - Processamento de mensagens não-estruturadas de redes sociais e canais de contato.
  - Extração de intenção de tratamento e localização para pareamento médico.
  - Sincronização direta com o pipeline do Brevo CRM.

### 2.3. Guia Regulatório Anvisa & Direitos do Paciente (`regulatory_assistant`)
- **Papel**: Canal informativo e educativo sobre o arcabouço sanitário e direitos de saúde.
- **Competências**:
  - Esclarecimentos sobre a RDC nº 660/2022 (importação individual de derivados de Cannabis) e RDC nº 327/2019 (produtos de Cannabis em farmácia).
  - Orientações sobre requisitos documentais para laudos e prescrições médicas.
  - Informações de conformidade sobre autorizações perante companhias aéreas e transporte de medicamentos.
- **Salvaguarda Ética (OAB)**:
  - Não utiliza terminologia de consultoria advocatícia ("advogado virtual", "parecer jurídico").
  - Foco estritamente educativo, ressalvando a necessidade de consulta a advogado para demandas judiciais individuais.

### 2.4. Copiloto Clínico Dr. Edilson (`dr_edilson_clinical`)
- **Papel**: Apoio à decisão clínica baseado em evidências para o médico prescritor.
- **Competências**:
  - Busca e síntese de literatura biomédica indexada (PubMed, Cochrane, Anvisa).
  - Cálculo de faixas posológicas orientativas com base em peso e patologia.
  - Verificação automatizada de interações medicamentosas com canabinoides (CYP450: CYP3A4, CYP2C9, CYP2C19).
- **Conformidade CFM (Resoluções nº 2.314/2022 e nº 2.336/2023)**:
  - Todas as sugestões exigem validação e assinatura digital soberana do médico habilitado (CRM ativo + certificado ICP-Brasil).

---

## 3. Modelo de Governança, Rastreabilidade e Auditoria

### 3.1. Registro Imutável (`ai_agent_actions`)
Toda ação executada por qualquer agente gera um registro estruturado na tabela `ai_agent_actions`:
- `agent_name`: Identificador unívoco do agente (`enf_brisa`, `lead_hunter`, etc.).
- `action_type`: Natureza da operação (`triage`, `interaction_check`, `lead_extraction`, etc.).
- `input_payload`: Dados exatos de entrada fornecidos ao modelo.
- `output_payload`: Resposta gerada e metadados de inferência.
- `confidence_score`: Nível de certeza da decisão (0.000 a 1.000).
- `latency_ms`: Tempo de resposta para controle de SLA.
- `status`: `success`, `failed`, ou `flagged_for_review`.

### 3.2. Mecanismo Human-in-the-loop
Casos em que o `confidence_score` é inferior a 0.85 ou em que termos críticos de segurança (alergias severas, interações de alto risco, intenção suicida) são detectados recebem automaticamente o status `flagged_for_review`, notificando a equipe de supervisão clínica no painel administrativo `/admin/ia-auditoria`.
