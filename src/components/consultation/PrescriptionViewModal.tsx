import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Send, Download, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PrescriptionViewModal({ isOpen, onClose, prescription }: any) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleSendToPharmacy = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Receita Despachada!",
        description: "Enviada automaticamente para a farmácia com melhor cotação.",
      });
      onClose();
    }, 1500);
  };

  const handleDownload = () => {
    toast({ title: "Download Iniciado", description: "O PDF assinado está sendo baixado." });
    setTimeout(() => {
      navigate("/shopping");
      onClose();
    }, 1000);
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
              <Send size={20} />
              Enviar Direto para Farmácia (Recomendada)
            </div>
            <span className="text-xs text-emerald-100 font-normal">Cotação automática com melhor preço e frete grátis</span>
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
