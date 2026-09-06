import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Stethoscope, X, Shield, Upload, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  computeFileHash,
  dispatchSignedPrescription,
  uploadPatientPrescriptionPdf,
} from "@/lib/prescription-dispatch";

interface PrescriptionVerificationModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  onHasPrescription: () => void;
  onNeedsPrescription: () => void;
  /** Farmácia dona do produto (opcional). Sem valor, usa a primeira homologada. */
  vendorId?: string | null;
}

export function PrescriptionVerificationModal({
  open,
  onClose,
  productName,
  onHasPrescription,
  onNeedsPrescription,
  vendorId,
}: PrescriptionVerificationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const openWhatsAppFallback = () => {
    const message = encodeURIComponent(
      `Olá Enf. Brisa, segue anexo minha receita para avaliação da farmácia modelo Planta y Raiz referente ao medicamento ${productName}!`
    );
    window.open(`https://wa.me/${BRISA_WHATSAPP}?text=${message}`, "_blank");
    onHasPrescription();
  };

  const handleSendPrescription = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      openWhatsAppFallback();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Envie a receita em formato PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo excede 10MB.");
      return;
    }

    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Sessão expirada. Faça login novamente.");

      const [{ url }, hash] = await Promise.all([
        uploadPatientPrescriptionPdf(user.id, file),
        computeFileHash(file),
      ]);

      const patientName =
        (user.user_metadata as any)?.full_name || user.email || "Paciente";

      const { pharmacy } = await dispatchSignedPrescription({
        vendorId: vendorId ?? null,
        patientId: user.id,
        patientName,
        patientWhatsapp: (user.user_metadata as any)?.phone ?? null,
        prescriptionPdfUrl: url,
        existingHash: hash,
        dispatchMode: "manual_upload",
      });

      toast.success(
        `Receita enviada para ${pharmacy?.nome_fantasia || "a farmácia modelo Planta y Raiz Ltda"} com registro de segurança.`
      );
      onHasPrescription();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível enviar a receita. Tente pelo WhatsApp."
      );
    } finally {
      setUploading(false);
    }
  };


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Verificação de Receita</h2>
                  <p className="text-xs text-muted-foreground">Conformidade ANVISA • RDC 660/2023</p>
                </div>
              </div>

              <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Para adquirir <span className="font-semibold text-foreground">{productName}</span>, é necessário apresentar uma receita médica válida com autorização da ANVISA.
                </p>
                <p className="mt-2 text-xs text-amber-500 leading-relaxed">
                  Estamos concluindo a homologação das farmácias parceiras. Por enquanto, as receitas são recebidas pela farmácia modelo <span className="font-semibold">Planta y Raiz Ltda</span> e nossa equipe orienta você sobre a dispensação.
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              {/* Option 1: Get Prescription */}
              <button
                onClick={onNeedsPrescription}
                className="w-full group flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                  <Stethoscope size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    Adquirir Receita Agora
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consulte um especialista em Cannabis Medicinal e obtenha sua prescrição digital com validade ANVISA
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                    <span>Ver profissionais disponíveis</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              </button>

              {/* Option 2: Already Has Prescription */}
              <button
                onClick={handleSendPrescription}
                className="w-full group flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-emerald-500/50 bg-background hover:bg-emerald-500/5 transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                  <Upload size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                    Já Tenho Minha Receita ANVISA
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie sua receita em PDF para a farmácia modelo Planta y Raiz Ltda; nossa equipe avalia e orienta a dispensação
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                    <span>Enviar receita para a farmácia Planta y Raiz</span>
                    <FileText size={12} />
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                🔒 A Planta y Raiz garante conformidade com a legislação vigente (RDC 660/2023 ANVISA).
                Todas as receitas são verificadas pela equipe de enfermagem antes da liberação do pedido.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
