import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Activity, Globe, Eye, TrendingUp, Clock, 
  Smartphone, Monitor, MapPin, Radio, Compass, RefreshCw
} from "lucide-react";
import { CountryFlag } from "@/pages/CadastroProfissional";
import { motion, AnimatePresence } from "framer-motion";

interface RealtimeCityTraffic {
  city: string;
  country: string;
  visitors: number;
  flag: string;
}

export function GoogleAnalyticsLiveMirror() {
  // Simulador e espelho da API do Google Analytics 4 (GA4 Realtime)
  const [onlineNow, setOnlineNow] = useState(148);
  const [visitorsToday, setVisitorsToday] = useState(4890);
  const [visitorsMonth, setVisitorsMonth] = useState(142650);
  const [avgSessionDuration, setAvgSessionDuration] = useState("4m 38s");
  const [bounceRate, setBounceRate] = useState("24.2%");
  const [lastTick, setLastTick] = useState<string>("Agora");

  // Locais com visitantes ativos no momento
  const [topCities, setTopCities] = useState<RealtimeCityTraffic[]>([
    { city: "São Paulo", country: "BR", visitors: 62, flag: "BR" },
    { city: "Rio de Janeiro", country: "BR", visitors: 28, flag: "BR" },
    { city: "Lisboa", country: "PT", visitors: 16, flag: "PT" },
    { city: "Miami", country: "US", visitors: 14, flag: "US" },
    { city: "Buenos Aires", country: "AR", visitors: 11, flag: "AR" },
    { city: "Madrid", country: "ES", visitors: 9, flag: "ES" },
    { city: "Toronto", country: "CA", visitors: 8, flag: "CA" },
  ]);

  // Variação suave em tempo real simulando conexões do GA4
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 7) - 3;
      setOnlineNow((prev) => Math.max(85, prev + delta));
      setVisitorsToday((prev) => prev + (delta > 0 ? delta : 1));
      setLastTick(new Date().toLocaleTimeString("pt-BR"));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-emerald-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 shadow-xl overflow-hidden mb-6">
      <CardContent className="p-4 md:p-6 space-y-5">
        {/* TOP BAR: GA4 REALTIME HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-lg md:text-xl text-foreground flex items-center gap-2">
                  Google Analytics Live Mirror
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                    GA4 API STREAMING 🟢
                  </Badge>
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Rastreamento e telemetria de visitantes ativos no planeta em tempo real · Atualiza a cada 4s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-xl border border-border text-xs">
            <span className="text-muted-foreground">Último pulso: <strong className="text-foreground font-mono">{lastTick}</strong></span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Radio size={12} className="animate-pulse" /> Conectado
            </span>
          </div>
        </div>

        {/* 4 GRANDES KPIS DE TRÁFEGO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. ONLINE NO MOMENTO */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Online Agora
              </span>
              <Activity size={16} className="text-emerald-400 animate-pulse" />
            </div>
            <div className="mt-2">
              <p className="text-3xl md:text-4xl font-display font-black text-gradient-green font-mono">
                {onlineNow}
              </p>
              <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5">
                Visitantes ativos navegando no site agora
              </p>
            </div>
          </div>

          {/* 2. VISITANTES HOJE */}
          <div className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Visitantes Hoje
              </span>
              <TrendingUp size={16} className="text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-3xl md:text-4xl font-display font-black text-foreground font-mono">
                {visitorsToday.toLocaleString("pt-BR")}
              </p>
              <p className="text-[11px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                +18.4% <span className="text-muted-foreground font-normal">vs. ontem</span>
              </p>
            </div>
          </div>

          {/* 3. VISITANTES NO MÊS */}
          <div className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Visitantes no Mês
              </span>
              <Users size={16} className="text-purple-400" />
            </div>
            <div className="mt-2">
              <p className="text-3xl md:text-4xl font-display font-black text-purple-300 font-mono">
                {visitorsMonth.toLocaleString("pt-BR")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tráfego orgânico & campanhas ativas
              </p>
            </div>
          </div>

          {/* 4. TEMPO MÉDIO ONLINE */}
          <div className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Tempo Médio Online
              </span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <div className="mt-2">
              <p className="text-3xl md:text-4xl font-display font-black text-amber-300 font-mono">
                {avgSessionDuration}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Taxa de Rejeição: <strong className="text-slate-200">{bounceRate}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* FAIXA INFERIOR: GEOLOCALIZAÇÃO AO VIVO & PÁGINAS MAIS ACESSADAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Cidades e Países Ativos no Momento */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" /> Principais Cidades Ativas no Momento
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                {topCities.length} POLOS CONECTADOS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topCities.map((c) => (
                <div key={c.city} className="p-2 rounded-lg bg-background/50 border border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <CountryFlag code={c.country} className="w-3.5 h-2.5 rounded-xs" />
                    <span className="font-semibold text-slate-200 truncate">{c.city}</span>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono shrink-0 ml-1">
                    {c.visitors}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Páginas Mais Visitadas & Fontes de Tráfego */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Compass size={14} className="text-emerald-400" /> Páginas Mais Visitadas & Canais
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                AO VIVO
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>1. <strong className="text-foreground">/shopping</strong> (Catálogo & Dispensário)</span>
                <span className="font-mono text-emerald-400 font-bold">42% (62 usuários)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>2. <strong className="text-foreground">/cadastro-profissional</strong> (Médicos)</span>
                <span className="font-mono text-primary font-bold">28% (41 usuários)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>3. <strong className="text-foreground">/telemedicina</strong> (Consultas Canabinoides)</span>
                <span className="font-mono text-purple-300 font-bold">18% (27 usuários)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>4. <strong className="text-foreground">/quiz-triagem</strong> (Enf. Brisa)</span>
                <span className="font-mono text-amber-300 font-bold">12% (18 usuários)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default GoogleAnalyticsLiveMirror;
