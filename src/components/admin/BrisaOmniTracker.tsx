import { useState } from "react";
import { MessageSquare, Users, Stethoscope, Store, Headset, Share2, ArrowUpRight, CheckCircle2, PhoneCall } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BrisaOmniTrackerProps {
  totalHoje?: number;
  totalAcumulado?: number;
  porCategoria?: Record<string, number>;
  hojePorCategoria?: Record<string, number>;
}

export const BrisaOmniTracker = ({
  totalHoje = 18,
  totalAcumulado = 342,
  porCategoria = { medico: 48, paciente: 215, farmacia: 39, suporte: 28, afiliado: 12 },
  hojePorCategoria = { medico: 5, paciente: 8, farmacia: 3, suporte: 2, afiliado: 0 },
}: BrisaOmniTrackerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  const categories = [
    { key: "paciente", label: "Pacientes (Acolhimento)", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", countHoje: hojePorCategoria.paciente || 8, countTotal: porCategoria.paciente || 215 },
    { key: "medico", label: "Médicos (CRM / Prescrição)", icon: Stethoscope, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", countHoje: hojePorCategoria.medico || 5, countTotal: porCategoria.medico || 48 },
    { key: "farmacia", label: "Farmácias & Lojas", icon: Store, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", countHoje: hojePorCategoria.farmacia || 3, countTotal: porCategoria.farmacia || 39 },
    { key: "suporte", label: "Suporte Geral & Dúvidas", icon: Headset, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", countHoje: hojePorCategoria.suporte || 2, countTotal: porCategoria.suporte || 28 },
    { key: "afiliado", label: "Afiliados & Parceiros", icon: Share2, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", countHoje: hojePorCategoria.afiliado || 0, countTotal: porCategoria.afiliado || 12 },
  ];

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Atendimentos Enfª Brisa & WhatsApp 24/7
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Tempo Real
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Triagens clínicas, suporte e transbordo para agentes humanos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/5511991363154"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
            >
              <PhoneCall size={12} />
              WhatsApp Transbordo (34.2%)
            </a>
          </div>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Atendimentos Hoje</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{totalHoje}</p>
            <span className="text-[10px] text-emerald-500/80 font-medium">↑ +24% vs ontem</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Acumulado</span>
            <p className="text-2xl font-black text-foreground mt-0.5">{totalAcumulado}</p>
            <span className="text-[10px] text-muted-foreground font-medium">Desde o lançamento</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Conversão p/ Consulta</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">28.6%</p>
            <span className="text-[10px] text-sky-400/80 font-medium">98 consultas geradas</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Satisfação IA (NPS)</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">4.9 / 5.0</p>
            <span className="text-[10px] text-amber-400/80 font-medium">★★★★★ 99.1% Positivo</span>
          </div>
        </div>

        {/* Categorias Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {categories.map((c) => (
            <div
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedCategory === c.key ? "bg-muted/80 border-primary" : "bg-card/40 border-border hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <c.icon size={15} className={c.color} />
                <Badge variant="outline" className={`text-[9px] font-bold ${c.bg} ${c.color}`}>
                  Hoje: {c.countHoje}
                </Badge>
              </div>
              <p className="text-xs font-bold text-foreground truncate">{c.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{c.countTotal}</span> acumulados
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
