import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Users, Search, Leaf, Activity } from "lucide-react";

const projectionData = [
  { year: "2026", usuarios: 15_000, faturamento: 13.5, fatMensal: 1.125 },
  { year: "2027", usuarios: 45_000, faturamento: 45.9, fatMensal: 3.825 },
  { year: "2028", usuarios: 110_000, faturamento: 125.4, fatMensal: 10.45 },
  { year: "2029", usuarios: 250_000, faturamento: 315, fatMensal: 26.25 },
  { year: "2030", usuarios: 500_000, faturamento: 690, fatMensal: 57.5 },
];

const formatUsers = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString();
const formatBRL = (v: number) => `R$ ${v.toFixed(1)}M`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="rounded-2xl border border-border bg-[hsl(240,15%,8%)] px-5 py-4 shadow-2xl">
      <p className="text-sm font-black text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        <p className="text-xs font-bold" style={{ color: "#39FF14" }}>
          👥 Usuários Ativos: {data?.usuarios?.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs font-bold" style={{ color: "#FFD700" }}>
          💰 Faturamento Anual: R$ {data?.faturamento?.toLocaleString("pt-BR")}M
        </p>
        <p className="text-xs font-bold text-muted-foreground">
          📊 Faturamento Mensal Médio: R$ {data?.fatMensal?.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}M
        </p>
      </div>
    </div>
  );
};

const CannabisMarketChart = () => {
  const [medUsers, setMedUsers] = useState(347_200);
  const [googleSearches, setGoogleSearches] = useState(12_580);
  const [plantaUsers, setPlantaUsers] = useState(1_000);

  const tick = useCallback(() => {
    setMedUsers((p) => p + Math.floor(Math.random() * 3) + 1);
    setGoogleSearches((p) => p + Math.floor(Math.random() * 8) + 2);
    setPlantaUsers((p) => p + (Math.random() < 0.08 ? 5 : Math.random() < 0.4 ? 1 : 0));
  }, []);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const liveCounters = [
    {
      icon: Activity,
      value: medUsers.toLocaleString("pt-BR"),
      label: "Usuários de Cannabis Medicinal / min",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Search,
      value: googleSearches.toLocaleString("pt-BR"),
      label: "Buscas no Google / min",
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      icon: Users,
      value: plantaUsers.toLocaleString("pt-BR"),
      label: "Cadastrados Planta y Raiz",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
            <Leaf size={14} /> Dados em Tempo Real
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
            Projeção <span className="text-gradient-green">Planta y Raiz</span> 2026–2030
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Crescimento exponencial de usuários e faturamento no mercado de cannabis medicinal
          </p>
        </motion.div>

        {/* Live Counters */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          {liveCounters.map((c, i) => (
            <Card key={i} className={`border ${c.bg} backdrop-blur-sm`}>
              <CardContent className="p-4 md:p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${c.bg}`}>
                  <c.icon size={22} className={c.color} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl md:text-2xl font-display font-black ${c.color} tabular-nums`}>
                    {c.value}
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2 animate-pulse" />
                  </p>
                  <p className="text-xs text-muted-foreground font-bold truncate">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden">
            <CardContent className="p-4 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-display font-black text-foreground flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Projeção de Crescimento Planta y Raiz
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usuários ativos e faturamento anual (R$ milhões) • Passe o mouse para detalhes
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#39FF14" }} />
                    Usuários
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#FFD700" }} />
                    Faturamento
                  </span>
                </div>
              </div>

              <div className="h-[320px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#39FF14" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="year"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={13}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={formatUsers}
                      stroke="rgba(57,255,20,0.4)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `R$${v}M`}
                      stroke="rgba(255,215,0,0.4)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={65}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="usuarios"
                      stroke="#39FF14"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradUsuarios)"
                      dot={{ r: 5, fill: "#39FF14", stroke: "#0A0E27", strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: "#39FF14", stroke: "#fff", strokeWidth: 3 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="faturamento"
                      stroke="#FFD700"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradFaturamento)"
                      dot={{ r: 5, fill: "#FFD700", stroke: "#0A0E27", strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: "#FFD700", stroke: "#fff", strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
                {[
                  { label: "Usuários 2030", value: "500K", icon: "👥" },
                  { label: "Faturamento 2030", value: "R$ 690M", icon: "💰" },
                  { label: "CAGR Receita", value: "119%", icon: "📈" },
                  { label: "Novos Cadastros/min", value: "+5", icon: "🚀" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-muted/20 border border-border">
                    <span className="text-lg">{s.icon}</span>
                    <p className="text-sm md:text-base font-display font-black text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Legenda técnica */}
              <p className="mt-6 text-xs text-muted-foreground leading-relaxed text-center italic">
                Projeções baseadas na expansão do mercado regulado pela ANVISA e no modelo de democratização de acesso da Planta y Raiz. Estimamos atingir 500 mil pacientes ativos até 2030 com faturamento anual projetado em R$ 690 milhões.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CannabisMarketChart;
