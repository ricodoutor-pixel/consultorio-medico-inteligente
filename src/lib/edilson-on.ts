/**
 * Identidade pública oficial da Orientação Técnica (decisão do Dr. Edilson, 14/11/2026).
 *
 * Toda tela, mensagem e e-mail que apresenta a Orientação Técnica usa "Dr. Edilson Bezerra ON":
 * um assistente de inteligência artificial supervisionado pelo médico humano Dr. Edilson Bezerra,
 * cujo registro médico é boliviano (nº 10963) e cujo atendimento presencial é em Santa Cruz de la Sierra.
 * Nunca apresentar o registro como CRM brasileiro (ex.: "CRM-CE", "CRM-SP").
 * Espelho para as funções do servidor: supabase/functions/_shared/clinic-info.ts.
 */
export const EDILSON_ON_NAME = "Dr. Edilson Bezerra ON";
export const EDILSON_SUPERVISOR_NAME = "Dr. Edilson Bezerra";
export const EDILSON_REGISTRATION = "registro médico nº 10963 · Santa Cruz de la Sierra, Bolívia";
export const EDILSON_OFFICE = "atendimento presencial: Edifício Ecodent, 1º Anillo, Santa Cruz de la Sierra, Bolívia";

export const EDILSON_ON_SUPERVISION =
  `${EDILSON_ON_NAME} é um assistente de inteligência artificial supervisionado pelo médico ${EDILSON_SUPERVISOR_NAME} ` +
  `(${EDILSON_REGISTRATION}; ${EDILSON_OFFICE}).`;

export const OT_FIRST_STEP_NOTICE =
  "A Orientação Técnica é apenas o início do cuidado: é educativa, não é consulta médica, não faz diagnóstico e não prescreve. " +
  "O tratamento começa na consulta com um médico habilitado.";
