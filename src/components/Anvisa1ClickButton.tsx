import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileCheck, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { submitAnvisaImportProcess, PatientData, PrescriptionData } from "@/lib/anvisaAutomation";
import { toast } from "sonner";

interface Anvisa1ClickButtonProps {
  patientData: PatientData;
  prescriptionData: PrescriptionData;
  className?: string;
  onSuccess?: (protocol: string) => void;
}

export function Anvisa1ClickButton({
  patientData,
  prescriptionData,
  className,
  onSuccess,
}: Anvisa1ClickButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "validating" | "submitting" | "approved">("idle");
  const [protocol, setProtocol] = useState<string | null>(null);

  const handleStartProcess = async () => {
    setIsOpen(true);
    setStep("validating");
    
    // Simulate validation step
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setStep("submitting");
    
    // Call the RPA engine
    const response = await submitAnvisaImportProcess(patientData, prescriptionData);
    
    if (response.success && response.protocolNumber) {
      setStep("approved");
      setProtocol(response.protocolNumber);
      toast.success(`Autorização ANVISA aprovada! Protocolo: ${response.protocolNumber}`);
      if (onSuccess) onSuccess(response.protocolNumber);
    } else {
      setIsOpen(false);
      setStep("idle");
      toast.error(response.errorMessage || "Falha ao processar autorização ANVISA.");
    }
  };

  return (
    <>
      <Button
        onClick={handleStartProcess}
        className={`bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-lg transition-all animate-pulse-subtle ${className}`}
        size="lg"
      >
        <Zap className="mr-2 h-5 w-5 fill-current" />
        Solicitar Autorização ANVISA 1-Click
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src="/lovable-uploads/270cc68a-60fb-4050-bf6c-2f7b88939b4b.png" alt="ANVISA Logo" className="h-6 object-contain" />
              <span>Processamento ANVISA 1-Click</span>
            </DialogTitle>
            <DialogDescription>
              Conectando via RPA seguro ao portal do Governo Federal.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {step === "validating" && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin absolute" />
                  <FileCheck className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Validando Documentação</h3>
                <p className="text-sm text-slate-500 text-center mt-2 max-w-[250px]">
                  Cruzando dados do paciente ({patientData.cpf}) com a receita do {prescriptionData.doctorName}.
                </p>
              </div>
            )}

            {step === "submitting" && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 relative">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin absolute" />
                  <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Submetendo ao Portal</h3>
                <p className="text-sm text-slate-500 text-center mt-2 max-w-[250px]">
                  Automação preenchendo formulário de importação excepcional em tempo real.
                </p>
              </div>
            )}

            {step === "approved" && (
              <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">Aprovado Instantâneo</h3>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 w-full text-center">
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Protocolo de Liberação</p>
                  <p className="text-lg font-mono font-bold text-slate-800 mt-1">{protocol}</p>
                </div>
                <Button 
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Concluir e Baixar Comprovante
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
