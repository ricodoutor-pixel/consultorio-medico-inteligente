import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Coins, Award, Sparkles, TrendingUp, ShieldCheck, Gift, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardDoctor {
  rank: number;
  name: string;
  specialty: string;
  simulationsCount: number;
  avgScore: number;
  plantacoins: number;
  badge: string;
}

const MOCK_RANKING: LeaderboardDoctor[] = [
  { rank: 1, name: "Dr. Edilson Bezerra", specialty: "Neurologia / Canabinologia", simulationsCount: 42, avgScore: 98, plantacoins: 8400, badge: "🥇 Mestre Canabinoidista" },
  { rank: 2, name: "Dra. Suelen Naves", specialty: "Medicina Integrativa", simulationsCount: 38, avgScore: 96, plantacoins: 7200, badge: "🥈 Especialista Auditada" },
  { rank: 3, name: "Dra. Olívia Medeiros", specialty: "Psiquiatria", simulationsCount: 31, avgScore: 94, plantacoins: 5900, badge: "🥉 Especialista Auditada" },
  { rank: 4, name: "Dr. Marcos Vinícius", specialty: "Medicina de Família", simulationsCount: 24, avgScore: 91, plantacoins: 4100, badge: "Médico Destaque" },
  { rank: 5, name: "Dra. Ana Carolina", specialty: "Oncologia", simulationsCount: 19, avgScore: 89, plantacoins: 3200, badge: "Médico Destaque" }
];

export function DoctorRankingPlantaCoin() {
  const [balance, setBalance] = useState(650);
  const [ranking, setRanking] = useState<LeaderboardDoctor[]>(MOCK_RANKING);

  useEffect(() => {
    // Load doctor simulations count & score if available
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;

      const { data: sims } = await supabase
        .from("doctor_simulations")
        .select("*")
        .eq("doctor_id", uid);

      if (sims && sims.length > 0) {
        const totalCoins = sims.reduce((acc: number, curr: any) => acc + (curr.plantacoins_earned || 100), 0);
        setBalance(650 + totalCoins);
      }
    });
  }, []);

  const handleRedeem = (perk: string, cost: number) => {
    if (balance < cost) {
      toast.error(`Saldo insuficiente em PlantaCoins. Você precisa de ${cost} PlantaCoins.`);
      return;
    }
    setBalance(prev => prev - cost);
    toast.success(`Resgate efetuado! Você ativou: ${perk}`);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-900 text-white border-amber-500/30 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">Saldo PlantaCoins</span>
            <div className="text-3xl font-black text-amber-400 flex items-center gap-2 mt-1">
              <Coins className="text-amber-400" size={28} /> {balance} <span className="text-sm font-normal text-zinc-300">$PLANTA</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">Equivalente a R$ {(balance * 0.5).toFixed(2)} em vantagens</p>
          </div>
          <Button 
            size="sm"
            onClick={() => toast.info("Resgate de PlantaCoins liberado diretamente em sua Carteira!")}
            className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-xs"
          >
            Resgatar
          </Button>
        </Card>

        <Card className="p-5 bg-card border-border flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase block">Selo de Qualificação</span>
            <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={20} /> Selo Auditado IA
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Sua vitrine ganha destaque no marketplace</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Ativo</Badge>
        </Card>

        <Card className="p-5 bg-card border-border flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase block">Sua Posição no Ranking</span>
            <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-2">
              <Trophy className="text-amber-400" size={20} /> #1 no Ranking Mensal
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Top 3 recebem bônus quinzenal</p>
          </div>
          <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-xs">Mestre</Badge>
        </Card>
      </div>

      {/* Leaderboard & Perks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Table */}
        <Card className="lg:col-span-2 p-6 bg-card border-border shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Trophy className="text-amber-400" /> Liga dos Médicos — Ranking de Simulação
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Os médicos com melhor desempenho nos atendimentos simulados ganham maior visibilidade e PlantaCoins.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {ranking.map((doc) => (
              <div 
                key={doc.rank}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  doc.rank === 1 
                    ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    doc.rank === 1 ? 'bg-amber-400 text-black' : doc.rank === 2 ? 'bg-zinc-300 text-black' : doc.rank === 3 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {doc.rank}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      {doc.name}
                      <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0">{doc.badge}</Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground">{doc.specialty} • {doc.simulationsCount} simulações</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-amber-400 flex items-center justify-end gap-1">
                    <Coins size={14} /> {doc.plantacoins}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Média: {doc.avgScore}/100 pts</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Perks & Benefits Section */}
        <Card className="p-6 bg-card border-border shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2 mb-2">
              <Gift className="text-emerald-500" /> Resgatar Vantagens com PlantaCoin
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Troque suas PlantaCoins acumuladas por benefícios reais na plataforma.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border bg-muted/20 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold">Destaque 7 dias na Home</h4>
                  <p className="text-[10px] text-muted-foreground">Aumenta agendamentos em +40%</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleRedeem("Destaque 7 dias na Home", 500)}
                  className="bg-amber-400 text-black hover:bg-amber-500 text-xs font-bold h-8"
                >
                  500 $PLANTA
                </Button>
              </div>

              <div className="p-3 rounded-xl border bg-muted/20 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold">Desconto 50% em Cursos</h4>
                  <p className="text-[10px] text-muted-foreground">Válido para pós-graduação e módulos</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleRedeem("Desconto 50% em Cursos", 300)}
                  className="bg-amber-400 text-black hover:bg-amber-500 text-xs font-bold h-8"
                >
                  300 $PLANTA
                </Button>
              </div>

              <div className="p-3 rounded-xl border bg-muted/20 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold">Créditos de IA Ilimitados</h4>
                  <p className="text-[10px] text-muted-foreground">Uso livre do Dr. Edilson Agente Clínico</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleRedeem("Créditos de IA Ilimitados", 200)}
                  className="bg-amber-400 text-black hover:bg-amber-500 text-xs font-bold h-8"
                >
                  200 $PLANTA
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Continue realizando treinamentos com o <strong>Paciente Teste</strong> para acumular PlantaCoins diariamente!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
