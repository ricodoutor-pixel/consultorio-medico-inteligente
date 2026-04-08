import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from "recharts";
import { TrendingUp, Users, Search, Leaf, Activity } from "lucide-react";

const marketProjection = [
  { year: "2026", mercado: 4.2, plantaRaiz: 0.12 },
  { year: "2027", mercado: 6.8, plantaRaiz: 0.45 },
  { year: "2028", mercado: 10.5, plantaRaiz: 1.2 },
  { year: "2029", mercado: 15.3, plantaRaiz: 3.1 },
  { year: "2030", mercado: 22.0, plantaRaiz: 6.5 },
];

const barColors = [
  "hsl(152, 80%, 45%)",
  "hsl(160, 75%, 42%)",
  "hsl(145, 85%, 38%)",
  "hsl(140, 80%, 35%)",
  "hsl(135, 90%, 30%)",
];

const formatBRL = (v: number) =>
  `R$ ${v.toFixed(1)} Bi`;

const CannabisMarketChart = () => {
  const [medUsers, setMedUsers] = useState(347_200);
  const [googleSearches, setGoogleSearches] = useState(12_580);
  const [plantaUsers, setPlantaUsers] = useState(1_000);
  const [activePeriod, setActivePeriod] = useState<"mercado" | "plantaRaiz">("mercado");

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
      pulse: true,
    },
    {
      icon: Search,
      value: googleSearches.toLocaleString("pt-BR"),
      label: "Buscas no Google / min",
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
      pulse: true,
    },
    {
      icon: Users,
      value: plantaUsers.toLocaleString("pt-BR"),
      label: "Cadastrados Planta y Raiz",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      pulse: true,
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Glow background */}
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
            Projeção do Mercado <span className="text-gradient-green">Cannabis Medicinal</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Brasil 2026–2030 • Crescimento exponencial da indústria e da Planta y Raiz
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
                    {c.pulse && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2 animate-pulse" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold truncate">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden">
            <CardContent className="p-4 md:p-8">
              {/* Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-display font-black text-foreground flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    {activePeriod === "mercado"
                      ? "Mercado Brasileiro de Cannabis Medicinal"
                      : "Projeção Planta y Raiz"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valores em bilhões de reais (R$) • Fonte: Kaya Mind, ABICANN
                  </p>
                </div>
                <div className="flex gap-2">
                  {(["mercado", "plantaRaiz"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActivePeriod(key)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activePeriod === key
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {key === "mercado" ? "Mercado" : "Planta y Raiz"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-[300px] md:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activePeriod === "mercado" ? (
                    <BarChart data={marketProjection} barSize={40}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(152, 80%, 45%)" stopOpacity={1} />
                          <stop offset="100%" stopColor="hsl(152, 80%, 45%)" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={13} fontWeight={700} tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(v) => `R$${v}Bi`}
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatBRL(value), "Valor de Mercado"]}
                        contentStyle={{
                          background: "hsl(240 15% 8%)",
                          border: "1px solid hsl(240 10% 18%)",
                          borderRadius: "14px",
                          color: "hsl(240 10% 93%)",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      />
                      <Bar dataKey="mercado" radius={[8, 8, 0, 0]}>
                        {marketProjection.map((_, i) => (
                          <Cell key={i} fill={barColors[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={marketProjection}>
                      <defs>
                        <linearGradient id="areaGradPR" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(152,80%,45%)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(152,80%,45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={13} fontWeight={700} tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(v) => `R$${v}Bi`}
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatBRL(value), "Planta y Raiz"]}
                        contentStyle={{
                          background: "hsl(240 15% 8%)",
                          border: "1px solid hsl(240 10% 18%)",
                          borderRadius: "14px",
                          color: "hsl(240 10% 93%)",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="plantaRaiz"
                        stroke="hsl(152,80%,45%)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#areaGradPR)"
                        dot={{ r: 5, fill: "hsl(152,80%,45%)", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: "hsl(152,80%,45%)", stroke: "#fff", strokeWidth: 3 }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Bottom stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
                {[
                  { label: "CAGR Mercado", value: "38.5%", icon: "📈" },
                  { label: "Meta 2030 PR", value: "R$ 6.5 Bi", icon: "🎯" },
                  { label: "Market Share 2030", value: "29.5%", icon: "🏆" },
                  { label: "Novos Cadastros/min", value: "+5", icon: "🚀" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-muted/20 border border-border">
                    <span className="text-lg">{s.icon}</span>
                    <p className="text-sm md:text-base font-display font-black text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CannabisMarketChart;
