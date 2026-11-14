import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Leaf } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  MARKET_SOURCE, marketSeries, platformProjection, recentMonthlyRate, formatBrlCompact, type PlatformStats,
} from "@/lib/growth-projection";

type ViewMode = "planta" | "mercado";

interface ChartPoint {
  year: string;
  value: number;
  usuarios?: number;
  pacientes?: number;
  marco: string;
}

const formatValue = (v: number, mode: ViewMode) =>
  mode === "planta" ? `${Math.round(v).toLocaleString("pt-BR")} usuários` : `R$ ${v.toLocaleString("pt-BR")} mi`;

const CustomTooltip = ({ active, payload, mode }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-2xl border border-border bg-[hsl(240,15%,8%)] px-5 py-4 shadow-2xl max-w-[260px]">
      <p className="text-sm font-black text-foreground mb-2">{d?.year}</p>
      <p className="text-xs font-bold mb-1" style={{ color: mode === "planta" ? "#39FF14" : "#FFD700" }}>
        {mode === "planta" ? "👥" : "💰"} {formatValue(d?.value, mode)}
      </p>
      {mode === "mercado" && d?.pacientes && (
        <p className="text-xs font-bold text-emerald-400 mb-1">
          👥 {d.pacientes.toLocaleString("pt-BR")} pacientes
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
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Números reais do servidor (só totais agregados), atualizados a cada minuto
  useEffect(() => {
    let active = true;
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC nova ainda fora dos tipos gerados
      const { data, error } = await (supabase as any).rpc("public_platform_stats");
      if (active && !error && data) setStats(data as PlatformStats);
    };
    void load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const market = useMemo(() => marketSeries(), []);
  const projection = useMemo(() => (stats ? platformProjection(stats) : []), [stats]);
  const currentYear = new Date().getFullYear();

  const plantaData: ChartPoint[] = projection.map((p) => ({
    year: String(p.year),
    value: p.users,
    usuarios: p.users,
    marco:
      p.year === currentYear
        ? `Hoje: ${(stats?.users_total ?? 0).toLocaleString("pt-BR")} cadastrados (real) · fim do ano no ritmo atual`
        : `Projeção: ritmo real atual + 15% a.a. · ${formatBrlCompact(p.revenueBrl)} no ano · ${p.marketSharePct.toLocaleString("pt-BR")}% dos pacientes do país`,
  }));
  const mercadoData: ChartPoint[] = market.map((m) => ({
    year: String(m.year),
    value: m.revenueMi,
    pacientes: m.patients,
    marco: m.projected ? "Projeção do setor: +15% ao ano (Kaya Mind)" : "Dado real do Anuário Kaya Mind",
  }));

  const data = mode === "planta" ? plantaData : mercadoData;
  const color = mode === "planta" ? "#39FF14" : "#FFD700";
  const gradientId = mode === "planta" ? "gradPlanta" : "gradMercado";
  const last = projection[projection.length - 1];
  const signupRate = stats ? Math.round(recentMonthlyRate(stats.monthly, "signups")) : 0;
  const market2025 = market.find((m) => m.year === 2025)!;
  const market2030 = market[market.length - 1];

  const legendText = mode === "planta"
    ? "Números reais do banco de dados, atualizados a cada minuto. A projeção parte do total de hoje, segue o ritmo real de cadastros e faturamento dos últimos 3 meses (ou do mês atual, quando é o primeiro com vendas) e cresce 15% ao ano, junto com o mercado."
    : "Mercado brasileiro de cannabis medicinal (Anuário Kaya Mind): dados reais de 2024 e 2025 e projeção do setor de 15% ao ano.";

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
            Projeção da Planta y Raiz comparada com o mercado brasileiro de cannabis medicinal
          </p>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-4 md:p-8">
              {/* Toggle Segmented Control */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-display font-black text-foreground flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Dashboard Comparativo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real até hoje + projeção pelo ritmo atual
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
                  {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Carregando os números reais da plataforma…
                    </div>
                  ) : (
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
                        tickFormatter={(v) => mode === "planta" ? Number(v).toLocaleString("pt-BR", { notation: "compact" }) : `R$ ${v} mi`}
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
                        animationDuration={isMobile ? 0 : 800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
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
                      { label: "Usuários 2030 (proj.)", value: last ? last.users.toLocaleString("pt-BR") : "…", icon: "👥" },
                      { label: "Faturamento 2030 (proj.)", value: last ? formatBrlCompact(last.revenueBrl) : "…", icon: "💰" },
                      { label: "Novos cadastros / mês", value: stats ? signupRate.toLocaleString("pt-BR") : "…", icon: "📈" },
                      { label: "Fatia dos pacientes 2030", value: last ? `${last.marketSharePct.toLocaleString("pt-BR")}%` : "…", icon: "🎯" },
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
                      { label: "Mercado 2025 (real)", value: `R$ ${market2025.revenueMi.toLocaleString("pt-BR")} mi`, icon: "📊" },
                      { label: "Pacientes 2025 (real)", value: market2025.patients.toLocaleString("pt-BR"), icon: "👥" },
                      { label: "Crescimento do setor", value: "15% a.a.", icon: "📈" },
                      { label: "Mercado 2030 (proj.)", value: `R$ ${Math.round(market2030.revenueMi).toLocaleString("pt-BR")} mi`, icon: "🏆" },
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
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Fonte do mercado:{" "}
                  <a href={MARKET_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    {MARKET_SOURCE.name}
                  </a>
                  {stats && <> · Plataforma atualizada às {new Date(stats.generated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</>}
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
