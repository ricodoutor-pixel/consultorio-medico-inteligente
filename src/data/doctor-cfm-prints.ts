// src/data/doctor-cfm-prints.ts
/**
 * Mapeamento oficial dos prints de CRM/CFM e documentos comprobatórios
 * salvos em public/cfm_prints/ e src/assets/cfm_prints/
 */
export const DOCTOR_CFM_PRINTS: Record<string, string> = {
  "10963": "/cfm_prints/proof_cpf_edilson.png",
  "32584": "/cfm_prints/dr-jose-geraldo.png",
  "5460": "/cfm_prints/dr-daniel.png",
  "10346": "/cfm_prints/dr-daniel.png",
  "42912": "/cfm_prints/cfm-dr-joao-pedro.png",
  "5266864": "/cfm_prints/cfm-dr-jose-roberto.png",
  "520668646": "/cfm_prints/cfm-dr-jose-roberto.png",
  "5258084": "/cfm_prints/cfm-dra-angela-beatriz.png",
  "52580846": "/cfm_prints/cfm-dra-angela-beatriz.png",
  "35632": "/cfm_prints/cfm-dr-gustavo-nobre.png",
  "7684": "/cfm_prints/cfm-dr-gustavo-simoes.png",
  "34660": "/cfm_prints/cfm-dr-albert-machado.png",
  "16118": "/cfm_prints/cfm-dr-albert-machado.png",
  "49694": "/cfm_prints/cfm-dr-guilherme-campos.png",
  "216629": "/cfm_prints/cfm-dra-ingrid-chiullo.png",
  "17266": "/cfm_prints/cfm-dr-alexandre-stramandinoli.png",
  "9060": "/cfm_prints/cfm-dr-adeonis-oliveira.png",
};

export function getDoctorCfmPrint(nameOrCrm?: string | null): string | null {
  if (!nameOrCrm) return null;
  const str = nameOrCrm.toLowerCase();
  
  for (const [crmKey, path] of Object.entries(DOCTOR_CFM_PRINTS)) {
    if (str.includes(crmKey.toLowerCase())) return path;
  }

  if (str.includes("edilson")) return "/cfm_prints/proof_cpf_edilson.png";
  if (str.includes("geraldo")) return "/cfm_prints/dr-jose-geraldo.png";
  if (str.includes("daniel") && (str.includes("kobayashi") || str.includes("colombo"))) return "/cfm_prints/dr-daniel.png";
  if (str.includes("joao pedro") || str.includes("detoni") || str.includes("girardello")) return "/cfm_prints/cfm-dr-joao-pedro.png";
  if (str.includes("jose roberto") || str.includes("coutinho")) return "/cfm_prints/cfm-dr-jose-roberto.png";
  if (str.includes("angela beatriz") || str.includes("mercado")) return "/cfm_prints/cfm-dra-angela-beatriz.png";
  if (str.includes("gustavo") && (str.includes("nobre") || str.includes("damiani"))) return "/cfm_prints/cfm-dr-gustavo-nobre.png";
  if (str.includes("gustavo") && (str.includes("simoes") || str.includes("llivi"))) return "/cfm_prints/cfm-dr-gustavo-simoes.png";
  if (str.includes("albert") && (str.includes("machado") || str.includes("tenorio"))) return "/cfm_prints/cfm-dr-albert-machado.png";
  if (str.includes("guilherme") && str.includes("campos")) return "/cfm_prints/cfm-dr-guilherme-campos.png";
  if (str.includes("ingrid") && (str.includes("chiullo") || str.includes("miranda"))) return "/cfm_prints/cfm-dra-ingrid-chiullo.png";
  if (str.includes("alexandre") && (str.includes("stramandinoli") || str.includes("corrêa") || str.includes("correa"))) return "/cfm_prints/cfm-dr-alexandre-stramandinoli.png";
  if (str.includes("adeonis")) return "/cfm_prints/cfm-dr-adeonis-oliveira.png";

  return null;
}
