import { useState } from "react";
import { ChevronRight, ChevronDown, User, Stethoscope, Users, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

type Affiliate = {
  id: string;
  name: string;
  type: "doctor" | "patient";
  crm?: string;
  level: 1 | 2 | 3;
  children?: Affiliate[];
};

const mockData: Affiliate[] = [
  {
    id: "1",
    name: "Dra. Olivia Zimeri",
    type: "doctor",
    crm: "12345 SP",
    level: 1,
    children: [
      {
        id: "1-1",
        name: "Dr. João Silva",
        type: "doctor",
        crm: "54321 SP",
        level: 2,
        children: [
          { id: "1-1-1", name: "Dra. Ana Costa", type: "doctor", crm: "98765 MG", level: 3 },
          { id: "1-1-2", name: "Carlos Mendes", type: "patient", level: 3 },
        ],
      },
      { id: "1-2", name: "Maria Fernanda", type: "patient", level: 2 },
    ],
  },
  {
    id: "2",
    name: "Dra. Suelen Rodrigues",
    type: "doctor",
    crm: "67890 RJ",
    level: 1,
    children: [
      { id: "2-1", name: "Pedro Almeida", type: "patient", level: 2 },
      { id: "2-2", name: "Dr. Roberto Gomes", type: "doctor", crm: "11223 BA", level: 2 },
    ],
  },
  {
    id: "3",
    name: "Roberto Carlos (Paciente VIP)",
    type: "patient",
    level: 1,
  },
];

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
              {node.type === 'doctor' && (
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

export const AffiliateTree = () => {
  return (
    <Card className="bg-slate-900 border-slate-800 mt-12 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)]">
      <CardHeader className="bg-slate-950/50 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Users className="text-emerald-500" />
            Meus Indicados (Rede em Tempo Real)
          </CardTitle>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-primary" /> Médicos
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Pacientes
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-400 mb-6">
          Acompanhe quem se cadastrou através do seu link exclusivo. Expanda os nomes para ver a 2ª e 3ª geração de indicados na sua rede.
        </p>
        
        <div className="space-y-2 -ml-4">
          {mockData.map((node) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
        
        <div className="mt-8 flex items-center justify-center p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/10">
           <p className="text-xs text-emerald-500/70 flex items-center gap-2">
             <UserCheck size={14} />
             O sistema identifica automaticamente novos cadastros feitos através do seu link inteligente rastreado.
           </p>
        </div>
      </CardContent>
    </Card>
  );
};
