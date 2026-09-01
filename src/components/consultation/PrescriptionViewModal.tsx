import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Send, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  dispatchSignedPrescription,
  listApprovedPharmacies,
  type PharmacyOption,
} from "@/lib/prescription-dispatch";

interface PrescriptionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
  /** Farmácia preferida (opcional). Sem valor, usa a primeira homologada. */
  vendorId?: string | null;
}

export function PrescriptionViewModal({ isOpen, onClose, prescription, vendorId }: PrescriptionViewModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    listApprovedPharmacies()
      .then(setPharmacies)
      .catch(() => setPharmacies([]));
  }, [isOpen]);

  const pdfUrl: string | undefined =
    prescription?.signed_pdf_url || prescription?.pdf_url || prescription?.prescription_pdf_url;

  const handleSendToPharmacy = async () => {
    if (!pdfUrl) {
      toast({
        title: "Receita sem PDF assinado",
        description: "Aguarde a assinatura digital do médico para despachar à farmácia.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const patientId = prescription?.patient_id || auth.user?.id;
      if (!patientId) throw new Error("Faça login para despachar a receita.");

      const patientName =
        prescription?.patient_name ||
        (auth.user?.user_metadata as any)?.full_name ||
        auth.user?.email ||
        "Paciente";

      const { pharmacy } = await dispatchSignedPrescription({
        vendorId: vendorId ?? prescription?.vendor_id ?? null,
        patientId,
        patientName,
        patientWhatsapp: prescription?.patient_whatsapp ?? null,
        prescriptionId: prescription?.id ?? null,
        prescriptionPdfUrl: pdfUrl,
        existingHash: prescription?.signature_hash ?? prescription?.regulatory_hash ?? null,
        dispatchMode: "automatic_1click",
      });

      toast({
        title: "Receita despachada!",
        description: `Enviada com hash SHA-512 para ${pharmacy?.nome_fantasia || "a farmácia homologada"}.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Falha no despacho",
        description: err instanceof Error ? err.message : "Não foi possível enviar a receita.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
    else toast({ title: "PDF indisponível", description: "A receita ainda não possui arquivo assinado." });
    setTimeout(() => {
      navigate("/shopping");
      onClose();
    }, 800);
  };

  if (!prescription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-950 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" /> Sua Receita Digital
          </DialogTitle>
          <DialogDescription>
            Receita médica assinada digitalmente (ICP-Brasil). Escolha como deseja prosseguir com a compra do tratamento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <Button 
            className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
            onClick={handleSendToPharmacy}
            disabled={isSending}
          >
            <div className="flex items-center gap-2 font-bold text-lg">
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              {isSending ? "Despachando..." : "Enviar Direto para Farmácia (Recomendada)"}
            </div>
            <span className="text-xs text-emerald-100 font-normal">
              {pharmacies.length > 0
                ? `Despacho auditado para ${pharmacies[0].nome_fantasia}`
                : "Cotação automática com melhor preço e frete grátis"}
            </span>
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs">OU</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2 border-slate-700 hover:bg-slate-900"
            onClick={handleDownload}
          >
            <div className="flex items-center gap-2 font-bold">
              <Download size={18} />
              Baixar PDF & Escolher no Shopping
            </div>
            <span className="text-xs text-muted-foreground font-normal">Acesse nossa vitrine e faça upload da receita manualmente</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
