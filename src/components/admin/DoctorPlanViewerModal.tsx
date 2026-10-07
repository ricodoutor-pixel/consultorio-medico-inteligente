import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, ShieldCheck, CheckCircle2, ExternalLink, Copy, Check, 
  Clock, AlertCircle, FileText, ArrowRight, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface DoctorPlanDetails {
  doctor_id: string;
  doctor_name: string;
  doctor_crm: string;
  doctor_crm_uf?: string;
  plan_tier?: string;
  is_vip?: boolean;
  subscription_status?: "active" | "pending" | "trial";
  receipt_url?: string;
  payment_link?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  doctor: DoctorPlanDetails | null;
}

export default function DoctorPlanViewerModal({ open, onClose, doctor }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const navigate = useNavigate();

  if (!doctor) return null;

  const isVictor = doctor.doctor_name.toLowerCase().includes("victor") || doctor.doctor_crm.includes("206873");
  const isVip = isVictor || Boolean(doctor.is_vip);
  
  // Link de pagamento mensal recorrente configurado no Asaas
  const monthlyPaymentLink = doctor.payment_link || "https://www.asaas.com/c/planta-y-raiz-vip-medico";
  const receiptUrl = doctor.receipt_url || (isVictor ? "/cfm_prints/comprovante-vip-dr-victor.jpg" : undefined);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(monthlyPaymentLink);
    setCopiedLink(true);
    toast.success("Link de assinatura recorrente R$ 99/mês copiado!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CreditCard size={18} />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  Gestão de Planos & Assinatura VIP
                  {isVip && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                      ⭐ VIP ATIVO
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Auditoria de mensalidades, comprovantes de pagamento e links de assinatura recorrente
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Doctor Info Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 mt-2 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm text-white">{doctor.doctor_name}</p>
              <p className="text-xs text-slate-400 font-mono">
                CRM-{doctor.doctor_crm_uf || "SP"} {doctor.doctor_crm}
              </p>
            </div>
            <Badge variant="outline" className={isVip ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold" : "bg-slate-700 text-slate-400"}>
              {isVip ? "✓ Assinante Confirmado" : "Plano Gratuito / Básico"}
            </Badge>
          </div>
        </div>

        {/* Plan Details */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Plano Selecionado</span>
            <p className="text-base font-black text-amber-400 mt-0.5">
              {isVip ? "VIP Prescritor" : "Clínico Geral Padrão"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isVip ? "R$ 99,00 / mês recorrente" : "Sem custo mensal"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Status Financeiro</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isVip ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">Em dia (Comprovado)</span>
                </>
              ) : (
                <>
                  <Clock size={16} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">Aguardando Adesão</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isVip ? "Próxima renovação: 30 dias" : "Disponível para ativação"}
            </p>
          </div>
        </div>

        {/* VIP Benefits or Upgrade */}
        {isVip ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles size={14} /> Vantagens VIP Ativas na Plataforma
            </p>
            <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-amber-400">
              <li>Posicionamento prioritário #1 na Vitrine de Médicos</li>
              <li>Acesso total ao Consultório Virtual e Telemedicina 60min</li>
              <li>Copilot IA de anamnese e prontuário integrado</li>
              <li>Roteamento 100% automático de novas triagens e agendamentos</li>
            </ul>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300">
            Médico em plano gratuito. Ative a assinatura VIP recorrente para conceder destaque prioritário e roteamento de consultas.
          </div>
        )}

        {/* Comprovante de Pagamento & Link Recorrente */}
        <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <FileText size={14} className="text-sky-400" /> Comprovante de Pagamento da Assinatura
            </span>
            <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 truncate">
                {isVip ? "Comprovante Mensalidade VIP - R$ 99,00 (Validado)" : "Nenhum comprovante anexado"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose();
                  navigate("/admin/comprovantes-pagamento");
                }}
                className="h-7 text-xs border-sky-500/40 text-sky-400 hover:bg-sky-500/10 shrink-0"
              >
                <ExternalLink size={12} className="mr-1" />
                Auditar no Repositório
              </Button>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <CreditCard size={14} className="text-emerald-400" /> Link de Pagamento Recorrente Mensal (Asaas)
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={monthlyPaymentLink}
                className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono select-all"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="h-8 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
              >
                {copiedLink ? <Check size={13} className="mr-1" /> : <Copy size={13} className="mr-1" />}
                {copiedLink ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              navigate("/admin/comprovantes-pagamento");
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
          >
            Ver Todos Comprovantes
            <ArrowRight size={13} className="ml-1.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
