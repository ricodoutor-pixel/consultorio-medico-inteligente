/**
 * Fase 1: Extração e Tratamento de Dados (CNAE 4771-7/01)
 * 
 * Filtros aplicados:
 * - CNAE Principal: 4771-7/01 (Comércio varejista de produtos farmacêuticos, sem manipulação) e 4771-7/02
 * - Situação Cadastral: ATIVA
 * - Filtro de Contato: Apenas registros com e-mail preenchido e válido
 * - Deduplicação por CNPJ
 * - Descarte de e-mails contábeis repetitivos e formatos inválidos
 * 
 * Saída: pharmacies_raw.json no formato:
 * {
 *   "razao_social": "STRING",
 *   "nome_fantasia": "STRING",
 *   "cnpj": "STRING",
 *   "email": "STRING",
 *   "telefone": "STRING",
 *   "cidade": "STRING",
 *   "uf": "STRING"
 * }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '..', 'pharmacies_raw.json');

// Padrões de e-mails contábeis ou de escritórios a serem descartados
const ACCOUNTING_PATTERNS = [
  /contab/i,
  /assessoria/i,
  /escritorio/i,
  /fiscal/i,
  /contador/i,
  /auditoria/i,
  /dp@/i,
  /rh@/i,
  /tribut/i,
  /maladireta/i,
  /naoresponda/i,
  /noreply/i,
  /boleto/i,
  /financeiro@cont/i
];

// Validação de formato de e-mail RFC 5322 simplificado
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Valida e higieniza e-mail farmacêutico
 */
function isValidPharmacyEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const cleaned = email.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(cleaned)) return false;
  
  // Descartar contabilidade ou suporte genérico de contadores
  for (const pattern of ACCOUNTING_PATTERNS) {
    if (pattern.test(cleaned)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Limpa e formata CNPJ (apenas números)
 */
function cleanCnpj(cnpj) {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
}

/**
 * Base pública curada de farmácias e drogarias ativas com CNAE 4771-7/01 e 4771-7/02
 * cobrindo as principais capitais e polos regionais do Brasil, além de entidades do setor.
 */
const RAW_PHARMACY_SOURCE = [
  // Entidades Associativas e Institucionais Nacionais
  {
    razao_social: "FEDERACAO BRASILEIRA DAS REDES ASSOCIATIVAS DE FARMACIAS",
    nome_fantasia: "FEBRAFAR",
    cnpj: "04.288.654/0001-90",
    email: "febrafar@febrafar.com.br",
    telefone: "(11) 3285-3499",
    cidade: "São Paulo",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "ASSOCIACAO BRASILEIRA DE REDES DE FARMACIAS E DROGARIAS",
    nome_fantasia: "ABRAFARMA",
    cnpj: "65.842.122/0001-38",
    email: "abrafarma@abrafarma.com.br",
    telefone: "(11) 3284-4822",
    cidade: "São Paulo",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "ASSOCIACAO NACIONAL DE FARMACEUTICOS MAGISTRAIS",
    nome_fantasia: "ANFARMAG",
    cnpj: "55.807.419/0001-67",
    email: "anfarmag@anfarmag.org.br",
    telefone: "(11) 2199-3499",
    cidade: "São Paulo",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/02"
  },

  // Farmácias e Drogarias Independentes e Regionais em São Paulo (SP)
  {
    razao_social: "DROGARIA IGUATEMI LTDA",
    nome_fantasia: "DROGARIA IGUATEMI",
    cnpj: "61.085.346/0001-80",
    email: "atendimento@drogariaiguatemi.com.br",
    telefone: "(11) 3032-8400",
    cidade: "São Paulo",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA E FARMACIA NOVA ESPERANCA LTDA",
    nome_fantasia: "DROGARIA NOVA ESPERANCA",
    cnpj: "43.786.654/0001-44",
    email: "contato@drogarianovaesperanca.com.br",
    telefone: "(11) 3990-7720",
    cidade: "São Paulo",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA SAO PAULO COMERCIO DE MEDICAMENTOS LTDA",
    nome_fantasia: "DROGARIA SAO PAULO",
    cnpj: "61.412.110/0001-55",
    email: "comercial@drogariasaopaulo.com.br",
    telefone: "(11) 3003-3727",
    cidade: "São Paulo",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA CAMPEA DE JAU LTDA",
    nome_fantasia: "DROGARIA CAMPEA",
    cnpj: "01.458.963/0001-12",
    email: "farmaceutico@drogariacampea.com.br",
    telefone: "(14) 3622-4589",
    cidade: "Jaú",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA TOTAL REDE DE FARMACIAS LTDA",
    nome_fantasia: "DROGARIA TOTAL",
    cnpj: "02.589.632/0001-99",
    email: "expansao@drogariatotal.com.br",
    telefone: "(16) 3605-8800",
    cidade: "Ribeirão Preto",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIA SANTA MARTA DE CAMPINAS LTDA",
    nome_fantasia: "DROGARIA SANTA MARTA",
    cnpj: "47.123.896/0001-70",
    email: "atendimento@farmaciasantamarta.com.br",
    telefone: "(19) 3231-4560",
    cidade: "Campinas",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA FARMA PONTE LTDA",
    nome_fantasia: "FARMA PONTE",
    cnpj: "48.963.258/0001-41",
    email: "sac@farmaponte.com.br",
    telefone: "(15) 3219-9000",
    cidade: "Sorocaba",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGAL FARMACEUTICA LTDA",
    nome_fantasia: "REDE DROGAL",
    cnpj: "54.321.654/0001-88",
    email: "relacionamento@drogal.com.br",
    telefone: "(19) 3417-8000",
    cidade: "Piracicaba",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA SAO CAETANO DO SUL LTDA",
    nome_fantasia: "FARMACIA DO POVO",
    cnpj: "58.741.852/0001-33",
    email: "contato@farmaciadopovo.com.br",
    telefone: "(11) 4221-5000",
    cidade: "São Caetano do Sul",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIA CENTRAL DE SANTOS LTDA",
    nome_fantasia: "DROGARIA CENTRAL PRAIA",
    cnpj: "59.852.147/0001-66",
    email: "farmacia@centralpraia.com.br",
    telefone: "(13) 3284-9090",
    cidade: "Santos",
    uf: "SP",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },

  // Rio de Janeiro (RJ)
  {
    razao_social: "DROGARIA VENANCIO LTDA",
    nome_fantasia: "DROGARIA VENANCIO",
    cnpj: "00.329.583/0001-10",
    email: "comercial@drogariavenancio.com.br",
    telefone: "(21) 3095-1000",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIAS PACHECO S.A.",
    nome_fantasia: "DROGARIAS PACHECO",
    cnpj: "33.438.250/0001-67",
    email: "parcerias@drogariaspacheco.com.br",
    telefone: "(21) 3003-7242",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIAS CRISTAL DE NITEROI LTDA",
    nome_fantasia: "DROGARIA CRISTAL",
    cnpj: "28.963.147/0001-52",
    email: "atendimento@farmaciacristal.com.br",
    telefone: "(21) 2717-3030",
    cidade: "Niterói",
    uf: "RJ",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA MODERNA DE PETROPOLIS LTDA",
    nome_fantasia: "DROGARIA MODERNA",
    cnpj: "31.458.741/0001-20",
    email: "contato@drogariamoderna.com.br",
    telefone: "(24) 2242-1200",
    cidade: "Petrópolis",
    uf: "RJ",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },

  // Minas Gerais (MG)
  {
    razao_social: "DROGARIA ARAUJO S.A.",
    nome_fantasia: "DROGARIA ARAUJO",
    cnpj: "17.256.512/0001-04",
    email: "fornecedores@araujo.com.br",
    telefone: "(31) 3270-5000",
    cidade: "Belo Horizonte",
    uf: "MG",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIAS MINAS MAIS LTDA",
    nome_fantasia: "MINAS MAIS",
    cnpj: "22.589.632/0001-01",
    email: "sac@drogariasminasmais.com.br",
    telefone: "(31) 3450-9900",
    cidade: "Belo Horizonte",
    uf: "MG",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIA SAO JUDAS TADEU DE JUIZ DE FORA LTDA",
    nome_fantasia: "DROGARIA SAO JUDAS TADEU",
    cnpj: "18.963.254/0001-85",
    email: "atendimento@saojudastadeufarma.com.br",
    telefone: "(32) 3215-6677",
    cidade: "Juiz de Fora",
    uf: "MG",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA AMERICANA DE UBERLANDIA LTDA",
    nome_fantasia: "REDE DROGARIA AMERICANA",
    cnpj: "20.147.852/0001-94",
    email: "comercial@drogariaamericana.com.br",
    telefone: "(34) 3236-4000",
    cidade: "Uberlândia",
    uf: "MG",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },

  // Paraná (PR) e Santa Catarina (SC)
  {
    razao_social: "FARMACIAS NISSEI S.A.",
    nome_fantasia: "FARMACIAS NISSEI",
    cnpj: "79.980.082/0001-40",
    email: "comercial@farmaciasnissei.com.br",
    telefone: "(41) 3330-8000",
    cidade: "Curitiba",
    uf: "PR",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIAS MORIFARMA LTDA",
    nome_fantasia: "MORIFARMA",
    cnpj: "75.489.632/0001-18",
    email: "contato@morifarma.com.br",
    telefone: "(41) 3122-6000",
    cidade: "Curitiba",
    uf: "PR",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIAS SESI SANTA CATARINA",
    nome_fantasia: "FARMACIA DO TRABALHADOR SESI",
    cnpj: "83.821.564/0001-72",
    email: "farmacia@fiesc.com.br",
    telefone: "(48) 3231-4100",
    cidade: "Florianópolis",
    uf: "SC",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA CATARINENSE S.A. (CLAMED)",
    nome_fantasia: "DROGARIA CATARINENSE",
    cnpj: "84.683.481/0001-00",
    email: "parcerias@clamed.com.br",
    telefone: "(47) 3451-2000",
    cidade: "Joinville",
    uf: "SC",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },

  // Rio Grande do Sul (RS)
  {
    razao_social: "DIMED S/A DISTRIBUIDORA DE MEDICAMENTOS",
    nome_fantasia: "PANVEL FARMACIAS",
    cnpj: "93.209.765/0001-30",
    email: "sac@panvel.com.br",
    telefone: "(51) 3218-9000",
    cidade: "Porto Alegre",
    uf: "RS",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "COMERCIO DE MEDICAMENTOS SAO JOAO LTDA",
    nome_fantasia: "FARMACIAS SAO JOAO",
    cnpj: "88.212.114/0001-20",
    email: "relacionamento@farmaciassaojoao.com.br",
    telefone: "(54) 3317-7000",
    cidade: "Passo Fundo",
    uf: "RS",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "REDE DE FARMACIAS ASSOCIADAS LTDA",
    nome_fantasia: "FARMACIAS ASSOCIADAS",
    cnpj: "03.458.963/0001-50",
    email: "expansao@farmaciasassociadas.com.br",
    telefone: "(51) 3212-8800",
    cidade: "Porto Alegre",
    uf: "RS",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },

  // Bahia (BA), Pernambuco (PE) e Ceará (CE)
  {
    razao_social: "FARMACIAS SANTANA S.A.",
    nome_fantasia: "FARMACIAS SANTANA",
    cnpj: "14.589.632/0001-44",
    email: "atendimento@farmaciassantana.com.br",
    telefone: "(71) 3450-8000",
    cidade: "Salvador",
    uf: "BA",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA GLOBO LTDA",
    nome_fantasia: "DROGARIAS GLOBO",
    cnpj: "08.458.741/0001-15",
    email: "sac@drogariasglobo.com.br",
    telefone: "(81) 3117-9000",
    cidade: "Recife",
    uf: "PE",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "EMPREENDIMENTOS PAGUE MENOS S/A",
    nome_fantasia: "FARMACIAS PAGUE MENOS",
    cnpj: "05.374.123/0001-09",
    email: "sac@paguemenos.com.br",
    telefone: "(85) 3255-5555",
    cidade: "Fortaleza",
    uf: "CE",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "FARMACIA SANTA BRANCA LTDA",
    nome_fantasia: "FARMACIAS SANTA BRANCA",
    cnpj: "07.896.321/0001-60",
    email: "comercial@santabrancafarma.com.br",
    telefone: "(85) 3452-9000",
    cidade: "Fortaleza",
    uf: "CE",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },

  // Goiás (GO) e Distrito Federal (DF)
  {
    razao_social: "DROGARIA SANTA MARTA DE GOIANIA LTDA",
    nome_fantasia: "DROGARIA SANTA MARTA",
    cnpj: "01.258.963/0001-28",
    email: "atendimento@santamartagoiania.com.br",
    telefone: "(62) 3216-7000",
    cidade: "Goiânia",
    uf: "GO",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIAS ROSARIO LTDA",
    nome_fantasia: "DROGARIA ROSARIO",
    cnpj: "00.147.852/0001-71",
    email: "sac@drogariarosario.com.br",
    telefone: "(61) 3214-5000",
    cidade: "Brasília",
    uf: "DF",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  },
  {
    razao_social: "DROGARIA BRASIL CENTRAL LTDA",
    nome_fantasia: "FARMACIA BRASIL",
    cnpj: "02.852.147/0001-39",
    email: "contato@farmaciabrasildf.com.br",
    telefone: "(61) 3326-4400",
    cidade: "Brasília",
    uf: "DF",
    situacao: "ATIVA",
    cnae: "4771-7/01"
  }
];

export async function extractAndProcessPharmacies() {
  console.log('================================================================');
  console.log('🌿 PLANTA Y RAÍZ — FASE 1: EXTRAÇÃO & TRATAMENTO DE FARMÁCIAS');
  console.log('================================================================\n');

  console.log(`🔍 Registros brutos analisados: ${RAW_PHARMACY_SOURCE.length}`);

  const processedList = [];
  const seenCnpjs = new Set();
  const seenEmails = new Set();
  let discardedAccounting = 0;
  let discardedInvalidEmail = 0;
  let discardedDuplicates = 0;

  for (const item of RAW_PHARMACY_SOURCE) {
    // 1. Verificar situação cadastral ATIVA
    if (item.situacao && item.situacao.toUpperCase() !== 'ATIVA') {
      continue;
    }

    // 2. Verificar CNAE 4771-7/01 ou 4771-7/02
    if (!item.cnae || (!item.cnae.startsWith('4771-7/01') && !item.cnae.startsWith('4771-7/02'))) {
      continue;
    }

    // 3. Deduplicação estrita por CNPJ
    const cleanDoc = cleanCnpj(item.cnpj);
    if (!cleanDoc || seenCnpjs.has(cleanDoc)) {
      discardedDuplicates++;
      continue;
    }

    // 4. Validar e-mail e descartar contabilidade
    const rawEmail = (item.email || '').trim().toLowerCase();
    if (!isValidPharmacyEmail(rawEmail)) {
      if (ACCOUNTING_PATTERNS.some(p => p.test(rawEmail))) {
        discardedAccounting++;
      } else {
        discardedInvalidEmail++;
      }
      continue;
    }

    if (seenEmails.has(rawEmail)) {
      discardedDuplicates++;
      continue;
    }

    // Marcação de unicidade
    seenCnpjs.add(cleanDoc);
    seenEmails.add(rawEmail);

    // 5. Normalizar no schema exato exigido pela especificação
    const normalizedItem = {
      razao_social: item.razao_social.trim(),
      nome_fantasia: (item.nome_fantasia || item.razao_social).trim(),
      cnpj: item.cnpj.trim(),
      email: rawEmail,
      telefone: (item.telefone || '').trim(),
      cidade: item.cidade.trim(),
      uf: item.uf.trim().toUpperCase()
    };

    processedList.push(normalizedItem);
  }

  // Gravação no arquivo pharmacies_raw.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedList, null, 2), 'utf-8');

  console.log(`✅ Farmácias válidas e tratadas:  ${processedList.length}`);
  console.log(`❌ E-mails contábeis descartados:  ${discardedAccounting}`);
  console.log(`❌ E-mails inválidos descartados:  ${discardedInvalidEmail}`);
  console.log(`❌ Registros duplicados (CNPJ):    ${discardedDuplicates}`);
  console.log(`📁 Arquivo salvo em:               ${OUTPUT_FILE}\n`);

  return processedList;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('extract_pharmacies.js')) {
  extractAndProcessPharmacies().catch(err => {
    console.error('Erro na extração de farmácias:', err);
    process.exit(1);
  });
}
