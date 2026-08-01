import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, ShieldCheck, CheckCircle2, Link as LinkIcon, Network } from "lucide-react";
import { generateClinicalBlockHash, type BlockchainRecord } from "@/lib/blockchainEHR";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface BlockchainRecordPublisherProps {
  caseData: any;
  doctorCrm: string;
  className?: string;
}

export const BlockchainRecordPublisher = ({ caseData, doctorCrm, className = "" }: BlockchainRecordPublisherProps) => {
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedRecord, setPublishedRecord] = useState<BlockchainRecord | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handlePublishClick = () => {
    setIsConfirmOpen(true);
  };

  const confirmPublish = async () => {
    setIsConfirmOpen(false);
    setIsPublishing(true);

    try {
      // Simulate network delay for blockchain consensus
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const record = await generateClinicalBlockHash(caseData, doctorCrm);
      setPublishedRecord(record);

      toast({
        title: "Caso Publicado com Sucesso!",
        description: "Os dados foram anonimizados e gravados na Blockchain.",
      });
    } catch (error) {
      toast({
        title: "Erro na Publicação",
        description: "Falha ao assinar os dados na rede. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (publishedRecord) {
    return (
      <Card className={`border-primary/30 bg-primary/5 ${className}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 size={20} />
            <h4 className="font-bold text-sm">Registro Científico Verificado</h4>
          </div>
          
          <div className="p-3 bg-card border border-border rounded-xl space-y-2 font-mono text-[10px] break-all">
            <p className="text-muted-foreground flex items-center gap-1">
              <Network size={12} /> <strong>TxID:</strong> {publishedRecord.txId}
            </p>
            <p className="text-muted-foreground flex items-center gap-1">
              <ShieldCheck size={12} /> <strong>Hash:</strong> {publishedRecord.hash}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Este caso clínico foi permanentemente anonimizado e registrado na Biblioteca Científica Pública para fins de pesquisa e fomento da Medicina Canabinoide.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button 
        onClick={handlePublishClick} 
        disabled={isPublishing}
        className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl ${className}`}
      >
        {isPublishing ? (
          <><Loader2 size={16} className="mr-2 animate-spin" /> Gerando Assinatura Criptográfica...</>
        ) : (
          <><Globe size={16} className="mr-2" /> Publicar Caso na Biblioteca Blockchain</>
        )}
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-500" />
              Consentimento de Anonimização (LGPD)
            </DialogTitle>
            <DialogDescription>
              Você está prestes a publicar este caso clínico na Biblioteca Científica Global.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-muted/40 rounded-xl space-y-3 text-sm">
            <p><strong>O que será compartilhado:</strong></p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Diagnóstico Principal (CID)</li>
              <li>Cepa/Produto Prescrito e Posologia</li>
              <li>Evolução de Sintomas (Triagem)</li>
              <li>Gênero e Faixa Etária</li>
            </ul>
            <p className="text-red-400 font-bold mt-2 flex items-center gap-1">
              <ShieldCheck size={14} /> Nenhum dado identificável (Nome, CPF) será exposto.
            </p>
          </div>

          <DialogFooter className="sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={confirmPublish} className="bg-blue-500 hover:bg-blue-600 text-white">
              Concordar e Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
