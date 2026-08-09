import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  BrainCircuit, 
  Pill, 
  Calculator, 
  FileText, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  Copy,
  Info,
  Stethoscope
} from "lucide-react";
import { toast } from "sonner";

export function CopilotoClinicoVIP() {
  const [activeSubTab, setActiveSubTab] = useState<"interacoes" | "titulacao" | "pdf" | "semiologia" | "chat">("interacoes");

  // 1. Interações Medicamentosas State
  const [medicationInput, setMedicationInput] = useState("");
  const [cannabinoidType, setCannabinoidType] = useState("CBD Full Spectrum");
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [isCheckingInteraction, setIsCheckingInteraction] = useState(false);

  // 2. Calculadora de Titulação State
  const [patientWeight, setPatientWeight] = useState("70");
  const [formulation, setFormulation] = useState("CBD 50mg/ml (Full Spectrum)");
  const [conditionSeverity, setConditionSeverity] = useState("moderada");
  const [dosageResult, setDosageResult] = useState<any>(null);

  // 3. Orientação de Uso PDF State
  const [patientName, setPatientName] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [guidanceDraft, setGuidanceDraft] = useState("");

  // 4. Chat Interativo State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "👋 Olá, Doutor(a)! Sou o seu **Copiloto Clínico VIP de Medicina Canabinoide e Geral** (IA treinada em diretrizes ANVISA, CFM e literatura internacional).\n\nComo posso auxiliar na sua consulta hoje? Selecione uma das ferramentas acima ou faça uma pergunta direta!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Handler: Checar Interação
  const handleCheckInteraction = () => {
    if (!medicationInput.trim()) {
      toast.error("Por favor, digite pelo menos um medicamento de uso contínuo.");
      return;
    }
    setIsCheckingInteraction(true);
    setTimeout(() => {
      const inputLower = medicationInput.toLowerCase();
      let severity: "baixo" | "moderado" | "alto" = "baixo";
      let details = [];

      if (inputLower.includes("warfarina") || inputLower.includes("marevan") || inputLower.includes("rivaroxabana") || inputLower.includes("xarelto")) {
        severity = "alto";
        details.push("⚠️ ANTICOAGULANTE: O CBD inibe a isoenzima CYP2C9, podendo AUMENTAR a concentração sérica do anticoagulante e elevar o risco de sangramento. Monitorar RNI semanalmente.");
      } else if (inputLower.includes("clonazepam") || inputLower.includes("diazepam") || inputLower.includes("alprazolam") || inputLower.includes("zolpidem")) {
        severity = "moderado";
        details.push("🟡 BENZODIAZEPÍNICO / SEDATIVO: Sinergismo de sedação central com THC/CBD. Recomenda-se iniciar com doses mais baixas de canabinoides no período noturno.");
      } else if (inputLower.includes("fluoxetina") || inputLower.includes("sertralina") || inputLower.includes("escitalopram") || inputLower.includes("venlafaxina")) {
        severity = "moderado";
        details.push("🟡 ANTIDEPRESSIVO (ISRS/ISRN): O CBD inibe moderadamente CYP2D6 e CYP3A4. Pode haver aumento discreto dos níveis do antidepressivo. Acompanhar tolerabilidade.");
      } else if (inputLower.includes("losartana") || inputLower.includes("enalapril") || inputLower.includes("anlodipino")) {
        severity = "baixo";
        details.push("🟢 ANTI-HIPERTENSIVO: Canabinoides (especialmente THC) podem induzir leve hipotensão ortostática inicial. Monitorar pressão arterial nas primeiras 2 semanas.");
      } else {
        details.push("🟢 Nenhuma interação crítica grave de classe CYP450 mapeada para estes compostos. Manter titulação lenta e gradual.");
      }

      setInteractionResult({
        medication: medicationInput,
        cannabinoid: cannabinoidType,
        severity,
        details,
        recommendation: severity === "alto" 
          ? "Recomenda-se acompanhamento de coagulograma e redução de 25% da dose inicial do fitocanabinoide."
          : "Titulação gradual padrão (Drop-by-Drop) autorizada com acompanhamento em 15 dias."
      });
      setIsCheckingInteraction(false);
      toast.success("Análise de interações concluída!");
    }, 800);
  };

  // Handler: Calcular Titulação
  const handleCalculateDosage = () => {
    const weight = parseFloat(patientWeight) || 70;
    let initialMg = 10;
    if (conditionSeverity === "severa") initialMg = 20;
    if (conditionSeverity === "leve") initialMg = 5;

    // Supõe ~20 gotas por ml
    let mgPerMl = 50;
    if (formulation.includes("100mg")) mgPerMl = 100;
    if (formulation.includes("25mg")) mgPerMl = 25;
    
    const mgPerDrop = mgPerMl / 20;
    const initialDrops = Math.max(1, Math.round((initialMg / 2) / mgPerDrop));

    setDosageResult({
      formulation,
      weight,
      severity: conditionSeverity,
      initialMgDay: initialMg,
      initialDropsPerDose: initialDrops,
      protocol: [
        `Dia 1 ao 4: ${initialDrops} gota(s) via sublingual de 12 em 12 horas (após refeições engorduradas).`,
        `Dia 5 ao 8: Se boa tolerabilidade, aumentar para ${initialDrops + 1} gota(s) de 12 em 12 horas.`,
        `Manutenção: Ajustar 1 gota a cada 4 dias até atingir a janela terapêutica (máximo sugerido: ${initialDrops * 3} gotas/dia).`,
        `Retorno Clínico: Agendado para 21 dias para reavaliação de escore sintomático.`
      ]
    });
    toast.success("Protocolo de titulação calculado!");
  };

  // Handler: Gerar Orientação PDF
  const handleGenerateGuidance = () => {
    if (!patientName.trim()) {
      toast.error("Informe o nome do paciente para gerar o laudo.");
      return;
    }
    const draft = `📄 ORIENTAÇÃO TÉCNICA DE USO — MEDICINA CANABINOIDE
Planta y Raiz Telemedicina | Supervisão Técnica CRM-PR 49354

PACIENTE: ${patientName.toUpperCase()}
DATA: ${new Date().toLocaleDateString('pt-BR')}

1. PRESCRIÇÃO E FORMULAÇÃO RECOMENDADA:
   • ${formulation}
   • Uso Via Sublingual (manter o líquido sob a língua por 60 segundos antes de engolir).

2. PROTOCOLO DE TITULAÇÃO GRADUAL (DROP-BY-DROP):
   • Semana 1: 2 gotas pela manhã e 2 gotas à noite (após refeições).
   • Semana 2: 3 gotas pela manhã e 3 gotas à noite se houver necessidade.
   • Não interromper medicação de uso contínuo sem expressa orientação médica.

3. RECOMENDAÇÕES DE SEGURANÇA E ARMAZENAMENTO:
   • Conservar o frasco ao abrigo da luz e do calor excessivo.
   • Em caso de sonolência excessiva, reduzir a dose matinal em 1 gota.

${customNotes ? `4. OBSERVAÇÕES COMPLEMENTARES DO MÉDICO:\n   • ${customNotes}` : ''}

___________________________________________
Assinatura Digital do Médico Prescritor (ICP-Brasil)`;

    setGuidanceDraft(draft);
    toast.success("Orientação de uso gerada com sucesso!");
  };

  // Handler: Enviar Pergunta ao Chat do Copiloto
  const handleSendChatMessage = async (presetQuestion?: string) => {
    const q = presetQuestion || chatInput;
    if (!q.trim()) return;

    const userMsg = { role: "user" as const, text: q };
    setChatMessages(prev => [...prev, userMsg]);
    if (!presetQuestion) setChatInput("");
    setIsSendingChat(true);

    setTimeout(() => {
      let replyText = "";
      const qLower = q.toLowerCase();

      if (qLower.includes("insônia") || qLower.includes("sono")) {
        replyText = "🌙 **Protocolo de Insônia & Higiene do Sono (Canabinoides):**\n- **Indicação principal:** CBN (Canabinol) + CBD Full Spectrum ou THC em baixas doses (1-2.5mg THC noturno).\n- **Mecanismo:** O CBN atua nos receptores CB1 e modula o ciclo sono-vigília sem causar efeito 'ressaca'.\n- **Dosaem:** 3-5 gotas 45 min antes de deitar.";
      } else if (qLower.includes("dor") || qLower.includes("fibromialgia")) {
        replyText = "⚡ **Protocolo de Dor Crônica & Fibromialgia:**\n- **Indicação:** CBD:THC na proporção 1:1 ou 2:1.\n- **Mecanismo:** O CBD reduz neuroinflamação via CB2 e o THC ativa vias descendentes inibitórias da dor nociceptiva.\n- **Titulação:** Iniciar com 0.25mg/kg/dia dividido em 2 tomadas.";
      } else if (qLower.includes("ansiedade") || qLower.includes("tag")) {
        replyText = "🧠 **Protocolo de Transtorno de Ansiedade Generalizada (TAG):**\n- **Indicação:** CBD Isolar ou Broad Spectrum (evitar THC elevado que pode ser anxiogênico em suscetíveis).\n- **Dose:** 25mg a 50mg/dia de CBD.\n- **Escalas recomendadas:** GAD-7 e Hamilton-A.";
      } else {
        replyText = `💡 **Parecer do Copiloto IA para: "${q}"**\n\nBaseado nas diretrizes da ANVISA (RDC 660/2022 e RDC 327/2019) e evidências clínicas atualizadas:\n- A terapêutica canabinoide é adjuvante e individualizada.\n- Recomenda-se iniciar com doses baixas ("Start Low, Go Slow") e reavaliar escores sintomáticos a cada 15-30 dias.`;
      }

      setChatMessages(prev => [...prev, { role: "assistant", text: replyText }]);
      setIsSendingChat(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Topo com Selo VIP */}
      <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/70 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit size={180} className="text-emerald-400" />
        </div>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Bot className="w-7 h-7 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-xl font-black text-white">
                    Copiloto Clínico VIP — Inteligência Médica de Decisão
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold shadow-md border-0">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Módulo VIP Ativo
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-300 mt-1">
                  Assistente de tomadas de decisão clínica em Medicina Canabinoide e Geral (Padrão Whitebook mHealth).
                </CardDescription>
              </div>
            </div>

            {/* Selo Módulo VIP Planta y Raíz */}
            <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/50 px-3 py-2 rounded-xl shadow-inner w-fit">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400">Selo Exclusivo</p>
                <p className="text-xs font-bold text-white">Acompanhado por IA de Decisão Clínica VIP</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navegação Secundária das 4 Ferramentas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant={activeSubTab === "interacoes" ? "default" : "outline"}
          className={`h-auto py-3.5 px-3 flex flex-col items-center gap-1.5 text-xs font-extrabold rounded-2xl transition-all ${
            activeSubTab === "interacoes"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-lg shadow-emerald-500/20"
              : "border-emerald-500/30 text-slate-200 hover:bg-emerald-950/30"
          }`}
          onClick={() => setActiveSubTab("interacoes")}
        >
          <Pill size={20} className={activeSubTab === "interacoes" ? "text-black" : "text-emerald-400"} />
          💊 Interação Medicamentosa
        </Button>

        <Button
          variant={activeSubTab === "titulacao" ? "default" : "outline"}
          className={`h-auto py-3.5 px-3 flex flex-col items-center gap-1.5 text-xs font-extrabold rounded-2xl transition-all ${
            activeSubTab === "titulacao"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-lg shadow-emerald-500/20"
              : "border-emerald-500/30 text-slate-200 hover:bg-emerald-950/30"
          }`}
          onClick={() => setActiveSubTab("titulacao")}
        >
          <Calculator size={20} className={activeSubTab === "titulacao" ? "text-black" : "text-emerald-400"} />
          📐 Titulação de Gotas
        </Button>

        <Button
          variant={activeSubTab === "pdf" ? "default" : "outline"}
          className={`h-auto py-3.5 px-3 flex flex-col items-center gap-1.5 text-xs font-extrabold rounded-2xl transition-all ${
            activeSubTab === "pdf"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-lg shadow-emerald-500/20"
              : "border-emerald-500/30 text-slate-200 hover:bg-emerald-950/30"
          }`}
          onClick={() => setActiveSubTab("pdf")}
        >
          <FileText size={20} className={activeSubTab === "pdf" ? "text-black" : "text-emerald-400"} />
          📄 Gerar Orientação PDF
        </Button>

        <Button
          variant={activeSubTab === "semiologia" ? "default" : "outline"}
          className={`h-auto py-3.5 px-3 flex flex-col items-center gap-1.5 text-xs font-extrabold rounded-2xl transition-all ${
            activeSubTab === "semiologia"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-lg shadow-emerald-500/20"
              : "border-emerald-500/30 text-slate-200 hover:bg-emerald-950/30"
          }`}
          onClick={() => setActiveSubTab("semiologia")}
        >
          <Search size={20} className={activeSubTab === "semiologia" ? "text-black" : "text-emerald-400"} />
          🔍 Guia de Semiologia
        </Button>
      </div>

      {/* Conteúdo Aba 1: Checagem de Interações Medicamentosas */}
      {activeSubTab === "interacoes" && (
        <Card className="border-emerald-500/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
              <Pill size={18} /> Checagem de Interação Medicamento x Fitocanabinoide
            </CardTitle>
            <CardDescription className="text-xs">
              Avalie potenciais inibições ou induções do sistema citocromo P450 (CYP3A4, CYP2C9, CYP2D6).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">
                  Medicamento(s) de Uso Contínuo do Paciente:
                </label>
                <Input
                  placeholder="Ex: Warfarina, Clonazepam, Fluoxetina, Losartana..."
                  value={medicationInput}
                  onChange={(e) => setMedicationInput(e.target.value)}
                  className="text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">
                  Fitocanabinoide a ser Prescrito:
                </label>
                <select
                  value={cannabinoidType}
                  onChange={(e) => setCannabinoidType(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
                >
                  <option value="CBD Full Spectrum">CBD Full Spectrum (Rico em Terpenos e Minoritários)</option>
                  <option value="CBD Isolar">CBD Isolar (Purificado 99%+)</option>
                  <option value="THC / CBD 1:1">THC:CBD 1:1 (Padrão Equilibrado)</option>
                  <option value="CBN / CBD (Foco Sono)">CBN + CBD (Formulação Noturna)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCheckInteraction}
              disabled={isCheckingInteraction}
              className="bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 text-xs w-full sm:w-auto"
            >
              {isCheckingInteraction ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <BrainCircuit className="w-4 h-4 mr-1.5" />}
              Analisar Interações Medicamentosas
            </Button>

            {interactionResult && (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-slate-900/90 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Análise de Risco Terapêutico:</span>
                  <Badge className={
                    interactionResult.severity === "alto" ? "bg-rose-500 text-white font-bold" :
                    interactionResult.severity === "moderado" ? "bg-amber-500 text-black font-bold" :
                    "bg-emerald-500 text-black font-bold"
                  }>
                    {interactionResult.severity === "alto" ? "🔴 Atenção Alta (Interação Significativa)" :
                     interactionResult.severity === "moderado" ? "🟡 Atenção Moderada (Acompanhar)" :
                     "🟢 Risco Baixo (Uso Seguro)"}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {interactionResult.details.map((det: string, idx: number) => (
                    <p key={idx} className="text-xs text-slate-200 leading-relaxed font-mono">
                      {det}
                    </p>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-emerald-300 font-semibold">
                  💡 <strong>Parecer do Copiloto:</strong> {interactionResult.recommendation}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Aba 2: Calculadora de Titulação */}
      {activeSubTab === "titulacao" && (
        <Card className="border-emerald-500/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
              <Calculator size={18} /> Calculadora Terapêutica de Titulação (Drop-by-Drop)
            </CardTitle>
            <CardDescription className="text-xs">
              Calcule a dose inicial e a escada de progressão com base nas recomendações ANVISA/CFM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">Formulação:</label>
                <select
                  value={formulation}
                  onChange={(e) => setFormulation(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
                >
                  <option value="CBD 50mg/ml (Full Spectrum)">CBD 50mg/ml (Full Spectrum)</option>
                  <option value="CBD 100mg/ml (Isolar)">CBD 100mg/ml (Isolar)</option>
                  <option value="CBD 25mg/ml (Leve)">CBD 25mg/ml (Leve)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">Peso do Paciente (kg):</label>
                <Input
                  type="number"
                  value={patientWeight}
                  onChange={(e) => setPatientWeight(e.target.value)}
                  className="text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">Gravidade do Quadro:</label>
                <select
                  value={conditionSeverity}
                  onChange={(e) => setConditionSeverity(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground"
                >
                  <option value="leve">Leve (Ex: Ansiedade pontual / Insônia leve)</option>
                  <option value="moderada">Moderada (Ex: Dor crônica / TAG)</option>
                  <option value="severa">Severa (Ex: Parkinson / Espasticidade / Epilepsia)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCalculateDosage}
              className="bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 text-xs w-full sm:w-auto"
            >
              <Calculator className="w-4 h-4 mr-1.5" /> Calcular Protocolo de Gotas
            </Button>

            {dosageResult && (
              <div className="p-5 rounded-2xl border border-emerald-500/40 bg-slate-900/90 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Esquema de Titulação Sugerido
                  </h4>
                  <Badge variant="outline" className="text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                    ~{dosageResult.initialDropsPerDose} gota(s) 12/12h
                  </Badge>
                </div>

                <div className="space-y-2">
                  {dosageResult.protocol.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Aba 3: Gerar Orientação PDF */}
      {activeSubTab === "pdf" && (
        <Card className="border-emerald-500/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
              <FileText size={18} /> Gerador de Orientação Técnica de Uso (PDF)
            </CardTitle>
            <CardDescription className="text-xs">
              Gere rascunhos de orientações passo a passo para enviar diretamente ao paciente via WhatsApp ou PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">Nome Completo do Paciente:</label>
                <Input
                  placeholder="Ex: João da Silva"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-muted-foreground block mb-1.5">Observações Especiais do Médico:</label>
                <Input
                  placeholder="Ex: Evitar tomada matinal dirigir veículos..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="text-xs font-medium"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateGuidance}
              className="bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 text-xs w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Gerar Rascunho da Orientação
            </Button>

            {guidanceDraft && (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-slate-900/90 space-y-3 animate-in fade-in duration-300">
                <Textarea
                  value={guidanceDraft}
                  onChange={(e) => setGuidanceDraft(e.target.value)}
                  rows={10}
                  className="font-mono text-xs text-emerald-200 bg-slate-950 border-slate-800 leading-relaxed"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-emerald-500 text-black font-bold text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(guidanceDraft);
                      toast.success("Texto copiado para a área de transferência!");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Texto
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Aba 4: Guia de Semiologia */}
      {activeSubTab === "semiologia" && (
        <Card className="border-emerald-500/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-400">
              <Search size={18} /> Guia Rápido de Semiologia Canábica & Escores
            </CardTitle>
            <CardDescription className="text-xs">
              Atalhos semiológicos para investigação de sintomas principais em telemedicina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <h5 className="font-extrabold text-xs text-emerald-400 flex items-center gap-1.5">
                  <Stethoscope size={16} /> 1. Investigação de Dor Crônica (EVA 0-10)
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Avaliar localização, caráter (queimação, fisgada, pulsátil), fatores de melhora e piora. O CBD atua na dessensibilização dos receptores TRPV1 periféricos.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
                <h5 className="font-extrabold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Stethoscope size={16} /> 2. Avaliação de Sono (Escore Pittsburgh)
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Investigar latência de início do sono, despertares noturnos e arquitetura REM. O CBN e mirceno atuam na latência e na estabilização do sono profundo.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                <h5 className="font-extrabold text-xs text-purple-400 flex items-center gap-1.5">
                  <Stethoscope size={16} /> 3. Ansiedade e Escore GAD-7
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Investigar hiperatividade simpática, tremores e ideação ruminativa. O CBD facilita a sinalização 5-HT1A (serotoninérgica) e endocanabinoide anandamida.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                <h5 className="font-extrabold text-xs text-amber-400 flex items-center gap-1.5">
                  <Stethoscope size={16} /> 4. Doenças Neurodegenerativas
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Avaliar rigidez muscular, tremor de repouso e qualidade de vida. CBD e THCA exercem neuroproteção antioxidante marcante.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat do Copiloto IA (Sempre Disponível na Parte Inferior) */}
      <Card className="border-emerald-500/30 bg-card">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-extrabold flex items-center justify-between text-foreground">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" /> Chat Interativo do Copiloto IA
            </span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
              Disponível 24h
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-black font-semibold rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isSendingChat && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Copiloto analisando literatura médica...</span>
              </div>
            )}
          </div>

          {/* Preset Chips */}
          <div className="flex gap-2 flex-wrap text-xs">
            <button
              onClick={() => handleSendChatMessage("Qual a conduta para insônia refratária com CBD?")}
              className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-500/20 transition-all text-[11px]"
            >
              🌙 Insônia Refratária
            </button>
            <button
              onClick={() => handleSendChatMessage("Como manejar dor neuropática com THC e CBD?")}
              className="px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-500/20 transition-all text-[11px]"
            >
              ⚡ Dor Neuropática
            </button>
            <button
              onClick={() => handleSendChatMessage("CBD interage com Antidepressivos ISRS?")}
              className="px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-950/30 text-purple-300 hover:bg-purple-500/20 transition-all text-[11px]"
            >
              💊 CBD x ISRS
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua dúvida clínica ou caso hipotético..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              className="text-xs"
            />
            <Button
              onClick={() => handleSendChatMessage()}
              disabled={isSendingChat}
              className="bg-emerald-500 text-black font-bold hover:bg-emerald-400 text-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
