import { AlertTriangle, Activity, Pill, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TriageSummaryCard = ({ notes }: { notes?: string }) => {
  // Mock parsed notes from triage quiz
  const hasNotes = !!notes && notes.length > 5;
  const displayNotes = hasNotes ? notes : "Paciente não forneceu detalhes adicionais na triagem.";
  
  return (
    <div className="w-full flex gap-4 text-sm">
      <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
        <h4 className="flex items-center font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
          <Activity size={16} className="mr-2" /> Resumo da Triagem (Copiloto)
        </h4>
        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
          {displayNotes}
        </p>
      </div>

      <div className="w-64 shrink-0 bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground flex items-center text-xs"><AlertTriangle size={12} className="mr-1 text-red-500"/> Alergias</span>
          <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 text-[10px]">Não Relatado</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center text-xs"><Pill size={12} className="mr-1 text-blue-500"/> Uso Contínuo</span>
          <Badge variant="outline" className="text-[10px]">Verificar</Badge>
        </div>
      </div>
    </div>
  );
};
