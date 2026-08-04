import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Pill, Beaker, Leaf, AlertTriangle, Calculator } from "lucide-react";

interface Props {
  onSelectTemplate: (text: string) => void;
}

const templates = [
  {
    name: "Dor Crônica (Óleo 20%)",
    icon: <Pill size={14} className="mr-1" />,
    text: "Óleo CBD 20% (Full Spectrum) - 30ml\nUso interno: Iniciar com 2 gotas de 12/12h embaixo da língua. Aumentar 1 gota por dose a cada 3 dias até atingir alívio dos sintomas, sem ultrapassar 10 gotas/dose.\nUso Contínuo."
  },
  {
    name: "Insônia (THC domin.)",
    icon: <Beaker size={14} className="mr-1" />,
    text: "Óleo THC 10% CBD 2% - 30ml\nUso interno: Tomar 3 gotas embaixo da língua 45 minutos antes de dormir. Aguardar 1 minuto antes de engolir.\nUso Contínuo."
  },
  {
    name: "Ansiedade (Gomas)",
    icon: <Leaf size={14} className="mr-1" />,
    text: "Gomas CBD 25mg (Broad Spectrum) - 30 unid\nUso interno: Mastigar 1 goma pela manhã ou no momento de pico de ansiedade. Máximo de 2 gomas ao dia.\nUso Contínuo."
  }
];

export const PrescriptionTemplates = ({ onSelectTemplate }: Props) => {
  const [showTools, setShowTools] = useState(false);
  const [cypMeds, setCypMeds] = useState("");
  const [cypWarning, setCypWarning] = useState<string | null>(null);
  
  // Dose Ramp State
  const [concentration, setConcentration] = useState("20");
  const [initialDrops, setInitialDrops] = useState("2");
  const [increaseDays, setIncreaseDays] = useState("3");
  const [maxDrops, setMaxDrops] = useState("10");

  const handleCheckCYP = () => {
    const meds = cypMeds.toLowerCase();
    const warnings = [];
    if (meds.includes("varfarina") || meds.includes("warfarin")) warnings.push("Varfarina (Aumento do risco de sangramento).");
    if (meds.includes("clobazam") || meds.includes("urbanil")) warnings.push("Clobazam (O CBD aumenta os níveis do metabólito ativo).");
    if (meds.includes("valproato") || meds.includes("depakote")) warnings.push("Valproato (Risco aumentado de toxicidade hepática).");
    if (meds.includes("omeprazol") || meds.includes("pantoprazol")) warnings.push("Omeprazol (Pode alterar o metabolismo do CBD/THC).");
    
    if (warnings.length > 0) {
      setCypWarning("Atenção às interações via CYP450:\n- " + warnings.join("\n- "));
    } else {
      setCypWarning("Nenhuma interação grave via CYP450 detectada nesta lista básica.");
    }
  };

  const handleGenerateRamp = () => {
    const text = `Óleo CBD ${concentration}% - 30ml\nUso interno: Iniciar com ${initialDrops} gotas de 12/12h embaixo da língua. Aumentar 1 gota por dose a cada ${increaseDays} dias até atingir alívio dos sintomas, sem ultrapassar a dose máxima de ${maxDrops} gotas/dose.\nUso Contínuo.`;
    onSelectTemplate(text);
    setShowTools(false);
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h4 className="text-sm font-semibold text-primary">Templates Inteligentes (Copiloto)</h4>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowTools(!showTools)}>
          {showTools ? "Ocultar Ferramentas" : "Ferramentas Avançadas"}
        </Button>
      </div>

      {!showTools ? (
        <div className="flex flex-wrap gap-2">
          {templates.map((tpl, i) => (
            <Button 
              key={i} 
              variant="outline" 
              size="sm" 
              className="text-xs bg-background/50 hover:bg-primary hover:text-white transition-colors"
              onClick={() => onSelectTemplate(tpl.text)}
            >
              {tpl.icon}
              {tpl.name}
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 pt-2 border-t border-primary/10">
          <div className="space-y-2">
            <h5 className="text-xs font-bold flex items-center gap-1"><Calculator size={14}/> Calculadora de Rampa de Dose</h5>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Concentração (%)</Label>
                <Input size={1} className="h-7 text-xs" value={concentration} onChange={(e) => setConcentration(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Gotas Iniciais/Dose</Label>
                <Input size={1} className="h-7 text-xs" value={initialDrops} onChange={(e) => setInitialDrops(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Aumentar a cada (dias)</Label>
                <Input size={1} className="h-7 text-xs" value={increaseDays} onChange={(e) => setIncreaseDays(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Máx Gotas/Dose</Label>
                <Input size={1} className="h-7 text-xs" value={maxDrops} onChange={(e) => setMaxDrops(e.target.value)} />
              </div>
            </div>
            <Button size="sm" className="w-full h-7 text-xs mt-2" onClick={handleGenerateRamp}>Inserir Rampa no Receituário</Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-primary/10">
            <h5 className="text-xs font-bold flex items-center gap-1"><AlertTriangle size={14}/> Verificador CYP450</h5>
            <div className="flex gap-2">
              <Input 
                className="h-7 text-xs flex-1" 
                placeholder="Ex: Clobazam, Varfarina..." 
                value={cypMeds}
                onChange={(e) => setCypMeds(e.target.value)}
              />
              <Button size="sm" className="h-7 text-xs" onClick={handleCheckCYP}>Verificar</Button>
            </div>
            {cypWarning && (
              <div className={`p-2 rounded text-xs whitespace-pre-line ${cypWarning.includes("Atenção") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
                {cypWarning}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
