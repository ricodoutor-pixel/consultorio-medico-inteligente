/** Modelos de anamnese/evolução do prontuário. São só estrutura: o médico preenche; nada é presumido. */
export interface AnamnesisTemplate {
  id: string;
  label: string;
  body: string;
}

export const ANAMNESIS_TEMPLATES: AnamnesisTemplate[] = [
  {
    id: "primeira-consulta",
    label: "Primeira consulta (clínica geral)",
    body: `S — SUBJETIVO
Queixa principal:
História da doença atual (início, duração, fatores de melhora/piora):
Antecedentes pessoais (doenças, cirurgias, internações):
Medicamentos em uso:
Alergias:
Hábitos (tabagismo, álcool, outras substâncias, sono, atividade física):
Antecedentes familiares:

O — OBJETIVO (teleconsulta)
Estado geral observado:
Sinais vitais informados pelo paciente (PA, FC, peso, altura):
Exames trazidos:

A — AVALIAÇÃO
Hipótese diagnóstica (CID-10):

P — PLANO
Conduta:
Exames solicitados:
Orientações:
Retorno:`,
  },
  {
    id: "cannabis-dor",
    label: "Cannabis medicinal — dor crônica",
    body: `S — SUBJETIVO
Localização e característica da dor:
Tempo de evolução:
Intensidade (0 a 10) hoje / pior / melhor:
Impacto no sono, humor e funcionalidade:
Tratamentos prévios (medicamentos, doses, resposta, efeitos adversos):
Uso prévio de cannabis (produto, via, dose, resposta):
Medicamentos em uso e alergias:
Comorbidades psiquiátricas, cardiovasculares, hepáticas; gestação/lactação:

O — OBJETIVO
Observações da teleconsulta:
Exames e laudos:

A — AVALIAÇÃO
Diagnóstico (CID-10):
Indicação de terapia canabinoide (justificativa e alternativas consideradas):
Riscos e interações avaliados:

P — PLANO
Produto e concentração:
Esquema de titulação:
Metas terapêuticas e escalas de seguimento:
Termo de consentimento e orientações (direção veicular, armazenamento):
Retorno:`,
  },
  {
    id: "cannabis-ansiedade-sono",
    label: "Cannabis medicinal — ansiedade/insônia",
    body: `S — SUBJETIVO
Sintomas principais e tempo de evolução:
Escalas (GAD-7, PHQ-9, ISI) se aplicadas:
Padrão de sono (latência, despertares, duração):
Gatilhos, uso de álcool, cafeína e telas:
Tratamentos prévios e resposta:
Medicamentos em uso e alergias:
Risco de suicídio avaliado:

O — OBJETIVO
Observações da teleconsulta:

A — AVALIAÇÃO
Diagnóstico (CID-10):
Indicação e alternativas consideradas:

P — PLANO
Conduta farmacológica e não farmacológica (higiene do sono, psicoterapia):
Esquema de titulação, se indicado:
Sinais de alerta orientados:
Retorno:`,
  },
  {
    id: "retorno",
    label: "Retorno / evolução",
    body: `S — SUBJETIVO
Evolução desde a última consulta:
Adesão e esquema atual:
Efeitos adversos:
Intensidade dos sintomas (0 a 10) hoje:

O — OBJETIVO
Observações e exames novos:

A — AVALIAÇÃO
Resposta ao tratamento:

P — PLANO
Ajustes:
Renovação de receita:
Próximo retorno:`,
  },
];

/** Insere o modelo sem apagar o que já foi escrito. */
export function applyTemplate(current: string, template: AnamnesisTemplate): string {
  const base = current.trimEnd();
  return base ? `${base}\n\n${template.body}` : template.body;
}
