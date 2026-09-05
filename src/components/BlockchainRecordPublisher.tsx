import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Network, 
  Database,
  FileCheck2 
} from "lucide-react";
import { generateClinicalBlockHash, type BlockchainRecord } from "@/lib/blockchainEHR";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

interface BlockchainRecordPublisherProps {
  caseData: any;
  doctorCrm: string;
  doctorId?: string;
  patientId?: string;
  className?: string;
}

export const BlockchainRecordPublisher = ({ 
  caseData, 
  doctorCrm, 
  doctorId,
  patientId,
  className = "" 
}: BlockchainRecordPublisherProps) => {
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedRecord, setPublishedRecord] = useState<BlockchainRecord | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handlePublishClick = () => {
    setIsConfirmOpen(true);
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    toast({
      title: "Copiado!",
      description: "Hash criptográfico copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const confirmPublish = async () => {
    setIsConfirmOpen(false);
    setIsPublishing(true);

    try {
      const record = await generateClinicalBlockHash(caseData, doctorCrm, doctorId, patientId);
      setPublishedRecord(record);

      toast({
        title: "Caso Clínico Ancorado com Sucesso!",
        description: "Os dados foram anonimizados segundo a LGPD e registrados no Ledger Criptográfico.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro na Publicação",
        description: error?.message || "Falha ao assinar e ancorar os dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (publishedRecord) {
    const isMinedOnChain = Boolean(publishedRecord.txId);
    const hasIpfs = Boolean(publishedRecord.ipfsCid);

    return (
      <Card className={`border-emerald-500/30 bg-emerald-950/10 ${className}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={18} />
              <h4 className="font-bold text-sm">Registro Científico Ancorado</h4>
            </div>
            <Badge 
              variant="outline" 
              className="text-[10px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            >
              {isMinedOnChain ? "Polygon On-Chain" : hasIpfs ? "IPFS Pinned" : "Ledger Imutável"}
            </Badge>
          </div>
          
          <div className="p-3 bg-card/80 border border-border rounded-xl space-y-2.5 font-mono text-[11px] break-all">
            {/* Hash SHA-256 */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" /> Hash SHA-256:
                </span>
                <p className="text-foreground text-[10px] mt-0.5">{publishedRecord.hash}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => handleCopyHash(publishedRecord.hash)}
                title="Copiar Hash"
              >
                <Copy size={12} />
              </Button>
            </div>

            {/* TxID On-Chain ou Status de Mineração */}
            {isMinedOnChain ? (
              <div>
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <Network size={12} className="text-blue-400" /> TxID (Polygon Amoy):
                </span>
                <a
                  href={`https://amoy.polygonscan.com/tx/${publishedRecord.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 text-[10px] mt-0.5"
                >
                  {publishedRecord.txId} <ExternalLink size={10} />
                </a>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/50">
                <Database size={12} className="text-amber-400 shrink-0" />
                <span>
                  Ledger Append-Only Gravado • Rede: <strong className="text-foreground">{publishedRecord.network}</strong>
                </span>
              </div>
            )}

            {/* IPFS CID se disponível */}
            {publishedRecord.ipfsUrl && (
              <div>
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <FileCheck2 size={12} className="text-purple-400" /> IPFS Gateway:
                </span>
                <a
                  href={publishedRecord.ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline flex items-center gap-1 text-[10px] mt-0.5"
                >
                  {publishedRecord.ipfsCid || "Ver no Gateway Descentralizado"} <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>Rede: Polygon Amoy Testnet</span>
            {publishedRecord.explorerUrl && (
              <a
                href={publishedRecord.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                Verificar no Explorer <ExternalLink size={11} />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button 
        onClick={handlePublishClick} 
        disabled={isPublishing}
        className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm ${className}`}
      >
        {isPublishing ? (
          <><Loader2 size={16} className="mr-2 animate-spin" /> Ancorando Registro Criptográfico...</>
        ) : (
          <><Globe size={16} className="mr-2" /> Publicar Caso na Biblioteca Científica (Blockchain/IPFS)</>
        )}
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck size={20} />
              Consentimento de Anonimização & Registro Criptográfico
            </DialogTitle>
            <DialogDescription className="text-xs">
              Você está prestes a publicar este caso clínico na Biblioteca Científica Global com imutabilidade assegurada por ledger criptográfico e IPFS.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-muted/40 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-foreground">Metadados Anonimizados a serem ancorados:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Diagnóstico Principal (Classificação CID)</li>
              <li>Posologia e Cepa de Canabinoides Prescrita</li>
              <li>Evolução Clínica de Sintomas e Desfechos</li>
              <li>Faixa Etária Anonimizada e Gênero</li>
            </ul>
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
              <ShieldCheck size={14} className="shrink-0" />
              <span>Em total conformidade com a LGPD e o Código de Ética Médica: nenhum dado pessoal identificado (nome, CPF, contato) é transmitido ou gravado.</span>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={confirmPublish} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Concordar e Ancorar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
