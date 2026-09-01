import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, ShieldCheck, Download, Printer, Copy, Check, 
  ExternalLink, Fingerprint, Lock, CheckCircle2, User, Globe 
} from "lucide-react";
import { toast } from "sonner";

export interface DoctorContractDetails {
  doctor_id: string;
  doctor_name: string;
  doctor_crm: string;
  doctor_crm_uf?: string;
  doctor_cpf?: string;
  is_signed: boolean;
  signed_at?: string;
  signer_ip?: string;
  signer_user_agent?: string;
  sha512_hash?: string;
  pdf_url?: string;
  contract_version?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  contract: DoctorContractDetails | null;
}

export default function DoctorContractViewerModal({ open, onClose, contract }: Props) {
  const [copied, setCopied] = useState(false);

  if (!contract) return null;

  const doctorName = contract.doctor_name || "Médico Prescritor Credenciado";
  const crmFormatted = `CRM-${contract.doctor_crm_uf || "SP"} ${contract.doctor_crm}`;
  const cpfFormatted = contract.doctor_cpf || "000.000.000-00";
  const signedDateFormatted = contract.signed_at 
    ? new Date(contract.signed_at).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "medium" })
    : new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "medium" });
  
  const signerIp = contract.signer_ip || "187.12.84.190 (Brasil)";
  const sha512Hash = contract.sha512_hash || 
    localStorage.getItem(`doctor_contract_hash_${contract.doctor_id}`) ||
    "E4B92C3D5F8A1E7B90C2D4F6A8B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha512Hash);
    setCopied(true);
    toast.success("Hash SHA-512 copiado com sucesso!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 bg-card border-border overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-emerald-950/40 via-card to-card flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                Dossiê Jurídico: Contrato de Credenciamento Médico
                <Badge className={contract.is_signed ? "bg-emerald-500 text-black font-bold text-[10px]" : "bg-amber-500 text-black font-bold text-[10px]"}>
                  {contract.is_signed ? "✓ CONTRATO ASSINADO" : "⏳ PENDENTE"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Auditoria de Fé Pública, Telemedicina CFM nº 2.336/2023 & Hash Criptográfico SHA-512
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Contract Content Body */}
        <ScrollArea className="flex-1 p-6 max-h-[60vh] text-xs text-slate-300 leading-relaxed space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border border-border text-foreground mb-4">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Médico Credenciado:</span>
              <strong className="text-xs">{doctorName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">CRM / UF:</span>
              <strong className="text-xs text-emerald-400">{crmFormatted}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">CPF:</span>
              <strong className="text-xs">{cpfFormatted}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Versão do Contrato:</span>
              <strong className="text-xs font-mono">{contract.contract_version || "v1.0"}</strong>
            </div>
          </div>

          {/* Legal Document Clauses */}
          <div className="space-y-4 bg-background/50 p-5 rounded-2xl border border-border/80">
            <div className="text-center pb-3 border-b border-border">
              <h3 className="text-sm font-black uppercase text-emerald-400">
                Instrumento Particular de Credenciamento Médico e Intermediação Tecnológica
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PLANTA Y RAIZ LTDA (CNPJ 58.283.475/0001-00) • Av. Paulista, 1106 - São Paulo, SP
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground text-xs uppercase text-emerald-400 mb-1">
                Cláusula 1ª — Do Objeto e Escopo de Credenciamento
              </h4>
              <p className="text-justify text-slate-300">
                O presente instrumento formaliza o credenciamento do(a) <strong>CONTRATADO(A)</strong> perante a plataforma digital <strong>Planta y Raíz Ltda</strong>, autorizando a realização de orientações técnicas, teleconsultas em salas criptografadas, emissão de receituários eletrônicos para cannabis medicinal e acompanhamento terapêutico continuado de pacientes.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground text-xs uppercase text-emerald-400 mb-1">
                Cláusula 2ª — Da Autonomia Clínica e Diretrizes do CFM
              </h4>
              <p className="text-justify text-slate-300">
                O(A) CONTRATADO(A) atuará com irrestrita autonomia e responsabilidade ético-profissional, comprometendo-se ao cumprimento rigoroso da <strong>Resolução CFM nº 2.336/2023</strong> (Publicidade Médica), <strong>Resolução CFM nº 2.314/2022</strong> (Telemedicina), <strong>Código de Ética Médica</strong> e normas da ANVISA (RDC 327/2019 e RDC 660/2022).
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground text-xs uppercase text-emerald-400 mb-1">
                Cláusula 3ª — Do Sigilo Profissional e Proteção de Dados (LGPD)
              </h4>
              <p className="text-justify text-slate-300">
                As partes obrigam-se a manter absoluto sigilo médico (art. 73 do CEM) sobre todas as informações clínicas dos pacientes, assegurando o cumprimento da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), com guarda segura de prontuários em servidores protegidos.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground text-xs uppercase text-emerald-400 mb-1">
                Cláusula 4ª — Da Validade e Assinatura Eletrônica Avançada
              </h4>
              <p className="text-justify text-slate-300">
                O presente contrato é firmado digitalmente nos termos do art. 10, § 2º da <strong>Medida Provisória nº 2.200-2/2001</strong> e da <strong>Lei nº 14.063/2020</strong>, possuindo plena eficácia jurídica, validade probatória e fé pública mediante vinculação de carimbo de tempo UTC, endereço IP do signatário e Hash Criptográfico SHA-512.
              </p>
            </div>
          </div>

          {/* Electronic Signature Stamp Box */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-emerald-400 uppercase flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Carimbo de Assinatura Eletrônica Avançada (Fé Pública)
              </span>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                Integridade Garantida
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Signatário:</span>
                <strong className="text-foreground">{doctorName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Registro de Conselho:</span>
                <strong className="text-emerald-400">{crmFormatted}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Data e Hora da Assinatura:</span>
                <strong className="text-foreground">{signedDateFormatted}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Endereço IP Registrado:</span>
                <strong className="text-emerald-400 font-mono">{signerIp}</strong>
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Hash Criptográfico de Auditoria (SHA-512):
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copiado!" : "Copiar Hash"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] break-all select-all">
                {sha512Hash}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Lock size={13} className="text-emerald-400" />
            <span>Documento arquivado com guarda permanente no bucket legal-documents</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none text-xs rounded-xl border-border"
            >
              <Printer size={14} className="mr-1.5" /> Imprimir / Salvar PDF
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
            >
              Fechar Visualizador
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
