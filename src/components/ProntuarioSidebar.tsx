import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Save, Shield, X, Search, Pill, Stethoscope, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CID10_COMMON = [
  { code: "F41.1", name: "Ansiedade generalizada" },
  { code: "F32.0", name: "Episódio depressivo leve" },
  { code: "F32.1", name: "Episódio depressivo moderado" },
  { code: "G43.0", name: "Enxaqueca sem aura" },
  { code: "G40.0", name: "Epilepsia idiopática" },
  { code: "R52", name: "Dor não classificada" },
  { code: "M54.5", name: "Dor lombar baixa" },
  { code: "G47.0", name: "Insônia" },
  { code: "F90.0", name: "TDAH" },
  { code: "G20", name: "Doença de Parkinson" },
  { code: "M79.7", name: "Fibromialgia" },
  { code: "F43.1", name: "TEPT" },
  { code: "K58", name: "Síndrome do intestino irritável" },
  { code: "G35", name: "Esclerose múltipla" },
  { code: "N94.6", name: "Dismenorreia" },
];

interface ProntuarioSidebarProps {
  appointmentId?: string | null;
  onClose: () => void;
  onSave?: (data: ProntuarioData) => void;
}

export interface ProntuarioData {
  chiefComplaint: string;
  history: string;
  examination: string;
  diagnosisCid: string;
  diagnosisText: string;
  treatmentPlan: string;
  medications: string;
  notes: string;
}

export const ProntuarioSidebar = ({ onClose, onSave }: ProntuarioSidebarProps) => {
  const { toast } = useToast();
  const [cidSearch, setCidSearch] = useState("");
  const [data, setData] = useState<ProntuarioData>({
    chiefComplaint: "",
    history: "",
    examination: "",
    diagnosisCid: "",
    diagnosisText: "",
    treatmentPlan: "",
    medications: "",
    notes: "",
  });

  const filteredCid = cidSearch.length >= 2
    ? CID10_COMMON.filter(c =>
        c.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(cidSearch.toLowerCase())
      )
    : [];

  const selectCid = (code: string, name: string) => {
    setData(p => ({ ...p, diagnosisCid: code, diagnosisText: name }));
    setCidSearch("");
  };

  const handleSave = () => {
    onSave?.(data);
    toast({ title: "Prontuário salvo ✅", description: "Registro clínico atualizado com sucesso." });
  };

  const handleSign = () => {
    toast({ 
      title: "Assinatura Digital ICP-Brasil 🔐", 
      description: "Integração com certificado e-CPF A3/Nuvem necessária para assinatura qualificada." 
    });
  };

  return (
    <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col shrink-0 h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <ClipboardList size={14} className="text-primary" /> Prontuário Eletrônico (PEP)
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={14} /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Queixa Principal */}
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Stethoscope size={10} /> Queixa Principal (QP)
            </label>
            <Input
              value={data.chiefComplaint}
              onChange={(e) => setData(p => ({ ...p, chiefComplaint: e.target.value }))}
              placeholder="Ex: Dor crônica há 6 meses..."
              className="bg-muted border-border text-xs"
            />
          </div>

          {/* HDA */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              📋 História da Doença Atual (HDA)
            </label>
            <Textarea
              value={data.history}
              onChange={(e) => setData(p => ({ ...p, history: e.target.value }))}
              placeholder="Descreva a evolução dos sintomas..."
              className="bg-muted border-border text-xs min-h-[80px]"
            />
          </div>

          {/* Exame */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              🔍 Exame Clínico (observações via vídeo)
            </label>
            <Textarea
              value={data.examination}
              onChange={(e) => setData(p => ({ ...p, examination: e.target.value }))}
              placeholder="Aspecto geral, estado emocional..."
              className="bg-muted border-border text-xs min-h-[60px]"
            />
          </div>

          {/* CID-10 */}
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Search size={10} /> Diagnóstico (CID-10)
            </label>
            <Input
              value={cidSearch}
              onChange={(e) => setCidSearch(e.target.value)}
              placeholder="Buscar CID-10..."
              className="bg-muted border-border text-xs"
            />
            {filteredCid.length > 0 && (
              <div className="mt-1 space-y-0.5 max-h-28 overflow-y-auto border border-border rounded-lg p-1">
                {filteredCid.map(c => (
                  <div
                    key={c.code}
                    onClick={() => selectCid(c.code, c.name)}
                    className="flex items-center justify-between p-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                  >
                    <span className="font-mono font-bold text-primary">{c.code}</span>
                    <span className="text-muted-foreground text-right text-[10px]">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
            {data.diagnosisCid && (
              <Badge variant="outline" className="mt-1.5 text-[10px] border-primary/30">
                {data.diagnosisCid} — {data.diagnosisText}
              </Badge>
            )}
          </div>

          {/* Conduta */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              💊 Conduta Terapêutica
            </label>
            <Textarea
              value={data.treatmentPlan}
              onChange={(e) => setData(p => ({ ...p, treatmentPlan: e.target.value }))}
              placeholder="Plano de tratamento..."
              className="bg-muted border-border text-xs min-h-[60px]"
            />
          </div>

          {/* Medicações */}
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Pill size={10} /> Prescrição / Medicações
            </label>
            <Textarea
              value={data.medications}
              onChange={(e) => setData(p => ({ ...p, medications: e.target.value }))}
              placeholder="CBD Full Spectrum 3000mg — 0,5mL 2x/dia sublingual..."
              className="bg-muted border-border text-xs min-h-[60px]"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              📝 Observações Adicionais
            </label>
            <Textarea
              value={data.notes}
              onChange={(e) => setData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notas internas..."
              className="bg-muted border-border text-xs min-h-[40px]"
            />
          </div>

          <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
            ⚠️ Registro obrigatório conforme CFM Res. 2.314/2022, Art. 7º. 
            Inclui: data/hora, meio utilizado, CRM, CID-10, conduta e orientações.
          </p>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2">
        <Button className="w-full bg-primary text-primary-foreground font-bold text-xs" onClick={handleSave}>
          <Save size={14} className="mr-1" /> Salvar Prontuário
        </Button>
        <Button variant="outline" className="w-full text-xs" onClick={handleSign}>
          <Shield size={14} className="mr-1" /> Assinar Digitalmente (ICP-Brasil)
        </Button>
      </div>
    </div>
  );
};
