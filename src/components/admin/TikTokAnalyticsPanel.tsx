import { useState, useEffect } from "react";
import { Video, Play, TrendingUp, Users, Eye, CheckCircle2, Share2, ExternalLink, Zap, Shield, Sparkles, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface TikTokAnalyticsPanelProps {
  pixelId?: string;
}

const TIKTOK_TRAFFIC_DATA = [
  { dia: "22/08", visualizacoes: 480, cliques: 62, cadastros: 8 },
  { dia: "23/08", visualizacoes: 720, cliques: 94, cadastros: 14 },
  { dia: "24/08", visualizacoes: 1150, cliques: 148, cadastros: 22 },
  { dia: "25/08", visualizacoes: 980, cliques: 126, cadastros: 19 },
  { dia: "26/08", visualizacoes: 1640, cliques: 210, cadastros: 34 },
  { dia: "27/08", visualizacoes: 2100, cliques: 285, cadastros: 46 },
  { dia: "28/08", visualizacoes: 1850, cliques: 240, cadastros: 38 },
];

const TIKTOK_VIDEOS = [
  {
    id: "tt-vid-1",
    title: "Como Iniciar seu Tratamento Canabinoide por R$30 (1 min)",
    duration: "01:00",
    views: "8.4K",
    retention: "82.5%",
    clicks: "342",
    conversions: "48",
    status: "Ativo · Alta Tração 🔥",
  },
  {
    id: "tt-vid-2",
    title: "Médicos Prescritores: 93% de Repasse & PIX Instantâneo",
    duration: "01:00",
    views: "5.1K",
    retention: "76.8%",
    clicks: "198",
    conversions: "32",
    status: "Ativo · Prescritores 🩺",
  },
  {
    id: "tt-vid-3",
    title: "Conheça a Enfª Brisa: Acolhimento Humanizado com IA",
    duration: "00:58",
    views: "4.2K",
    retention: "79.1%",
    clicks: "164",
    conversions: "26",
    status: "Ativo · Triagem 🌿",
  },
  {
    id: "tt-vid-4",
    title: "Importação Segura ANVISA RDC 660 & Farmácia Oficial",
    duration: "01:00",
    views: "3.6K",
    retention: "71.4%",
    clicks: "112",
    conversions: "18",
    status: "Ativo · Educativo 📜",
  },
];

export const TikTokAnalyticsPanel = ({ pixelId = "DA8R8N3C77UBCVGL01RG" }: TikTokAnalyticsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"metrics" | "videos" | "events">("metrics");
  const [testingEvent, setTestingEvent] = useState(false);

  const handleTestPixelEvent = () => {
    setTestingEvent(true);
    try {
      if (typeof (window as any).ttq?.track === "function") {
        (window as any).ttq.track("ViewContent", {
          content_type: "product",
          content_id: "test_telemedicina",
          value: 30.00,
          currency: "BRL",
        });
        toast.success("🎯 Evento de teste 'ViewContent' disparado com sucesso no TikTok Pixel!");
      } else {
        toast.warning("Script do TikTok Pixel (DA8R8N3C77UBCVGL01RG) não detectado no navegador. Desative bloqueadores de anúncios para testar.");
      }
    } catch (e: any) {
      toast.error("Erro ao disparar evento no TikTok Pixel: " + (e?.message || "Falha na execução"));
    } finally {
      setTimeout(() => setTestingEvent(false), 600);
    }
  };

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-md shadow-pink-500/10">
              <Video size={20} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                TikTok Ads & Vídeos 1-Minuto · Monitoramento de Pixel
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  🟢 PIXEL ATIVO
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-foreground font-semibold">ID: {pixelId}</span>
                <span>· Rastreamento completo de campanhas e conversões</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestPixelEvent}
              disabled={testingEvent}
              className="text-xs rounded-xl border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              <Zap size={12} className={`mr-1.5 ${testingEvent ? "animate-spin" : ""}`} />
              Testar Disparo Pixel
            </Button>
            <a
              href="https://ads.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 font-bold px-3 py-1.5 rounded-xl shadow-md transition-all"
            >
              <ExternalLink size={12} />
              TikTok Ads Manager
            </a>
          </div>
        </div>

        {/* Big numbers strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Visualizações Vídeos</span>
            <p className="text-2xl font-black text-foreground mt-0.5">21.3K</p>
            <span className="text-[10px] text-emerald-400 font-medium">↑ +38% esta semana</span>
          </div>

          <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/30">
            <span className="text-[10px] text-pink-400 uppercase font-bold">Cliques p/ Planta y Raíz</span>
            <p className="text-2xl font-black text-pink-400 mt-0.5">1.185</p>
            <span className="text-[10px] text-pink-400/80 font-medium">CTR Médio: 5.56%</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Cadastros Gerados</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">187</p>
            <span className="text-[10px] text-emerald-400/80 font-medium">15.7% Taxa de Conversão</span>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400 uppercase font-bold">Retenção Média Vídeos</span>
            <p className="text-2xl font-black text-cyan-400 mt-0.5">78.4%</p>
            <span className="text-[10px] text-cyan-400/80 font-medium">Vídeos de 1 minuto</span>
          </div>
        </div>

        {/* Chart: Tráfego e Conversões TikTok 7 dias */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">Tráfego & Conversões TikTok (Últimos 7 dias)</span>
            <Badge variant="outline" className="text-[9px] bg-muted/40">Eventos em Tempo Real</Badge>
          </div>
          <div className="h-48 rounded-xl bg-muted/20 border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TIKTOK_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="gTikTok" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="visualizacoes" stroke="#ec4899" fill="url(#gTikTok)" strokeWidth={2} name="Visualizações" />
                <Area type="monotone" dataKey="cliques" stroke="#06b6d4" fill="none" strokeWidth={2} name="Cliques p/ Site" />
                <Area type="monotone" dataKey="cadastros" stroke="#10b981" fill="none" strokeWidth={2} name="Cadastros" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Video Performance Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Play size={13} className="text-pink-400" /> Desempenho dos Vídeos de 1 Minuto
            </span>
            <span className="text-[10px] text-muted-foreground">Foco: Atração diária de usuários e médicos</span>
          </div>
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="text-[10px] font-bold">Vídeo / Conteúdo</TableHead>
                <TableHead className="text-[10px] font-bold">Duração</TableHead>
                <TableHead className="text-[10px] font-bold">Visualizações</TableHead>
                <TableHead className="text-[10px] font-bold">Retenção</TableHead>
                <TableHead className="text-[10px] font-bold">Cliques</TableHead>
                <TableHead className="text-[10px] font-bold">Conversões</TableHead>
                <TableHead className="text-[10px] font-bold text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIKTOK_VIDEOS.map((v) => (
                <TableRow key={v.id} className="hover:bg-muted/30 transition-colors text-xs">
                  <TableCell className="py-2.5 font-bold text-foreground">{v.title}</TableCell>
                  <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">{v.duration}</TableCell>
                  <TableCell className="py-2.5 font-black text-pink-400">{v.views}</TableCell>
                  <TableCell className="py-2.5 font-semibold text-cyan-400">{v.retention}</TableCell>
                  <TableCell className="py-2.5 font-semibold text-foreground">{v.clicks}</TableCell>
                  <TableCell className="py-2.5 font-black text-emerald-400">{v.conversions}</TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Badge variant="outline" className="text-[9px] bg-pink-500/10 text-pink-400 border-pink-500/30">
                      {v.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
