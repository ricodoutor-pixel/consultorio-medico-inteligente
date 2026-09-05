/**
 * Serviço de Geração e Exportação de Guias no Padrão TISS da ANS (Versão 4.01.00)
 * 
 * Normativa: Resolução Normativa ANS nº 501/2022 e Padrão TISS Componente de Conteúdo e Estrutura.
 * Finalidade: Permitir que o paciente ou a clínica exporte o arquivo XML padronizado
 * para solicitação de reembolso junto a operadoras de planos de saúde (Saúde Suplementar).
 */

export interface TissConsultaData {
  numeroGuiaPrestador: string;
  numeroGuiaOperadora?: string;
  dataAtendimento: string; // YYYY-MM-DD
  horaInicioAtendimento?: string; // HH:MM:SS
  horaFimAtendimento?: string; // HH:MM:SS
  tipoConsulta?: "1" | "2"; // 1 - Primeira Consulta, 2 - Retorno

  // Beneficiário (Paciente)
  numeroCarteira?: string;
  nomeBeneficiario: string;
  cpfBeneficiario?: string;
  registroAnsOperadora?: string;
  nomeOperadora?: string;

  // Prestador Contratado (Planta y Raiz / Clínica)
  codigoPrestadorNaOperadora?: string;
  nomeContratado?: string;
  cnpjContratado?: string;
  cnes?: string;

  // Profissional Executante (Médico)
  nomeProfissional: string;
  conselhoProfissional?: "CRM" | "CRO" | "CRN";
  numeroConselho: string;
  ufConselho: string;
  cbo?: string; // Código Brasileiro de Ocupações

  // Dados do Atendimento e Procedimento TUSS
  codigoProcedimentoTuss?: string; // Padrão: 10101012 (Consulta em consultório / telemedicina)
  descricaoProcedimento?: string;
  valorProcedimento: number;
  cid10?: string;
  indicacaoAcidente?: "0" | "1" | "2"; // 0 - Não acidente, 1 - Trabalho, 2 - Trânsito
  observacao?: string;
}

/**
 * Escapa caracteres reservados em nós XML
 */
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formata data ISO para o formato aceito no padrão TISS (YYYY-MM-DD)
 */
function formatTissDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString().slice(0, 10);
  try {
    return new Date(rawDate).toISOString().slice(0, 10);
  } catch {
    return rawDate.slice(0, 10);
  }
}

/**
 * Converte valor numérico em decimal com duas casas (ex: 250.00)
 */
function formatTissCurrency(amount: number): string {
  return Number(amount || 0).toFixed(2);
}

/**
 * Gera a mensagem XML no padrão TISS 4.01.00 para Guia de Consulta
 */
export function generateTissConsultaXml(data: TissConsultaData): string {
  const dataFormatada = formatTissDate(data.dataAtendimento);
  const dataHoraTransacao = `${dataFormatada}T12:00:00`;
  const seqTransacao = Math.floor(Date.now() / 1000);
  const regAns = data.registroAnsOperadora || "000000";
  const codProcedimento = data.codigoProcedimentoTuss || "10101012";
  const descProcedimento = data.descricaoProcedimento || "Consulta Médica em Atenção Especializada (Telemedicina)";
  const valorFormatado = formatTissCurrency(data.valorProcedimento);

  return `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>${seqTransacao}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${dataFormatada}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>12:00:00</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:cnpj>${escapeXml(data.cnpjContratado || "00000000000000")}</ans:cnpj>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>${escapeXml(regAns)}</ans:registroANS>
    </ans:destino>
    <ans:padrao>4.01.00</ans:padrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${seqTransacao}</ans:numeroLote>
      <ans:guiasTISS>
        <ans:guiaConsulta>
          <ans:cabecalhoGuia>
            <ans:registroANS>${escapeXml(regAns)}</ans:registroANS>
            <ans:numeroGuiaPrestador>${escapeXml(data.numeroGuiaPrestador)}</ans:numeroGuiaPrestador>
            ${data.numeroGuiaOperadora ? `<ans:numeroGuiaOperadora>${escapeXml(data.numeroGuiaOperadora)}</ans:numeroGuiaOperadora>` : ""}
          </ans:cabecalhoGuia>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>${escapeXml(data.numeroCarteira || "Não informado")}</ans:numeroCarteira>
            <ans:nomeBeneficiario>${escapeXml(data.nomeBeneficiario)}</ans:nomeBeneficiario>
            ${data.cpfBeneficiario ? `<ans:cpfBeneficiario>${escapeXml(data.cpfBeneficiario.replace(/\D/g, ""))}</ans:cpfBeneficiario>` : ""}
            <ans:atendimentoRN>N</ans:atendimentoRN>
          </ans:dadosBeneficiario>
          <ans:dadosContratado>
            <ans:codigoPrestadorNaOperadora>${escapeXml(data.codigoPrestadorNaOperadora || "PREST-001")}</ans:codigoPrestadorNaOperadora>
            <ans:nomeContratado>${escapeXml(data.nomeContratado || "Planta y Raiz Serviços Médicos e Tecnológicos")}</ans:nomeContratado>
            <ans:CNES>${escapeXml(data.cnes || "0000000")}</ans:CNES>
          </ans:dadosContratado>
          <ans:dadosProfissionalExecutante>
            <ans:nomeProfissional>${escapeXml(data.nomeProfissional)}</ans:nomeProfissional>
            <ans:conselhoProfissional>${escapeXml(data.conselhoProfissional || "CRM")}</ans:conselhoProfissional>
            <ans:numeroConselhoProfissional>${escapeXml(data.numeroConselho.replace(/\D/g, ""))}</ans:numeroConselhoProfissional>
            <ans:UF>${escapeXml(data.ufConselho || "SP")}</ans:UF>
            <ans:CBOS>${escapeXml(data.cbo || "225125")}</ans:CBOS>
          </ans:dadosProfissionalExecutante>
          <ans:dadosAtendimento>
            <ans:dataAtendimento>${dataFormatada}</ans:dataAtendimento>
            <ans:tipoConsulta>${data.tipoConsulta || "1"}</ans:tipoConsulta>
            <ans:procedimento>
              <ans:codigoTabela>22</ans:codigoTabela>
              <ans:codigoProcedimento>${escapeXml(codProcedimento)}</ans:codigoProcedimento>
              <ans:descricaoProcedimento>${escapeXml(descProcedimento)}</ans:descricaoProcedimento>
              <ans:quantidadeExecutada>1</ans:quantidadeExecutada>
              <ans:valorProcedimento>${valorFormatado}</ans:valorProcedimento>
            </ans:procedimento>
          </ans:dadosAtendimento>
          ${data.cid10 ? `
          <ans:hipoteseDiagnostica>
            <ans:tabelaDiagnostico>CID-10</ans:tabelaDiagnostico>
            <ans:diagnostico>${escapeXml(data.cid10)}</ans:diagnostico>
          </ans:hipoteseDiagnostica>` : ""}
          <ans:observacao>${escapeXml(data.observacao || "Consulta por telemedicina com consentimento livre e esclarecido.")}</ans:observacao>
          <ans:valorTotal>
            <ans:valorTotalGeral>${valorFormatado}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaConsulta>
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>${seqTransacao}</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;
}

/**
 * Dispara o download automático do arquivo XML TISS no navegador
 */
export function downloadTissXml(data: TissConsultaData, customFilename?: string): void {
  const xmlContent = generateTissConsultaXml(data);
  const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
  const filename = customFilename || `guia_tiss_${data.numeroGuiaPrestador.replace(/[^a-zA-Z0-9]/g, "_")}.xml`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
