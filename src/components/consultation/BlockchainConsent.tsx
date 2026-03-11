/**
 * Blockchain Consent Module
 * Generates SHA-256 hashes for signed documents (TCLE / Prescriptions)
 * Simulates decentralized ledger registry for auditability
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ShieldCheck, Clock, Hash, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsentRecord {
  id: string;
  documentType: "TCLE" | "Prescription" | "MedicalRecord";
  hash: string;
  timestamp: string;
  blockNumber: number;
  status: "pending" | "confirmed" | "anchored";
  signerRole: "patient" | "doctor";
}

async function generateSHA256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const BlockchainConsent = ({ documentContent, documentType, signerRole, onAnchored }: {
  documentContent: string;
  documentType: "TCLE" | "Prescription" | "MedicalRecord";
  signerRole: "patient" | "doctor";
  onAnchored?: (record: ConsentRecord) => void;
}) => {
  const { toast } = useToast();
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const anchorDocument = async () => {
    setLoading(true);
    try {
      const hash = await generateSHA256(documentContent + Date.now().toString());
      const newRecord: ConsentRecord = {
        id: crypto.randomUUID(),
        documentType,
        hash,
        timestamp: new Date().toISOString(),
        blockNumber: 18_000_000 + Math.floor(Math.random() * 100_000),
        status: "confirmed",
        signerRole,
      };

      // Simulate ledger confirmation delay
      await new Promise(r => setTimeout(r, 1500));
      newRecord.status = "anchored";
      setRecord(newRecord);
      onAnchored?.(newRecord);
      toast({ title: "Documento ancorado ✅", description: `Hash: ${hash.slice(0, 16)}...` });
    } catch {
      toast({ title: "Erro ao ancorar", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 size={14} className="text-primary" />
          Blockchain Consent Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!record ? (
          <Button onClick={anchorDocument} disabled={loading} className="w-full bg-primary text-primary-foreground text-xs">
            {loading ? "Gerando hash SHA-256..." : `Ancorar ${documentType} no Ledger`}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {record.status === "anchored" ? "ANCORADO" : "CONFIRMADO"}
              </Badge>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 space-y-1.5">
              <InfoRow icon={<Hash size={10} />} label="Hash SHA-256" value={`${record.hash.slice(0, 24)}...`} />
              <InfoRow icon={<Clock size={10} />} label="Timestamp" value={new Date(record.timestamp).toLocaleString("pt-BR")} />
              <InfoRow icon={<Link2 size={10} />} label="Bloco" value={`#${record.blockNumber.toLocaleString()}`} />
              <InfoRow icon={<ExternalLink size={10} />} label="Tipo" value={record.documentType} />
            </div>
            <p className="text-[8px] text-muted-foreground">
              ⚠️ Ledger simulado — integrar com Hyperledger Fabric ou Polygon para produção
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between text-[10px]">
    <span className="flex items-center gap-1 text-muted-foreground">{icon} {label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);

export default BlockchainConsent;
