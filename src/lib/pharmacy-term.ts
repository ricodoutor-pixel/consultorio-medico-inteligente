export const PHARMACY_TERM_VERSION = "v2026.1";

export const PHARMACY_TERM_TITLE =
  "Termo de Responsabilidade, Veracidade de Dados e Credenciamento de Farmácia / Dispensário";

export const PHARMACY_TERM_TEXT = `TERMO DE RESPONSABILIDADE, VERACIDADE DE DADOS E CREDENCIAMENTO — ${PHARMACY_TERM_VERSION}

Intermediadora: PLANTA Y RAIZ LTDA — CNPJ 58.283.475/0001-00, plataforma de intermediação tecnológica (CNAE 6209-1/00). A Planta y Raiz NÃO é farmácia, NÃO é clínica e NÃO dispensa, armazena, manipula, importa ou transporta medicamentos.

1. VERACIDADE DOS DADOS
1.1. O CREDENCIADO declara, sob as penas da lei, que todos os dados cadastrais informados (razão social, nome fantasia, CNPJ, endereço, telefone, e-mail, chave Pix, dados do farmacêutico responsável técnico, número de CRF e UF, autorizações ANVISA — AFE/AE e alvará sanitário) são verdadeiros, atuais, completos e de sua exclusiva responsabilidade.
1.2. Todos os documentos enviados no processo de homologação (KYC) são autênticos, íntegros, não adulterados e correspondem à pessoa jurídica credenciada.
1.3. A prestação de informação ou documento falso sujeita o CREDENCIADO às sanções dos arts. 297, 298 e 299 do Código Penal (falsidade documental e ideológica), além de responsabilização civil por perdas e danos.

2. RESPONSABILIDADE REGULATÓRIA E SANITÁRIA
2.1. O CREDENCIADO é o único e exclusivo responsável pela regularidade sanitária de sua operação, observando a RDC 327/2019, a RDC 660/2022, a RDC 786/2023 (quando aplicável), as normas do Conselho Regional de Farmácia e a legislação municipal e estadual pertinente.
2.2. A dispensação de produtos sujeitos a controle especial somente ocorrerá mediante prescrição válida, sob supervisão do farmacêutico responsável técnico indicado no cadastro.
2.3. O CREDENCIADO responde integralmente pela qualidade, procedência, rastreabilidade, validade, guarda, conservação, embalagem, faturamento fiscal, transporte e entrega dos produtos comercializados.
2.4. Cabe ao CREDENCIADO manter válidas e atualizadas todas as licenças; a perda, suspensão ou vencimento de qualquer licença deve ser comunicada em até 48 horas e implica suspensão imediata da vitrine.

3. RESPONSABILIDADE CIVIL, FISCAL E CONSUMERISTA
3.1. O CREDENCIADO é o fornecedor perante o Código de Defesa do Consumidor, respondendo por vício, defeito, troca, devolução, extravio, atraso e eventos adversos relacionados aos produtos.
3.2. O CREDENCIADO é o responsável tributário pela emissão de nota fiscal de cada venda e pelo recolhimento de todos os tributos incidentes.
3.3. O CREDENCIADO isenta e indeniza a Planta y Raiz Ltda, seus sócios, prepostos e profissionais de saúde parceiros de qualquer autuação, reclamação, ação judicial, administrativa ou sanitária decorrente de sua operação, dados ou documentos.

4. INTERMEDIAÇÃO, REPASSE E TAXAS
4.1. A Planta y Raiz atua exclusivamente como intermediadora tecnológica de pedidos e pagamentos, retendo taxa de intermediação de 5% sobre o valor dos produtos faturados no marketplace, sendo 95% repassados ao CREDENCIADO.
4.2. O repasse depende de conta de recebimento válida (Pix e/ou conta Mercado Pago vinculada) informada pelo próprio CREDENCIADO, que responde por sua titularidade e correção.
4.3. Chargebacks, estornos, fraudes de terceiros e devoluções podem ser descontados de repasses futuros.

5. DADOS PESSOAIS E SIGILO (LGPD)
5.1. O CREDENCIADO trata os dados de pacientes e as prescrições recebidas exclusivamente para a finalidade de dispensação, sob sigilo, observando a Lei 13.709/2018.
5.2. É vedado usar dados de pacientes para marketing próprio, revenda, enriquecimento de base ou qualquer finalidade estranha à dispensação.

6. HOMOLOGAÇÃO, SUSPENSÃO E DESCREDENCIAMENTO
6.1. O cadastro nasce com status "em análise" e somente é exibido na vitrine após aprovação do compliance da Planta y Raiz.
6.2. A Planta y Raiz pode suspender ou descredenciar imediatamente, sem ônus, o CREDENCIADO em caso de dado ou documento falso, irregularidade sanitária, reclamações reiteradas, suspeita de fraude ou risco ao paciente.

7. ASSINATURA ELETRÔNICA
7.1. O aceite deste termo é feito por assinatura eletrônica (art. 10, §2º, da MP 2.200-2/2001), com registro de nome e documento do signatário, versão do termo, resumo criptográfico do texto, navegador e data/hora, servindo como prova para todos os fins legais.
7.2. Foro: comarca de São Paulo/SP.`;

/** SHA-256 hex do texto do termo — prova de qual versão foi aceita. */
export async function hashPharmacyTerm(text = PHARMACY_TERM_TEXT): Promise<string> {
  const bytes = new TextEncoder().encode(`${PHARMACY_TERM_VERSION}::${text}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
