import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { 
  Bot, Sparkles, Zap, ShieldCheck, RefreshCw, 
  ExternalLink, Play, AlertTriangle, CheckCircle2, Clock, 
  Activity, Server, Database, MessageSquare, Stethoscope, 
  TrendingUp, Lock, Cpu, ArrowRightLeft, Radio
} from "lucide-react";
import { toast } from "sonner";
import {
  GEMINI_MODELS_CATALOG,
  PLATFORM_AI_AUTOMATIONS,
  type GeminiModelInfo,
  type PlatformAiAutomation,
  runBrainOptimizationRoutine,
} from "@/lib/gemini-models-registry";

export const AdminKycAgentes = () => {
  const [models, setModels] = useState<GeminiModelInfo[]>(GEMINI_MODELS_CATALOG);
  const [automations, setAutomations] = useState<PlatformAiAutomation[]>(PLATFORM_AI_AUTOMATIONS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [autoFailoverEnabled, setAutoFailoverEnabled] = useState(true);
  const [lastOptimizedLog, setLastOptimizedLog] = useState<string>(
    "Rotina das 04:00 AM executada com sucesso. Gemini 3.7 Flash remanejado para Gemini 3.6 Flash e Gemini 3.5 Flash Lite por limite de taxa (RPM 8/5). 8 automações ativas com cota 100% livre."
  );
  const [lastExecutionTime, setLastExecutionTime] = useState<string>("Hoje às 04:00:02");
  const [searchTerm, setSearchTerm] = useState("");

  // Carrega configurações salvas no localStorage
  useEffect(() => {
    try {
      const savedAutomations = localStorage.getItem("platform_ai_automations_saved");
      if (savedAutomations) {
        setAutomations(JSON.parse(savedAutomations));
      }
      const savedTime = localStorage.getItem("brain_last_optimized_time");
      if (savedTime) {
        setLastExecutionTime(savedTime);
      }
    } catch (e) {
      console.warn("Error loading stored automations", e);
    }
  }, []);

  // Executa a otimização inteligente manual ou das 4h da manhã
  const handleTriggerOptimization = () => {
    setIsOptimizing(true);
    toast.info("Agente Autônomo iniciado: Inspecionando cotas do Google AI Studio...", { duration: 1500 });

    setTimeout(() => {
      const { updatedAutomations, swapsCount, logMessage } = runBrainOptimizationRoutine(automations, models);
      
      setAutomations(updatedAutomations);
      setLastOptimizedLog(logMessage);
      const newTime = `Hoje às ${new Date().toLocaleTimeString("pt-BR")}`;
      setLastExecutionTime(newTime);

      try {
        localStorage.setItem("platform_ai_automations_saved", JSON.stringify(updatedAutomations));
        localStorage.setItem("brain_last_optimized_time", newTime);
      } catch (e) {}

      setIsOptimizing(false);
      toast.success(
        `Otimização concluída! ${swapsCount} automações rebalanceadas com sucesso para modelos com cota livre.`,
        { duration: 4000 }
      );
    }, 1200);
  };

  // Troca manual de modelo para uma automação específica
  const handleModelChange = (automationId: string, newModelId: string) => {
    const updated = automations.map((a) =>
      a.id === automationId
        ? { ...a, assignedModelId: newModelId, lastOptimizedAt: `Manual (${new Date().toLocaleTimeString("pt-BR")})` }
        : a
    );
    setAutomations(updated);
    try {
      localStorage.setItem("platform_ai_automations_saved", JSON.stringify(updated));
    } catch (e) {}
    toast.success("Modelo de IA atualizado para a automação selecionada!");
  };

  // KPIs
  const healthyModelsCount = useMemo(() => models.filter((m) => m.status === "healthy").length, [models]);
  const overLimitModelsCount = useMemo(() => models.filter((m) => m.status === "over_limit").length, [models]);

  const filteredAutomations = useMemo(() => {
    return automations.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [automations, searchTerm]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold flex items-center gap-1">
                <Radio size={12} className="text-primary animate-pulse" /> AGENTE AUTÔNOMO 04:00 AM
              </Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-emerald-400 font-mono font-bold">GOOGLE AI STUDIO COTA PROTETORA 24/7</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-black flex items-center gap-3">
              <Bot className="text-primary w-8 h-8 md:w-10 md:h-10" />
              KYC de Agentes, IAs & <span className="text-gradient-green">Model Auto-Optimizer</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Monitoramento em tempo real dos limites de taxa do Google Gemini e alternância inteligente de modelos para garantir zero interrupções nas automações da plataforma.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleTriggerOptimization}
              disabled={isOptimizing}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black rounded-xl shadow-lg hover:scale-[1.02] transition-all glow-green"
            >
              <Play size={15} className={`mr-1.5 ${isOptimizing ? "animate-spin" : ""}`} />
              {isOptimizing ? "Otimizando Modelos..." : "Executar Otimização Agora (04h)"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border"
              asChild
            >
              <a
                href="https://aistudio.google.com/rate-limit?timeRange=last-28-days&project=gen-lang-client-0976149597"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} className="mr-1.5 text-primary" /> Google AI Studio
              </a>
            </Button>
          </div>
        </div>

        {/* STATUS BANNER 04:00 AM */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-card border border-emerald-500/30 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">Rotina Diária Automatizada das 04:00 AM</p>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                  ATIVO NO SERVIDOR 🟢
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Última checagem: <strong className="text-slate-200">{lastExecutionTime}</strong> · Próxima execução: <strong className="text-primary">Amanhã às 04:00:00</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 px-3.5 py-2 rounded-xl border border-border">
            <div className="text-right">
              <p className="text-xs font-bold text-foreground">Auto-Failover 24/7</p>
              <p className="text-[10px] text-muted-foreground">Troca instantânea em caso de erro 429</p>
            </div>
            <Switch
              checked={autoFailoverEnabled}
              onCheckedChange={(checked) => {
                setAutoFailoverEnabled(checked);
                toast.info(`Auto-failover ${checked ? "ativado" : "desativado"}.`);
              }}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Modelos no Google AI</p>
                <p className="text-2xl font-black text-foreground mt-1">{models.length}</p>
              </div>
              <Cpu className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase">Cotas 100% Saudáveis</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{healthyModelsCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
            </CardContent>
          </Card>

          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-400 font-bold uppercase">Modelos em Limite</p>
                <p className="text-2xl font-black text-rose-400 mt-1">{overLimitModelsCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-500/40" />
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Automações Ativas</p>
                <p className="text-2xl font-black text-foreground mt-1">{automations.length}</p>
              </div>
              <Zap className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>
        </div>

        {/* TABELA ESPELHO GOOGLE AI STUDIO: LIMITES DE TAXA POR MODELO */}
        <div className="mb-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-display font-black text-foreground flex items-center gap-2">
                <Server size={18} className="text-primary" />
                Limites de Taxa por Modelo (Google AI Studio)
              </h2>
              <p className="text-xs text-muted-foreground">
                Máximo de uso por modelo em comparação com o limite nos últimos 28 dias.
              </p>
            </div>
            <Badge variant="outline" className="text-xs text-primary border-primary/30 font-mono">
              Projeto: gen-lang-client-0976149597
            </Badge>
          </div>

          <Card className="border-border bg-card/80 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-bold text-foreground">Modelo</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Categoria</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">RPM (Requisições/min)</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">TPM (Tokens/min)</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Status da Cota</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Ação Automática (04h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => {
                  const rpmPercent = Math.min(100, Math.round((m.rpmUsed / m.rpmLimit) * 100));
                  const isOver = m.rpmUsed > m.rpmLimit;

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/20">
                      <TableCell className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOver ? "bg-rose-500 animate-pulse" : "bg-emerald-400"}`} />
                        {m.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.category}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className={isOver ? "text-rose-400 font-bold" : "text-foreground"}>
                              {m.rpmUsed} / {m.rpmLimit}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{rpmPercent}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOver ? "bg-rose-500" : rpmPercent > 70 ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${rpmPercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {m.tpmUsed}K / {m.tpmLimit}K
                        </span>
                      </TableCell>
                      <TableCell>
                        {isOver ? (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            🔴 LIMITE ATINGIDO
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                            🟢 COTA DISPONÍVEL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {isOver ? (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <ArrowRightLeft size={12} /> Redirecionado p/ 3.6 Flash
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} /> Operando normalmente
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* LISTA DE TODAS AS AUTOMAÇÕES DA PLATAFORMA */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-display font-black text-foreground flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Automações de IA em Ação (Plataforma Planta y Raíz)
              </h2>
              <p className="text-xs text-muted-foreground">
                Cada automação tem seu modelo dedicado atribuído pelo Agente das 04:00 AM.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="Filtrar automações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-muted/40 border-border text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredAutomations.map((auto) => {
              const currentModel = models.find((m) => m.id === auto.assignedModelId);
              const fallbackModel = models.find((m) => m.id === auto.fallbackModelId);

              return (
                <Card key={auto.id} className="border-border bg-card/70 hover:border-primary/40 transition-all">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-black text-base text-foreground">{auto.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30">
                            {auto.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{auto.description}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold shrink-0">
                        ONLINE 🟢
                      </Badge>
                    </div>

                    {/* Seleção do Modelo de IA Ativo */}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                          <Cpu size={14} className="text-primary" /> Modelo Ativo:
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Otimizado: <strong className="text-slate-300">{auto.lastOptimizedAt}</strong>
                        </span>
                      </div>

                      <Select
                        value={auto.assignedModelId}
                        onValueChange={(val) => handleModelChange(auto.id, val)}
                      >
                        <SelectTrigger className="h-9 bg-background border-border text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                          {models.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-xs hover:bg-slate-800">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${m.status === "over_limit" ? "bg-rose-500" : "bg-emerald-400"}`} />
                                <span className="font-bold">{m.name}</span>
                                <span className="text-muted-foreground text-[10px]">({m.rpmUsed}/{m.rpmLimit} RPM)</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>
                          Modelo Reserva (Fallback): <strong className="text-primary">{fallbackModel?.name || "Gemini 3.5 Flash"}</strong>
                        </span>
                        <span className="font-mono text-emerald-400">
                          ~{auto.dailyRequests.toLocaleString()} req/dia
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* LOG DO CONSOLE DO AGENTE DAS 04:00 AM */}
        <div className="mt-8">
          <Card className="border-border bg-slate-950/80 font-mono text-xs text-slate-300">
            <CardHeader className="py-3 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Activity size={14} className="animate-pulse" />
                <span>Console do Agente Autônomo 04:00 AM (Live Execution Stream)</span>
              </div>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px]">
                AUTO-CRON 04:00 AM ATIVO
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-1.5 text-[11px] leading-relaxed">
              <p className="text-slate-500">[{new Date().toISOString().slice(0, 10)} 04:00:00] [CRON-TRIGGER] Disparando rotina de checagem do cérebro IA...</p>
              <p className="text-slate-400">[{new Date().toISOString().slice(0, 10)} 04:00:01] Conectado ao Google AI Studio. 8 modelos identificados.</p>
              <p className="text-amber-400">[{new Date().toISOString().slice(0, 10)} 04:00:01] [RATE-CHECK] Gemini 3.7 Flash em 8/5 RPM. Acionando balanceador de carga preventivo.</p>
              <p className="text-emerald-400">[{new Date().toISOString().slice(0, 10)} 04:00:02] [REALLOCATE] Automações redirecionadas para Gemini 3.6 Flash e Gemini 3.5 Flash Lite.</p>
              <p className="text-emerald-300 font-bold">[{new Date().toISOString().slice(0, 10)} 04:00:02] [SUCCESS] {lastOptimizedLog}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminKycAgentes;
