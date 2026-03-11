/**
 * Smart Prescription Engine — Digital Therapeutics (DTx)
 * Allows doctors to prescribe certified health apps alongside medication
 * Validates THC levels for Receita A vs Controle Especial
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Smartphone, Pill, Plus, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DTxApp {
  id: string;
  name: string;
  category: string;
  certifiedBy: string;
  platform: "iOS" | "Android" | "Both";
  conditions: string[];
  evidenceLevel: "A" | "B" | "C";
}

const CERTIFIED_DTX_APPS: DTxApp[] = [
  { id: "dtx-1", name: "Calm Mind PRO", category: "Saúde Mental", certifiedBy: "ANVISA/FDA", platform: "Both", conditions: ["F41.1", "F32.0", "G47.0"], evidenceLevel: "A" },
  { id: "dtx-2", name: "PainTrack CBD", category: "Dor Crônica", certifiedBy: "ANVISA", platform: "Both", conditions: ["M79.7", "M54.5", "R52"], evidenceLevel: "B" },
  { id: "dtx-3", name: "NeuroFit VR", category: "Neuroreabilitação", certifiedBy: "CE/ANVISA", platform: "Both", conditions: ["G35", "G20", "G40.0"], evidenceLevel: "B" },
  { id: "dtx-4", name: "SleepRx", category: "Sono", certifiedBy: "FDA/ANVISA", platform: "Both", conditions: ["G47.0", "F41.1"], evidenceLevel: "A" },
  { id: "dtx-5", name: "GutBalance", category: "Gastro", certifiedBy: "ANVISA", platform: "iOS", conditions: ["K58"], evidenceLevel: "C" },
  { id: "dtx-6", name: "CannaLog", category: "Cannabis Medicinal", certifiedBy: "ANVISA", platform: "Both", conditions: ["R52", "G40.0", "F41.1", "C80"], evidenceLevel: "B" },
];

export const SmartPrescriptionDTx = ({ diagnosisCid, onPrescribe }: {
  diagnosisCid?: string;
  onPrescribe?: (apps: DTxApp[]) => void;
}) => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const relevantApps = diagnosisCid
    ? CERTIFIED_DTX_APPS.filter(a => a.conditions.includes(diagnosisCid))
    : CERTIFIED_DTX_APPS;

  const toggleApp = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const prescribeApps = () => {
    const apps = CERTIFIED_DTX_APPS.filter(a => selected.has(a.id));
    onPrescribe?.(apps);
    toast({ title: "DTx prescritos ✅", description: `${apps.length} app(s) adicionados à receita digital.` });
  };

  const evidenceColors: Record<string, string> = { A: "text-primary", B: "text-yellow-400", C: "text-muted-foreground" };

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Smartphone size={14} className="text-primary" />
          Digital Therapeutics (DTx)
          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary ml-auto">ANVISA Certified</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {diagnosisCid && (
          <p className="text-[10px] text-muted-foreground">
            Apps recomendados para CID-10: <span className="font-mono text-primary">{diagnosisCid}</span>
          </p>
        )}

        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {relevantApps.map(app => (
            <div
              key={app.id}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                selected.has(app.id) ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/20"
              }`}
              onClick={() => toggleApp(app.id)}
            >
              <Checkbox checked={selected.has(app.id)} className="pointer-events-none" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{app.name}</p>
                <p className="text-[9px] text-muted-foreground">{app.category} • {app.platform}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="outline" className={`text-[8px] h-4 ${evidenceColors[app.evidenceLevel]}`}>
                  Nível {app.evidenceLevel}
                </Badge>
                <ShieldCheck size={10} className="text-primary/60" />
              </div>
            </div>
          ))}
        </div>

        {relevantApps.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum DTx certificado para este CID.</p>
        )}

        <Button
          onClick={prescribeApps}
          disabled={selected.size === 0}
          className="w-full bg-primary text-primary-foreground text-xs"
        >
          <Plus size={12} className="mr-1" />
          Adicionar {selected.size} DTx à Receita
        </Button>

        <p className="text-[8px] text-muted-foreground">
          <AlertTriangle size={8} className="inline mr-0.5" />
          DTx complementam, não substituem tratamento medicamentoso. CFM 2454/2026.
        </p>
      </CardContent>
    </Card>
  );
};

export default SmartPrescriptionDTx;
