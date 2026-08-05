import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, User, Stethoscope, Users, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Affiliate = {
  id: string;
  name: string;
  type: "doctor" | "patient";
  crm?: string;
  level: 1 | 2 | 3;
  children?: Affiliate[];
};

const TreeNode = ({ node }: { node: Affiliate }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col ml-4 mt-2">
      <div 
        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
          node.level === 1 ? "bg-slate-800/50 border-emerald-500/30" :
          node.level === 2 ? "bg-slate-800/30 border-emerald-500/20" :
          "bg-slate-900/50 border-slate-700"
        } ${hasChildren ? "cursor-pointer hover:bg-slate-700/50" : ""}`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="w-6 flex justify-center text-emerald-400">
          {hasChildren ? (expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <div className="w-4" />}
        </div>
        
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${node.type === 'doctor' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'}`}>
              {node.type === 'doctor' ? <Stethoscope size={16} /> : <User size={16} />}
            </div>
            <div>
              <p className="font-bold text-slate-200 text-sm">{node.name}</p>
              {node.type === 'doctor' && node.crm && (
                <p className="text-xs text-slate-400">CRM: {node.crm}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${node.type === 'doctor' ? 'border-primary text-primary' : 'border-blue-400 text-blue-400'} text-[10px]`}>
              {node.type === 'doctor' ? 'MÉDICO' : 'PACIENTE'}
            </Badge>
            <Badge className="bg-slate-700 text-slate-300 text-[10px]">
              {node.level}ª Geração
            </Badge>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pl-4 border-l-2 border-emerald-500/20 ml-3 mt-1 space-y-1"
          >
            {node.children!.map((child) => (
              <TreeNode key={child.id} node={child} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const mockData: Affiliate[] = [
  {
    id: "1",
    name: "Dra. Olivia Zimeri",
    type: "doctor",
    crm: "12345 SP",
    level: 1,
    children: []
  },
  {
    id: "2",
    name: "Dr. Edilson Rodrigues",
    type: "doctor",
    crm: "67890 RJ",
    level: 1,
    children: []
  },
  {
    id: "3",
    name: "Roberto Carlos",
    type: "patient",
    level: 1,
    children: []
  },
  {
    id: "4",
    name: "Maria Fernanda",
    type: "patient",
    level: 1,
    children: []
  },
  {
    id: "5",
    name: "Carlos Mendes",
    type: "patient",
    level: 1,
    children: []
  },
  {
    id: "6",
    name: "Pedro Almeida",
    type: "patient",
    level: 1,
    children: []
  }
];

export const AffiliateTree = () => {
  const [filter, setFilter] = useState<"all" | "doctor" | "patient">("all");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento rápido
    const timer = setTimeout(() => {
      setAffiliates(mockData);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = affiliates.filter(a => filter === "all" || a.type === filter);

  return (
    <Card className="bg-slate-900 border-slate-800 mt-12 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)]">
      <CardHeader className="bg-slate-950/50 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Users className="text-emerald-500" />
            Meus Indicados (Rede em Tempo Real)
          </CardTitle>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("doctor")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${filter === "doctor" ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-slate-200"}`}
            >
              <div className="w-2 h-2 rounded-full bg-primary" /> Médicos
            </button>
            <button
              onClick={() => setFilter("patient")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${filter === "patient" ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Pacientes
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-400 mb-6">
          Acompanhe quem se cadastrou através do seu link exclusivo.
        </p>
        
        {loading ? (
          <div className="text-center p-8 text-slate-500 text-sm">
            Carregando rede...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-8 text-slate-500 text-sm">
            Nenhum registro encontrado nesta categoria.
          </div>
        ) : (
          <div className="space-y-2 -ml-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredData.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>
        )}
        
        <div className="mt-8 flex items-center justify-center p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/10">
           <p className="text-xs text-emerald-500/70 flex items-center gap-2 text-center sm:text-left">
             <UserCheck size={14} className="shrink-0" />
             O sistema puxa automaticamente todos os usuários da plataforma para sua indicação direta (1ª Geração).
           </p>
        </div>
      </CardContent>
    </Card>
  );
};
