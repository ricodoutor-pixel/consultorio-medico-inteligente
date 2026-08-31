import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  User, 
  Stethoscope, 
  Store, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Video, 
  Settings, 
  ClipboardList, 
  Wallet, 
  Sprout, 
  ShoppingBag, 
  Lock, 
  Smartphone, 
  Pill, 
  HeartPulse,
  Truck,
  Sparkles,
  Navigation,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

const ComicPanel = ({ children, className = "", color = "emerald" }: { children: React.ReactNode, className?: string, color?: "emerald" | "sky" | "purple" | "amber" }) => {
  const borderMap = {
    emerald: "border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    sky: "border-sky-500/60 shadow-[0_0_20px_rgba(56,189,248,0.15)]",
    purple: "border-purple-500/60 shadow-[0_0_20px_rgba(192,132,252,0.15)]",
    amber: "border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
  };

  return (
    <div className={`p-6 bg-slate-900/95 backdrop-blur-md border-2 ${borderMap[color]} rounded-3xl transition-all duration-300 hover:scale-[1.01] ${className}`}>
      {children}
    </div>
  );
};

const NarrationBox = ({ text, color = "amber" }: { text: string, color?: "amber" | "emerald" | "sky" | "purple" }) => {
  const colorMap = {
    amber: "bg-amber-400 text-slate-950 border-amber-300",
    emerald: "bg-emerald-500 text-slate-950 border-emerald-300",
    sky: "bg-sky-400 text-slate-950 border-sky-300",
    purple: "bg-purple-500 text-white border-purple-300"
  };

  return (
    <div className={`p-2.5 px-4 text-xs md:text-sm font-black uppercase tracking-wider mb-4 rounded-xl border-2 shadow-md inline-block ${colorMap[color]}`}>
      {text}
    </div>
  );
};

const SpeechBubble = ({ children, color = "emerald" }: { children: React.ReactNode, color?: "emerald" | "sky" | "purple" | "amber" }) => {
  const borderMap = {
    emerald: "border-emerald-500/50 text-emerald-300",
    sky: "border-sky-500/50 text-sky-300",
    purple: "border-purple-500/50 text-purple-300",
    amber: "border-amber-500/50 text-amber-300"
  };

  return (
    <div className={`relative bg-slate-800/95 border-2 ${borderMap[color]} rounded-2xl p-4 font-bold text-sm shadow-xl`}>
      {children}
    </div>
  );
};

export default function ManualPlataforma() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "farmacia";
  const [activeTab, setActiveTab] = useState(initialTab === "lojista" ? "farmacia" : initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam === "lojista" ? "farmacia" : tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-6xl mx-auto pt-28 pb-20 px-4">
        
        {/* CABEÇALHO VIBRANTE */}
        <div className="text-center mb-10">
          <div className="inline-block relative">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black text-white mb-2 tracking-tight">
              GUIA PASSO A PASSO
            </h1>
            <div className="bg-emerald-600 text-white font-black px-4 py-1.5 rounded-xl border border-emerald-400/40 shadow-lg inline-block text-xs sm:text-sm uppercase tracking-widest">
              🌿 Plataforma Oficial Planta y Raíz
            </div>
          </div>
          <p className="mt-4 text-sm sm:text-base font-bold text-emerald-400 max-w-2xl mx-auto">
            Aprenda como dominar todas as ferramentas da plataforma com alta nitidez e instruções detalhadas!
          </p>
        </div>

        {/* TABS (SELEÇÃO DE PERFIL COM CORES VIVAS) */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-10 bg-slate-900/90 border-2 border-emerald-500/40 rounded-2xl h-auto p-1.5 shadow-xl">
            <TabsTrigger 
              value="farmacia" 
              className="font-bold py-3 text-xs sm:text-sm rounded-xl text-amber-300 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 transition-all"
            >
              <Store size={18} className="mr-1.5 inline" /> FARMÁCIA
            </TabsTrigger>
            
            <TabsTrigger 
              value="paciente" 
              className="font-bold py-3 text-xs sm:text-sm rounded-xl text-emerald-300 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <User size={18} className="mr-1.5 inline" /> PACIENTE
            </TabsTrigger>
            
            <TabsTrigger 
              value="medico" 
              className="font-bold py-3 text-xs sm:text-sm rounded-xl text-sky-300 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all"
            >
              <Stethoscope size={18} className="mr-1.5 inline" /> MÉDICO
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB: FARMÁCIA / LOJISTA */}
          {/* ============================================================ */}
          <TabsContent value="farmacia" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Painel 1: Dispensário & RDC 660 */}
              <ComicPanel color="amber">
                <NarrationBox text="CAPÍTULO 1: DISPENSÁRIO & CATÁLOGO REGULAMENTADO" color="amber" />
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 bg-amber-500/20 rounded-2xl border-2 border-amber-400/50 flex items-center justify-center">
                    <Store size={28} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble color="amber">
                      "Como funciona a exibição dos medicamentos e preços na nossa farmácia?"
                    </SpeechBubble>
                  </div>
                </div>

                <div className="bg-slate-950/90 border-2 border-amber-500/50 p-4 rounded-2xl space-y-2 mt-4">
                  <h4 className="font-black text-amber-400 text-base flex items-center gap-1.5">
                    <ShieldCheck size={18} className="text-amber-400" /> REGULAMENTAÇÃO ANVISA (RDC 660 / RDC 327)
                  </h4>
                  <p className="font-bold text-white text-xs sm:text-sm leading-relaxed">
                    A Planta y Raíz opera em conformidade estrita com as normas da ANVISA. O catálogo de medicamentos fitoderivados é liberado de forma personalizada e segura assim que o paciente possui uma <strong className="text-amber-300">Prescrição Médica Válida</strong> emitida pelos médicos credenciados.
                  </p>
                </div>
              </ComicPanel>

              {/* Painel 2: Rastreamento Satélite & Entregadores */}
              <ComicPanel color="emerald">
                <NarrationBox text="CAPÍTULO 2: LOGÍSTICA & RASTREAMENTO SATÉLITE" color="emerald" />
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 bg-emerald-500/20 rounded-2xl border-2 border-emerald-400/50 flex items-center justify-center">
                    <Truck size={28} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble color="emerald">
                      "Como acompanhar e despachar o medicamento com mapa estilo Uber?"
                    </SpeechBubble>
                  </div>
                </div>

                <div className="bg-slate-950/90 border-2 border-emerald-500/50 p-4 rounded-2xl space-y-3">
                  <h4 className="font-black text-emerald-400 text-base flex items-center gap-1.5">
                    <Navigation size={18} className="text-emerald-400" /> CENTRAL DE ENTREGAS AO VIVO
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm font-bold text-white">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      Clique no botão <strong className="text-emerald-300">"🚚 Rastreio de Pedido & Entregas"</strong> ao lado do nome da sua farmácia.
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      Cadastre seus entregadores (nome, WhatsApp, furgão/moto e placa).
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                      Gere a rota automática pelo CEP do paciente com telemetria térmica (<strong className="text-sky-300">4.2°C Cadeia de Frio</strong>).
                    </li>
                  </ul>
                </div>
              </ComicPanel>

              {/* Painel 3: Faturamento & Repasse 95% */}
              <ComicPanel color="purple" className="md:col-span-2">
                <NarrationBox text="CAPÍTULO 3: FINANCEIRO, REPASSE LÍQUIDO & SAQUE PIX" color="purple" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-950/90 border-2 border-emerald-500/50 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black text-emerald-400">95%</span>
                    <p className="text-xs font-black uppercase text-white">Repasse Líquido</p>
                    <p className="text-[11px] text-emerald-200 font-bold">Faturamento direto da farmácia</p>
                  </div>

                  <div className="bg-slate-950/90 border-2 border-purple-500/50 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black text-purple-400">⚡ PIX</span>
                    <p className="text-xs font-black uppercase text-white">Saque Instantâneo</p>
                    <p className="text-[11px] text-purple-200 font-bold">Disponível em 1 clique no painel</p>
                  </div>

                  <div className="bg-slate-950/90 border-2 border-amber-500/50 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-2xl font-black text-amber-400">5%</span>
                    <p className="text-xs font-black uppercase text-white">Taxa da Plataforma</p>
                    <p className="text-[11px] text-amber-200 font-bold">Infraestrutura, IA & Compliance</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl px-6 h-11 shadow-lg shadow-emerald-950/30 text-xs sm:text-sm"
                    asChild
                  >
                    <Link to="/lojistas">
                      <Store className="mr-2" size={16} /> Acessar Meu Painel da Farmácia Agora
                    </Link>
                  </Button>
                </div>
              </ComicPanel>

            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: PACIENTE */}
          {/* ============================================================ */}
          <TabsContent value="paciente" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <ComicPanel color="emerald">
                <NarrationBox text="ETAPA 1: ESCOLHENDO SEU MÉDICO" color="emerald" />
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 bg-emerald-500/20 rounded-2xl border-2 border-emerald-400/50 flex items-center justify-center">
                    <User size={28} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble color="emerald">
                      "Como encontro o médico especialista e agendo meu atendimento?"
                    </SpeechBubble>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm font-bold text-white bg-slate-950/90 p-4 rounded-2xl border border-border/60">
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">1</span>
                    Acesse a aba <strong>Profissionais</strong> no menu principal.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">2</span>
                    Filtre os médicos por especialidade (ex: Neurologia, Dor Crônica, Psiquiatria).
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">3</span>
                    Escolha entre <strong>"Orientação Rápida (Chat)"</strong> ou <strong>"Teleconsulta (Vídeo)"</strong>.
                  </p>
                </div>
              </ComicPanel>

              <ComicPanel color="sky">
                <NarrationBox text="ETAPA 2: CONSULTÓRIO VIRTUAL & RECEITA" color="sky" />
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 bg-sky-500/20 rounded-2xl border-2 border-sky-400/50 flex items-center justify-center">
                    <Video size={28} className="text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble color="sky">
                      "Como funciona a teleconsulta e onde fica guardada minha receita?"
                    </SpeechBubble>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm font-bold text-white bg-slate-950/90 p-4 rounded-2xl border border-border/60">
                  <p>• O atendimento ocorre em sala criptografada em conformidade com o CFM.</p>
                  <p>• Sua receita digital com assinatura ICP-Brasil fica disponível no seu <strong className="text-sky-300">Prontuário Eletrônico</strong>.</p>
                  <p>• O catálogo de medicamentos da Farmácia Planta y Raíz é destravado automaticamente para sua compra.</p>
                </div>
              </ComicPanel>

              <ComicPanel color="amber" className="md:col-span-2">
                <NarrationBox text="ETAPA 3: RASTREAMENTO DO MEDICAMENTO ATÉ SUA CASA" color="amber" />
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                      <Truck size={20} className="text-amber-400" /> ACOMPANHE O ENTREGADOR AO VIVO (ESTILO UBER)
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                      Ao comprar seu medicamento, você pode clicar no botão <strong className="text-emerald-400">"🚚 Rastreio de Pedido"</strong> no seu Dashboard ou Prontuário para ver o carro em movimento contínuo no mapa, estimativa de tempo e temperatura da carga!
                    </p>
                  </div>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl px-6 h-11 text-xs sm:text-sm shadow-lg shadow-emerald-950/30"
                    asChild
                  >
                    <Link to="/dashboard-paciente">
                      <User className="mr-2" size={16} /> Acessar Meu Dashboard de Paciente
                    </Link>
                  </Button>
                </div>
              </ComicPanel>

            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: MÉDICO */}
          {/* ============================================================ */}
          <TabsContent value="medico" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <ComicPanel color="sky">
                <NarrationBox text="PARTE 1: O CONSULTÓRIO VIRTUAL" color="sky" />
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 bg-sky-500/20 rounded-2xl border-2 border-sky-400/50 flex items-center justify-center">
                    <Stethoscope size={28} className="text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble color="sky">
                      "Doutor(a), sua fila de pacientes aguarda no Consultório Virtual!"
                    </SpeechBubble>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm font-bold text-white bg-slate-950/90 p-4 rounded-2xl border border-border/60">
                  <p>1. Acesse seu <strong>Workspace Médico</strong>.</p>
                  <p>2. A IA Enfermeira Brisa faz a triagem inicial dos pacientes.</p>
                  <p>3. Clique em <strong>"Iniciar Consulta"</strong> para abrir a sala segura em alta definição.</p>
                </div>
              </ComicPanel>

              <ComicPanel color="emerald">
                <NarrationBox text="PARTE 2: PRESCRIÇÃO DIGITAL & COPILOTO" color="emerald" />
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 bg-emerald-500/20 rounded-2xl border-2 border-emerald-400/50 flex items-center justify-center">
                    <FileText size={28} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble color="emerald">
                      "Como emitir receitas digitais com assinatura CFM e calculadora de rampa?"
                    </SpeechBubble>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm font-bold text-white bg-slate-950/90 p-4 rounded-2xl border border-border/60">
                  <p>• O Copiloto sugere dosagens padronizadas e rampas de titulação.</p>
                  <p>• O sistema gera o PDF com assinatura digital e QR Code para auditoria.</p>
                  <p>• A receita é enviada instantaneamente para a Farmácia Planta y Raíz.</p>
                </div>
              </ComicPanel>

              <ComicPanel color="purple" className="md:col-span-2 text-center">
                <NarrationBox text="PARTE 3: HONORÁRIOS E REPASSE DIRETO" color="purple" />
                <p className="text-xs sm:text-sm font-bold text-white max-w-2xl mx-auto mb-4">
                  Seus honorários médicos são creditados diretamente na sua conta com split automático e total transparência financeira.
                </p>
                <Button 
                  className="bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl px-6 h-11 text-xs sm:text-sm shadow-lg shadow-sky-950/30"
                  asChild
                >
                  <Link to="/workspace-medico">
                    <Stethoscope className="mr-2" size={16} /> Acessar Meu Consultório Médico
                  </Link>
                </Button>
              </ComicPanel>

            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
