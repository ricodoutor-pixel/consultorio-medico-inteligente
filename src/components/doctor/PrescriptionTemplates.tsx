import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Pill, Beaker, Leaf } from "lucide-react";

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
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-primary" />
        <h4 className="text-sm font-semibold text-primary">Templates Inteligentes (Copiloto)</h4>
      </div>
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
    </div>
  );
};
