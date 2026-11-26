/**
 * Identidade pública oficial da Orientação Técnica (decisão do Dr. Edilson, 25/11/2026; substitui a de 14/11).
 *
 * - A IA nunca usa nome de médico: é sempre "Enfª Brisa, assistente virtual".
 * - A Orientação Técnica é "Orientação Técnica com a Enfª Brisa, assistente virtual", com supervisão técnica
 *   da Dra. Suelen Naves Rodrigues (CRM 49354/PR), igual ao rodapé do site.
 * - Dr. Edilson Bezerra aparece só como fundador: médico com mais de 10 anos de experiência em medicina
 *   integrativa, CEO e fundador da Planta y Raiz. Nunca como supervisor da IA nem com CRM brasileiro.
 * Espelho para as funções do servidor: supabase/functions/_shared/clinic-info.ts.
 * (Nomes das constantes mantidos para não quebrar importações antigas.)
 */
export const EDILSON_ON_NAME = "Enfª Brisa";
export const BRISA_IDENTITY = "Enfª Brisa, assistente virtual";
export const OT_PUBLIC_NAME = "Orientação Técnica com a Enfª Brisa, assistente virtual";

export const TECH_SUPERVISOR = "Dra. Suelen Naves Rodrigues (CRM 49354/PR)";
export const FOUNDER_LINE =
  "Dr. Edilson Bezerra, médico com mais de 10 anos de experiência em medicina integrativa, CEO e fundador da Planta y Raiz";

export const EDILSON_ON_SUPERVISION =
  `${EDILSON_ON_NAME} é uma assistente virtual, com supervisão técnica da ${TECH_SUPERVISOR}.`;

export const OT_FIRST_STEP_NOTICE =
  "A Orientação Técnica é apenas o início do cuidado: é educativa, não é consulta médica, não faz diagnóstico e não prescreve. " +
  "O tratamento começa na consulta com um médico habilitado.";
