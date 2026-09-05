import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Copy, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Filter, 
  Calendar, 
  DollarSign, 
  Stethoscope, 
  Store, 
  Sparkles, 
  Printer, 
  Eye, 
  X,
  FileCheck,
  AlertCircle,
  FileCode2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadTissXml } from "@/services/tissExport";

export interface FiscalInvoice {
  id: string;
  user_id: string;
  order_type: "orientacao_tecnica" | "consulta_medica" | "assinatura_clube" | "produto_farmacia";
  reference_id: string;
  recipient_name: string;
  recipient_cpf_cnpj: string;
  recipient_email: string;
  recipient_address?: any;
  gross_amount: number;
  platform_fee: number;
  net_provider_amount: number;
  invoice_type: "nfse_servico" | "recibo_medico_irpf" | "nfe_produto" | "fatura_saas";
  invoice_status: "pending" | "authorized" | "rejected" | "cancelled";
  nfe_number: string;
  nfe_verification_code: string;
  pdf_url: string;
  cryptographic_hash: string;
  created_at: string;
  authorized_at?: string;
  doctor_name?: string;
  doctor_crm?: string;
}

export function PatientInvoicesList({ userId, patientName, patientCpf }: { userId?: string; patientName?: string; patientCpf?: string }) {
  const [invoices, setInvoices] = useState<FiscalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<FiscalInvoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, [userId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from("fiscal_invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        setInvoices(data);
      } else {
        setInvoices([]);
      }
    } catch (e) {
      console.warn("Error fetching fiscal invoices:", e);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado com Sucesso! 📋",
      description: `${label} copiado para a área de transferência.`
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesType = filterType === "all" 
      || (filterType === "recibo_medico_irpf" && inv.invoice_type === "recibo_medico_irpf")
      || (filterType === "nfse_servico" && inv.invoice_type === "nfse_servico")
      || (filterType === "assinatura_clube" && inv.order_type === "assinatura_clube")
      || (filterType === "produto_farmacia" && inv.order_type === "produto_farmacia");

    const matchesSearch = inv.nfe_number.toLowerCase().includes(searchQuery.toLowerCase())
      || inv.nfe_verification_code.toLowerCase().includes(searchQuery.toLowerCase())
      || inv.recipient_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header com Resumo IRPF */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-emerald-400 h-6 w-6" />
              <h2 className="text-xl md:text-2xl font-display font-black text-white">
                Minhas Notas Fiscais & Recibos IRPF
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-emerald-300">
              Documentos fiscais oficiais com código de autenticidade e validade jurídica para Declaração de IRPF / DMED (Receita Federal).
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 px-4">
            <DollarSign className="text-emerald-400 h-8 w-8" />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Dedutível IRPF (Ano)</p>
              <p className="text-lg font-black text-emerald-400">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  invoices.filter(i => i.invoice_type === "recibo_medico_irpf").reduce((acc, curr) => acc + Number(curr.gross_amount), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-border">
        <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
          {[
            { id: "all", label: "Todos", icon: FileText },
            { id: "recibo_medico_irpf", label: "Recibos Médicos IRPF", icon: Stethoscope },
            { id: "nfse_servico", label: "Notas Fiscais (NFS-e)", icon: FileCheck },
            { id: "produto_farmacia", label: "Farmácia", icon: Store }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40"
                  : "text-muted-foreground hover:text-white bg-slate-800/60"
              }`}
            >
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código ou número..."
            className="pl-8 text-xs bg-slate-950 border-border rounded-xl h-8 text-white"
          />
        </div>
      </div>

      {/* Lista de Documentos Fiscais */}
      {filteredInvoices.length === 0 ? (
        <Card className="bg-slate-900/60 border-border text-center p-8 rounded-3xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-bold text-muted-foreground">Nenhum documento fiscal encontrado com os filtros selecionados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInvoices.map((inv) => {
            const isMedicalReceipt = inv.invoice_type === "recibo_medico_irpf";

            return (
              <Card 
                key={inv.id} 
                className={`bg-slate-900/90 border-2 transition-all hover:border-emerald-400/60 rounded-3xl overflow-hidden shadow-lg ${
                  isMedicalReceipt ? "border-emerald-500/40" : "border-border"
                }`}
              >
                <CardHeader className="p-5 pb-3 border-b border-border/40 bg-slate-950/60 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                      isMedicalReceipt ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-sky-500/20 text-sky-400 border-sky-500/40"
                    }`}>
                      {isMedicalReceipt ? <Stethoscope size={20} /> : <FileCheck size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{inv.nfe_number}</span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {inv.invoice_status === "authorized" ? "✓ Autorizada / Válida" : inv.invoice_status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {format(new Date(inv.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase font-bold block">Valor</span>
                    <span className="text-base font-black text-emerald-400">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inv.gross_amount)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                      {isMedicalReceipt ? "Ato Médico Especializado" : "Descrição do Serviço / Produto"}
                    </span>
                    <p className="text-xs font-bold text-white bg-slate-950 p-2.5 rounded-xl border border-border/50">
                      {isMedicalReceipt 
                        ? `Teleconsulta Médica em Canabinologia Clínica • ${inv.doctor_name || "Dr. Prescritor"} (${inv.doctor_crm || "CRM SP"})`
                        : inv.order_type === "orientacao_tecnica" 
                        ? "Orientação e Triagem Técnica em Saúde Digital (Enfª Brisa)"
                        : "Medicamento Canabinoide / Produto Farmacêutico Oficial"
                      }
                    </p>
                  </div>

                  {/* Informações de Autenticidade */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/20 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-bold">Código de Autenticidade:</span>
                      <button
                        onClick={() => copyToClipboard(inv.nfe_verification_code, "Código de Autenticidade")}
                        className="text-emerald-400 hover:text-emerald-300 font-mono font-black flex items-center gap-1"
                      >
                        {inv.nfe_verification_code} <Copy size={11} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-bold">Hash SHA-512 (DMED):</span>
                      <button
                        onClick={() => copyToClipboard(inv.cryptographic_hash, "Hash Criptográfico SHA-512")}
                        className="text-muted-foreground hover:text-white font-mono text-[10px] flex items-center gap-1"
                        title={inv.cryptographic_hash}
                      >
                        {inv.cryptographic_hash.substring(0, 18)}... <Copy size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} /> Visualizar Recibo
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-bold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5"
                    >
                      <Download size={14} /> Baixar PDF
                    </Button>

                    {isMedicalReceipt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          downloadTissXml({
                            numeroGuiaPrestador: inv.nfe_number || inv.id,
                            dataAtendimento: inv.created_at,
                            tipoConsulta: "1",
                            nomeBeneficiario: inv.recipient_name,
                            cpfBeneficiario: inv.recipient_cpf_cnpj,
                            nomeProfissional: inv.doctor_name || "Dr. Prescritor",
                            numeroConselho: inv.doctor_crm || "00000",
                            ufConselho: "SP",
                            valorProcedimento: inv.gross_amount,
                            codigoProcedimentoTuss: "10101012",
                            descricaoProcedimento: "Consulta Médica em Atenção Especializada (Telemedicina)",
                            cid10: "F41.1",
                          });
                          toast({
                            title: "Guia TISS Gerada! 📄",
                            description: "Arquivo XML no Padrão TISS da ANS baixado para reembolso com convênios.",
                          });
                        }}
                        className="col-span-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-bold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5 mt-1"
                      >
                        <FileCode2 size={14} /> Exportar Guia TISS (Reembolso / Convênio ANS)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL / VIEW OFICIAL DO RECIBO MÉDICO OU NFS-E */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border-4 border-emerald-600 animate-in fade-in zoom-in-95 duration-200">
            {/* Fechar */}
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Recibo Oficial */}
            <div className="text-center pb-4 border-b-2 border-slate-200">
              <div className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Documento Fiscal Oficial • CFM 2.314/2022 • DMED
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display">
                {selectedInvoice.invoice_type === "recibo_medico_irpf" ? "RECIBO MÉDICO OFICIAL (IRPF)" : "NOTA FISCAL DE SERVIÇO ELETRÔNICA (NFS-e)"}
              </h3>
              <p className="text-xs text-slate-600 font-bold mt-1">
                Planta y Raíz LTDA • CNPJ: 58.283.475/0001-00 • São Paulo - SP
              </p>
            </div>

            {/* Corpo do Documento */}
            <div className="py-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Número do Recibo</span>
                  <span className="font-mono font-black text-slate-900 text-base">{selectedInvoice.nfe_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Data de Emissão</span>
                  <span className="font-bold text-slate-900">
                    {format(new Date(selectedInvoice.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
              </div>

              {/* Paciente */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-700 block">Identificação do Paciente (Tomador)</span>
                <p className="font-bold text-slate-900 text-sm">Nome: {selectedInvoice.recipient_name}</p>
                <p className="font-semibold text-slate-700">CPF: {selectedInvoice.recipient_cpf_cnpj}</p>
                <p className="text-slate-600">E-mail: {selectedInvoice.recipient_email}</p>
              </div>

              {/* Médico / Prestador se Consulta */}
              {selectedInvoice.invoice_type === "recibo_medico_irpf" && (
                <div className="p-4 rounded-2xl border border-slate-200 space-y-1 bg-emerald-50/50">
                  <span className="text-[10px] uppercase font-black text-emerald-800 block">Médico Prescritor Responsável</span>
                  <p className="font-bold text-slate-900">{selectedInvoice.doctor_name || "Dr. Edilson Bezerra"}</p>
                  <p className="font-semibold text-slate-700">CRM: {selectedInvoice.doctor_crm || "CRM/SP 198.452"} • Especialidade: Canabinologia Clínica</p>
                </div>
              )}

              {/* Descrição dos Serviços & Valor */}
              <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Descrição do Ato</span>
                  <p className="font-black text-slate-900 text-sm sm:text-base">
                    {selectedInvoice.invoice_type === "recibo_medico_irpf"
                      ? "Teleconsulta Médica em Canabinologia Clínica e Fitoterapia"
                      : "Orientação e Triagem Técnica em Saúde Digital"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Pago</span>
                  <span className="text-xl font-black text-emerald-700">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedInvoice.gross_amount)}
                  </span>
                </div>
              </div>

              {/* Assinatura Criptográfica */}
              <div className="p-3 bg-slate-100 rounded-xl font-mono text-[10px] text-slate-600 break-all space-y-1">
                <p><strong>CÓDIGO DE VERIFICAÇÃO:</strong> {selectedInvoice.nfe_verification_code}</p>
                <p><strong>HASH CRIPTOGRÁFICO SHA-512:</strong> {selectedInvoice.cryptographic_hash}</p>
              </div>
            </div>

            {/* Rodapé com Ações */}
            <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-slate-200">
              <Button 
                variant="outline" 
                onClick={() => setSelectedInvoice(null)}
                className="font-bold text-slate-700"
              >
                Fechar
              </Button>
              {selectedInvoice.invoice_type === "recibo_medico_irpf" && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    downloadTissXml({
                      numeroGuiaPrestador: selectedInvoice.nfe_number || selectedInvoice.id,
                      dataAtendimento: selectedInvoice.created_at,
                      tipoConsulta: "1",
                      nomeBeneficiario: selectedInvoice.recipient_name,
                      cpfBeneficiario: selectedInvoice.recipient_cpf_cnpj,
                      nomeProfissional: selectedInvoice.doctor_name || "Dr. Prescritor",
                      numeroConselho: selectedInvoice.doctor_crm || "00000",
                      ufConselho: "SP",
                      valorProcedimento: selectedInvoice.gross_amount,
                      codigoProcedimentoTuss: "10101012",
                      descricaoProcedimento: "Consulta Médica em Atenção Especializada (Telemedicina)",
                      cid10: "F41.1",
                    });
                    toast({
                      title: "Guia TISS Gerada! 📄",
                      description: "Arquivo XML no Padrão TISS da ANS baixado para reembolso com convênios.",
                    });
                  }}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-2"
                >
                  <FileCode2 size={16} /> Exportar Guia TISS (XML)
                </Button>
              )}
              <Button 
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
              >
                <Printer size={16} /> Imprimir / Salvar PDF Oficial
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
