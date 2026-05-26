import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Search, Leaf, Activity } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type ViewMode = "planta" | "mercado";

const plantaData = [
  { year: "2026", value: 13.5, usuarios: 15_000, marco: "Início das operações reguladas" },
  { year: "2027", value: 45.9, usuarios: 45_000, marco: "Expansão nacional acelerada" },
  { year: "2028", value: 125.4, usuarios: 110_000, marco: "Parcerias com redes farmacêuticas" },
  { year: "2029", value: 315, usuarios: 250_000, marco: "Liderança no mercado digital" },
  { year: "2030", value: 690, usuarios: 500_000, marco: "Consolidação e Acesso em Massa" },
];

const mercadoData = [
  { year: "2026", value: 2.2, marco: "Regulamentação ANVISA consolidada" },
  { year: "2027", value: 3.8, marco: "Novos players e importações facilitadas" },
  { year: "2028", value: 5.1, marco: "Cultivo nacional autorizado em escala" },
  { year: "2029", value: 7.3, marco: "Integração com o SUS em fase piloto" },
  { year: "2030", value: 9.5, marco: "Mercado maduro e regulado" },
];

const formatValue = (v: number, mode: ViewMode) =>
  mode === "planta" ? `R$ ${v}M` : `R$ ${v}B`;

const CustomTooltip = ({ active, payload, mode }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-2xl border border-border bg-[hsl(240,15%,8%)] px-5 py-4 shadow-2xl max-w-[260px]">
      <p className="text-sm font-black text-foreground mb-2">{d?.year}</p>
      <p className="text-xs font-bold mb-1" style={{ color: mode === "planta" ? "#39FF14" : "#FFD700" }}>
        💰 {formatValue(d?.value, mode)}
      </p>
      {mode === "planta" && d?.usuarios && (
        <p className="text-xs font-bold text-emerald-400 mb-1">
          👥 {d.usuarios.toLocaleString("pt-BR")} usuários
        </p>
      )}
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        📋 {d?.marco}
      </p>
    </div>
  );
};

const CannabisMarketChart = () => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<ViewMode>("planta");
  const medUsersRef = useRef(347_200);
  const googleRef = useRef(12_580);
  const plantaRef = useRef(1_000);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      medUsersRef.current += Math.floor(Math.random() * 3) + 1;
      googleRef.current += Math.floor(Math.random() * 8) + 2;
      if (Math.random() < 0.08) plantaRef.current += 5;
      else if (Math.random() < 0.4) plantaRef.current += 1;
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const medUsers = medUsersRef.current;
  const googleSearches = googleRef.current;
  const plantaUsers = plantaRef.current;

  const data = mode === "planta" ? plantaData : mercadoData;
  const color = mode === "planta" ? "#39FF14" : "#FFD700";
  const gradientId = mode === "planta" ? "gradPlanta" : "gradMercado";

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

  const legendText = mode === "planta"
    ? "Nossa meta é capturar 7% do market share nacional através da democratização do acesso à cannabis medicinal."
    : "Estimativa de crescimento orgânico do setor regulado pela ANVISA no Brasil.";

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />
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
            <Leaf size={14} /> Visão de Futuro
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
            Projeção de <span className="text-gradient-green">Crescimento</span> 2026–2030
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Compare as projeções da Planta y Raiz com o mercado brasileiro de cannabis medicinal
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
            <Card key={i} className={`border ${c.bg}`}>
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
              {/* Toggle Segmented Control */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-display font-black text-foreground flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Dashboard Comparativo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alterne entre as projeções para comparar cenários
                  </p>
                </div>

                <div className="inline-flex rounded-2xl p-1 bg-muted/30 border border-border">
                  <button
                    onClick={() => setMode("planta")}
                    className={`relative px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      mode === "planta"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {mode === "planta" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl border border-emerald-500/40"
                        style={{
                          background: "linear-gradient(135deg, rgba(57,255,20,0.15), rgba(57,255,20,0.05))",
                          boxShadow: "0 0 20px rgba(57,255,20,0.2), inset 0 0 20px rgba(57,255,20,0.05)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Leaf size={14} /> Planta y Raiz
                    </span>
                  </button>
                  <button
                    onClick={() => setMode("mercado")}
                    className={`relative px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      mode === "mercado"
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {mode === "mercado" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl border border-yellow-500/40"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))",
                          boxShadow: "0 0 20px rgba(255,215,0,0.2), inset 0 0 20px rgba(255,215,0,0.05)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <TrendingUp size={14} /> Mercado Brasileiro
                    </span>
                  </button>
                </div>
              </div>

              {/* Animated Chart */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="h-[320px] md:h-[420px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="year"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={14}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => mode === "planta" ? `R$${v}M` : `R$${v}B`}
                        stroke={`${color}66`}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip content={<CustomTooltip mode={mode} />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        dot={{ r: 6, fill: color, stroke: "#0A0E27", strokeWidth: 3 }}
                        activeDot={{ r: 10, fill: color, stroke: "#fff", strokeWidth: 3 }}
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>

              {/* Dynamic Legend */}
              <motion.div
                key={`legend-${mode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-border"
              >
                {/* Stats row for Planta mode */}
                {mode === "planta" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Usuários 2030", value: "500K", icon: "👥" },
                      { label: "Faturamento 2030", value: "R$ 690M", icon: "💰" },
                      { label: "CAGR Receita", value: "119%", icon: "📈" },
                      { label: "Market Share", value: "7%", icon: "🎯" },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-lg">{s.icon}</span>
                        <p className="text-sm md:text-base font-display font-black text-foreground mt-1">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {mode === "mercado" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Mercado 2026", value: "R$ 2.2B", icon: "📊" },
                      { label: "Mercado 2030", value: "R$ 9.5B", icon: "🏆" },
                      { label: "CAGR Setor", value: "44%", icon: "📈" },
                      { label: "Crescimento", value: "4.3x", icon: "🚀" },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-muted/20 border border-border">
                        <span className="text-lg">{s.icon}</span>
                        <p className="text-sm md:text-base font-display font-black text-foreground mt-1">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
                  {legendText}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CannabisMarketChart;
