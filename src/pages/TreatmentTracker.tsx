import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, Calendar, TrendingUp, Pill, AlertTriangle, 
  Plus, Save, BarChart3, Heart, Moon, Brain, Smile 
} from "lucide-react";

interface DailyLog {
  id: string;
  date: string;
  product: string;
  dosageMg: number;
  route: string;
  thcPct: number;
  cbdPct: number;
  painLevel: number;
  anxietyLevel: number;
  sleepQuality: number;
  moodLevel: number;
  sideEffects: string[];
  notes: string;
}

const SIDE_EFFECTS = [
  "Boca seca", "Tontura", "Sonolência", "Náusea", "Dor de cabeça",
  "Aumento de apetite", "Olhos vermelhos", "Taquicardia", "Fadiga",
  "Alteração de humor", "Dificuldade de concentração", "Nenhum"
];

const ROUTES = [
  { value: "sublingual", label: "Sublingual (Óleo)" },
  { value: "oral", label: "Via Oral (Cápsulas)" },
  { value: "inalacao", label: "Inalação (Vaporização)" },
  { value: "topico", label: "Tópico (Creme/Pomada)" },
  { value: "supositorio", label: "Supositório" },
];

const TreatmentTracker = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [form, setForm] = useState({
    product: "",
    dosageMg: 25,
    route: "sublingual",
    thcPct: 0,
    cbdPct: 20,
    painLevel: 5,
    anxietyLevel: 5,
    sleepQuality: 5,
    moodLevel: 5,
    notes: "",
  });

  const toggleEffect = (effect: string) => {
    setSelectedEffects(prev =>
      prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
    );
  };

  const handleSave = async () => {
    if (!form.product) {
      toast({ title: "Produto obrigatório", variant: "destructive" });
      return;
    }

    const newLog: DailyLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...form,
      sideEffects: selectedEffects,
    };

    setLogs(prev => [newLog, ...prev]);
    toast({ title: "Registro salvo ✅", description: "Acompanhamento atualizado com sucesso." });

    // Reset form
    setSelectedEffects([]);
    setForm(f => ({ ...f, product: "", notes: "" }));
  };

  const avgPain = logs.length ? (logs.reduce((s, l) => s + l.painLevel, 0) / logs.length).toFixed(1) : "—";
  const avgSleep = logs.length ? (logs.reduce((s, l) => s + l.sleepQuality, 0) / logs.length).toFixed(1) : "—";
  const avgMood = logs.length ? (logs.reduce((s, l) => s + l.moodLevel, 0) / logs.length).toFixed(1) : "—";

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="text-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Treatment Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe seu tratamento com cannabis medicinal — RDC ANVISA 660/2022
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Heart size={20} className="mx-auto mb-1 text-red-400" />
              <p className="text-2xl font-bold text-foreground">{avgPain}</p>
              <p className="text-[10px] text-muted-foreground">Dor (média)</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Moon size={20} className="mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold text-foreground">{avgSleep}</p>
              <p className="text-[10px] text-muted-foreground">Sono (média)</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Smile size={20} className="mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold text-foreground">{avgMood}</p>
              <p className="text-[10px] text-muted-foreground">Humor (média)</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <BarChart3 size={20} className="mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{logs.length}</p>
              <p className="text-[10px] text-muted-foreground">Registros</p>
            </CardContent>
          </Card>
        </div>

        {/* New Entry Form */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus size={18} className="text-primary" /> Novo Registro Diário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  <Pill size={12} className="inline mr-1" /> Produto / Medicamento
                </label>
                <Input
                  value={form.product}
                  onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                  placeholder="Ex: CBD Full Spectrum 3000mg - Ease Labs"
                  className="bg-muted border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Via de Administração</label>
                <Select value={form.route} onValueChange={v => setForm(f => ({ ...f, route: v }))}>
                  <SelectTrigger className="bg-muted border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  Dosagem: {form.dosageMg}mg
                </label>
                <Slider
                  value={[form.dosageMg]}
                  onValueChange={v => setForm(f => ({ ...f, dosageMg: v[0] }))}
                  min={1} max={500} step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  CBD: {form.cbdPct}%
                </label>
                <Slider
                  value={[form.cbdPct]}
                  onValueChange={v => setForm(f => ({ ...f, cbdPct: v[0] }))}
                  min={0} max={100} step={0.5}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">
                  THC: {form.thcPct}%
                </label>
                <Slider
                  value={[form.thcPct]}
                  onValueChange={v => setForm(f => ({ ...f, thcPct: v[0] }))}
                  min={0} max={30} step={0.1}
                  className="mt-2"
                />
                {form.thcPct > 0.2 && (
                  <Badge variant="destructive" className="mt-1 text-[10px]">
                    <AlertTriangle size={10} className="mr-1" />
                    THC {'>'} 0.2% — Requer Receita Tipo A (ANVISA RDC 660/2022)
                  </Badge>
                )}
              </div>
            </div>

            {/* Symptom Scales */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Heart size={10} /> Nível de Dor: {form.painLevel}/10
                </label>
                <Slider
                  value={[form.painLevel]}
                  onValueChange={v => setForm(f => ({ ...f, painLevel: v[0] }))}
                  min={0} max={10} step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Brain size={10} /> Nível de Ansiedade: {form.anxietyLevel}/10
                </label>
                <Slider
                  value={[form.anxietyLevel]}
                  onValueChange={v => setForm(f => ({ ...f, anxietyLevel: v[0] }))}
                  min={0} max={10} step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Moon size={10} /> Qualidade do Sono: {form.sleepQuality}/10
                </label>
                <Slider
                  value={[form.sleepQuality]}
                  onValueChange={v => setForm(f => ({ ...f, sleepQuality: v[0] }))}
                  min={0} max={10} step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Smile size={10} /> Humor Geral: {form.moodLevel}/10
                </label>
                <Slider
                  value={[form.moodLevel]}
                  onValueChange={v => setForm(f => ({ ...f, moodLevel: v[0] }))}
                  min={0} max={10} step={1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Side Effects */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">
                <AlertTriangle size={10} className="inline mr-1" /> Efeitos Colaterais
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SIDE_EFFECTS.map(effect => (
                  <Badge
                    key={effect}
                    variant={selectedEffects.includes(effect) ? "default" : "outline"}
                    className="cursor-pointer text-xs transition-all"
                    onClick={() => toggleEffect(effect)}
                  >
                    {effect}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Observações</label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Como se sentiu hoje? Alguma observação sobre o tratamento..."
                className="bg-muted border-border text-sm min-h-[60px]"
              />
            </div>

            <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-bold">
              <Save size={16} className="mr-2" /> Salvar Registro
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        {logs.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Histórico de Registros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{log.product}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <Badge variant="outline">{log.dosageMg}mg</Badge>
                    <Badge variant="outline">CBD {log.cbdPct}%</Badge>
                    <Badge variant="outline">THC {log.thcPct}%</Badge>
                    <Badge variant="outline">Dor: {log.painLevel}/10</Badge>
                    <Badge variant="outline">Sono: {log.sleepQuality}/10</Badge>
                    <Badge variant="outline">Humor: {log.moodLevel}/10</Badge>
                  </div>
                  {log.sideEffects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {log.sideEffects.map(e => (
                        <Badge key={e} variant="secondary" className="text-[9px]">{e}</Badge>
                      ))}
                    </div>
                  )}
                  {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-6 p-3 bg-muted/30 rounded-lg">
          ⚠️ Este tracker é uma ferramenta de acompanhamento pessoal. Não substitui orientação médica.
          Compartilhe seus registros com seu médico prescritor. Conforme RDC ANVISA 660/2022 e CFM 2.314/2022.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default TreatmentTracker;
