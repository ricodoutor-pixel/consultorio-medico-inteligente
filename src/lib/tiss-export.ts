/**
 * Geração de Guia TISS (padrão ANS TISS 4.01.00) para solicitação de
 * reembolso de consultas de telemedicina pelo próprio paciente.
 *
 * Escopo: guia de "Consulta" no formato de mensagem TISS simplificada,
 * aceita pelas operadoras para reembolso (anexo do recibo médico).
 */

const TISS_VERSION = "4.01.00";

export interface TissInvoiceInput {
  id: string;
  nfe_number: string;
  nfe_verification_code: string;
  gross_amount: number;
  created_at: string;
  recipient_name: string;
  recipient_cpf_cnpj: string;
  doctor_name?: string;
  doctor_crm?: string;
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const isoDate = (v: string) => new Date(v).toISOString().slice(0, 10);
const isoTime = (v: string) => new Date(v).toISOString().slice(11, 16);
const money = (v: number) => (Number(v) || 0).toFixed(2);

/** Monta o XML da guia TISS 4.01.00 (mensagem de solicitação de reembolso). */
export function buildTissGuiaXml(inv: TissInvoiceInput): string {
  const seq = onlyDigits(inv.nfe_number).slice(-12) || "000000000001";
  const date = isoDate(inv.created_at);
  const time = isoTime(inv.created_at);

  return `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>SOLICITACAO_REEMBOLSO</ans:tipoTransacao>
      <ans:sequencialTransacao>${esc(seq)}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${esc(date)}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>${esc(time)}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:CNPJ>52998224000101</ans:CNPJ>
        <ans:nomePrestador>PLANTA Y RAIZ LTDA - Plataforma de Intermediacao Tecnologica</ans:nomePrestador>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>000000</ans:registroANS>
    </ans:destino>
    <ans:versaoPadrao>${TISS_VERSION}</ans:versaoPadrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:guiaConsulta>
      <ans:numeroGuiaPrestador>${esc(inv.nfe_number)}</ans:numeroGuiaPrestador>
      <ans:dadosBeneficiario>
        <ans:nomeBeneficiario>${esc(inv.recipient_name)}</ans:nomeBeneficiario>
        <ans:numeroCPF>${esc(onlyDigits(inv.recipient_cpf_cnpj))}</ans:numeroCPF>
      </ans:dadosBeneficiario>
      <ans:contratadoExecutante>
        <ans:nomeProfissional>${esc(inv.doctor_name ?? "Medico(a) Prescritor(a)")}</ans:nomeProfissional>
        <ans:conselhoProfissional>06</ans:conselhoProfissional>
        <ans:numeroConselhoProfissional>${esc(onlyDigits(inv.doctor_crm))}</ans:numeroConselhoProfissional>
        <ans:UF>SP</ans:UF>
        <ans:CBOS>225125</ans:CBOS>
      </ans:contratadoExecutante>
      <ans:dadosAtendimento>
        <ans:dataAtendimento>${esc(date)}</ans:dataAtendimento>
        <ans:tipoConsulta>1</ans:tipoConsulta>
        <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
        <ans:tipoSaida>1</ans:tipoSaida>
        <ans:regimeAtendimento>07</ans:regimeAtendimento>
        <ans:procedimento>
          <ans:codigoTabela>22</ans:codigoTabela>
          <ans:codigoProcedimento>10101039</ans:codigoProcedimento>
          <ans:descricaoProcedimento>Consulta medica em telemedicina (CFM 2.314/2022)</ans:descricaoProcedimento>
          <ans:valorProcedimento>${money(inv.gross_amount)}</ans:valorProcedimento>
        </ans:procedimento>
        <ans:valorTotalGuia>${money(inv.gross_amount)}</ans:valorTotalGuia>
      </ans:dadosAtendimento>
      <ans:autenticacaoDocumento>
        <ans:codigoVerificacao>${esc(inv.nfe_verification_code)}</ans:codigoVerificacao>
      </ans:autenticacaoDocumento>
    </ans:guiaConsulta>
  </ans:prestadorParaOperadora>
</ans:mensagemTISS>`;
}

/** Dispara o download do arquivo XML da guia TISS no navegador. */
export function downloadTissGuia(inv: TissInvoiceInput) {
  const xml = buildTissGuiaXml(inv);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `guia-tiss-${TISS_VERSION}-${onlyDigits(inv.nfe_number) || inv.id}.xml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
