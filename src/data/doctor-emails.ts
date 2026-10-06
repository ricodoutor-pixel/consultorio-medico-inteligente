// src/data/doctor-emails.ts
/**
 * Mapeamento oficial de contatos, e-mails e CPFs dos médicos credenciados
 * para enriquecer a visualização nas esteiras KYC e no painel administrativo.
 */

export interface DoctorContactInfo {
  crm: string;
  crm_state?: string;
  email: string;
  phone?: string;
  cpf?: string;
}

export const DOCTOR_CONTACTS_MAP: Record<string, DoctorContactInfo> = {
  // Novos Médicos Cadastrados
  "206873": {
    crm: "206873",
    crm_state: "SP",
    email: "contato@doutorvictorfonseca.com",
    phone: "+55 11 5304-5378",
    cpf: "416.481.018-10",
  },
  "21907": {
    crm: "21907",
    crm_state: "PR",
    email: "acupetcbd@gmail.com",
    phone: "+55 41 98709-9186",
    cpf: "091.741.369-50",
  },
  "16301": {
    crm: "16301",
    crm_state: "SC",
    email: "sadi.blumenau@gmail.com",
    phone: "+55 48 99660-9299",
    cpf: "526.984.320-04",
  },
  "98083": {
    crm: "98083",
    crm_state: "MG",
    email: "drageovanamozaner@gmail.com",
    phone: "+55 32 98459-9585",
    cpf: "333.686.908-09",
  },
  "190386": {
    crm: "190386",
    crm_state: "SP",
    email: "dragracelopes66@gmail.com",
    phone: "+55 11 99990-3567",
    cpf: "393.334.185-04",
  },
  "190.386": {
    crm: "190.386",
    crm_state: "SP",
    email: "dragracelopes66@gmail.com",
    phone: "+55 11 99990-3567",
    cpf: "393.334.185-04",
  },

  // Médicos da Plataforma
  "10963": {
    crm: "10963",
    crm_state: "CE",
    email: "contato@plantayraiz.com.br",
    phone: "5511991363154",
  },
  "11496": {
    crm: "11496",
    crm_state: "SC",
    email: "lrmsbob2@terra.com.br",
    phone: "5548991640474",
  },
  "85182": {
    crm: "85182",
    crm_state: "MG",
    email: "leumaservicosmedicos@gmail.com",
    phone: "5534984230802",
  },
  "12361": {
    crm: "12361",
    crm_state: "SC",
    email: "babymatos@hotmail.com",
    phone: "5547988583209",
  },
  "14828": {
    crm: "14828",
    crm_state: "PB",
    email: "diegocartaxo2010@gmail.com",
    phone: "5583991065591",
  },
  "19333": {
    crm: "CRMV 19333",
    crm_state: "SP",
    email: "edu.correa.vet@gmail.com",
    phone: "5511989658971",
  },
  "520668646": {
    crm: "520668646",
    crm_state: "RJ",
    email: "josercoutinho@gmail.com",
    phone: "5521994383205",
  },
  "36942": {
    crm: "36942",
    crm_state: "PR",
    email: "dranapaulaflima@gmail.com",
    phone: "5541999261143",
  },
  "7684": {
    crm: "7684",
    crm_state: "RO",
    email: "gustavo.ibanez@hotmail.com",
    phone: "5569992090408",
  },
  "49694": {
    crm: "49694",
    crm_state: "PR",
    email: "guilhermeccampos2@gmail.com",
    phone: "5542942882447",
  },
  "10346": {
    crm: "10346",
    crm_state: "MT",
    email: "dcollombo@hotmail.com",
    phone: "5566999016293",
  },
  "32584": {
    crm: "32584",
    crm_state: "MG",
    email: "jgabbade@yahoo.com.br",
    phone: "5534991329749",
  },
  "42912": {
    crm: "42912",
    crm_state: "RS",
    email: "jpdetoni@yahoo.com.br",
    phone: "5554993646065",
  },
  "52580846": {
    crm: "52580846",
    crm_state: "RJ",
    email: "dra.angela.acevedo@gmail.com",
    phone: "5524988086117",
  },
  "216629": {
    crm: "216629",
    crm_state: "SP",
    email: "icmpmed2@gmail.com",
    phone: "5513996416044",
  },
  "9060": {
    crm: "9060",
    crm_state: "SE",
    email: "dradeonis@gmail.com",
    phone: "5545998150110",
  },
  "16118": {
    crm: "16118",
    crm_state: "PB",
    email: "albertmedicina18@gmail.com",
    phone: "5583981011876",
  },
  "34660": {
    crm: "34660",
    crm_state: "PE",
    email: "albertmedicina18@gmail.com",
    phone: "5583981011876",
  },
  "17266": {
    crm: "17266",
    crm_state: "PB",
    email: "alexgoju2@gmail.com",
    phone: "5583981145210",
  },
  "35632": {
    crm: "35632",
    crm_state: "PR",
    email: "drgustavodamiani@gmail.com",
    phone: "5545991421515",
  },
  "12110": {
    crm: "12110",
    crm_state: "MS",
    email: "marihcoimbra@gmail.com",
    phone: "5567999548255",
  },
};

export function getDoctorEmail(nameOrCrm?: string | null): string | undefined {
  if (!nameOrCrm) return undefined;
  const str = nameOrCrm.toLowerCase();

  for (const [key, info] of Object.entries(DOCTOR_CONTACTS_MAP)) {
    if (str.includes(key.toLowerCase())) return info.email;
  }

  if (str.includes("victor") && str.includes("fonseca")) return "contato@doutorvictorfonseca.com";
  if (str.includes("otavio") || str.includes("otávio") || str.includes("bassete")) return "acupetcbd@gmail.com";
  if (str.includes("sadi") || str.includes("menta")) return "sadi.blumenau@gmail.com";
  if (str.includes("geovana") || str.includes("mozaner")) return "drageovanamozaner@gmail.com";
  if (str.includes("grace") || str.includes("conceicao") || str.includes("conceição")) return "dragracelopes66@gmail.com";
  if (str.includes("frederico") && str.includes("menezes")) return "fmgsaudeemfamilia@gmail.com";
  if (str.includes("edilson")) return "contato@plantayraiz.com.br";

  return undefined;
}
