import React, { useState, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, HeartPulse, ScanSearch, Accessibility, Stethoscope, ArrowLeft, Brain, Shield, Pill, Sparkles, Wind, FileText, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Lazy load diagnostic components
const MonitorCardiaco = lazy(() => import('@/components/MonitorCardiaco'));
const ExameFundoOlho = lazy(() => import('@/components/diagnostics/ExameFundoOlho').then(m => ({ default: m.ExameFundoOlho })));
const OximetriaOptica = lazy(() => import('@/components/diagnostics/OximetriaOptica').then(m => ({ default: m.OximetriaOptica })));
const DermatoscopiaDigital = lazy(() => import('@/components/diagnostics/DermatoscopiaDigital').then(m => ({ default: m.DermatoscopiaDigital })));
const AvaliacaoMobilidade = lazy(() => import('@/components/diagnostics/AvaliacaoMobilidade').then(m => ({ default: m.AvaliacaoMobilidade })));
const EstetoscopioDigital = lazy(() => import('@/components/diagnostics/EstetoscopioDigital').then(m => ({ default: m.EstetoscopioDigital })));
const AuscultaPulmonar = lazy(() => import('@/components/diagnostics/AuscultaPulmonar').then(m => ({ default: m.AuscultaPulmonar })));
const TremorometriaDigital = lazy(() => import('@/components/diagnostics/TremorometriaDigital').then(m => ({ default: m.TremorometriaDigital })));
const ColorimetriaUrinaria = lazy(() => import('@/components/diagnostics/ColorimetriaUrinaria').then(m => ({ default: m.ColorimetriaUrinaria })));
const AcuidadeVisual = lazy(() => import('@/components/diagnostics/AcuidadeVisual').then(m => ({ default: m.AcuidadeVisual })));
const AtividadeFisicaGPS = lazy(() => import('@/components/diagnostics/AtividadeFisicaGPS').then(m => ({ default: m.AtividadeFisicaGPS })));
import { BrisaVoiceAssistant } from '@/components/diagnostics/BrisaVoiceAssistant';

type ActiveTool = null | 'cardiaco' | 'fundoscopia' | 'oximetria' | 'dermatoscopia' | 'mobilidade' | 'estetoscopio' | 'pulmonar' | 'tremor' | 'urine' | 'acuity' | 'gps';

const tools = [
  {
    id: 'cardiaco' as ActiveTool,
    title: 'Monitor Cardíaco',
    description: 'Mede BPM e HRV via câmera do smartphone',
    icon: Activity,
    iconColor: 'text-rose-500',
    bgGlow: 'from-rose-500/10 to-rose-500/5',
    borderHover: 'hover:border-rose-300',
    tag: 'PPG Digital',
  },
  {
    id: 'fundoscopia' as ActiveTool,
    title: 'Fundo de Olho (Fundoscopia)',
    description: 'Análise de retina com IA — 31 patologias',
    icon: Eye,
    iconColor: 'text-emerald-500',
    bgGlow: 'from-emerald-500/10 to-emerald-500/5',
    borderHover: 'hover:border-emerald-300',
    tag: '🧠 IA Gemini',
  },
  {
    id: 'oximetria' as ActiveTool,
    title: 'Oximetria Óptica (SpO2)',
    description: 'Saturação de oxigênio via câmera',
    icon: HeartPulse,
    iconColor: 'text-blue-500',
    bgGlow: 'from-blue-500/10 to-blue-500/5',
    borderHover: 'hover:border-blue-300',
    tag: 'PPG SpO2',
  },
  {
    id: 'dermatoscopia' as ActiveTool,
    title: 'Dermatoscopia Digital',
    description: 'Análise de lesões de pele com IA (ABCDE)',
    icon: ScanSearch,
    iconColor: 'text-amber-500',
    bgGlow: 'from-amber-500/10 to-amber-500/5',
    borderHover: 'hover:border-amber-300',
    tag: 'Regra ABCDE',
  },
  {
    id: 'mobilidade' as ActiveTool,
    title: 'Mobilidade Articular',
    description: 'Avaliação de amplitude de movimento (ROM)',
    icon: Accessibility,
    iconColor: 'text-violet-500',
    bgGlow: 'from-violet-500/10 to-violet-500/5',
    borderHover: 'hover:border-violet-300',
    tag: 'Pose Estimation',
  },
  {
    id: 'estetoscopio' as ActiveTool,
    title: 'Estetoscópio Digital IA',
    description: 'Ausculta cardíaca e pulmonar via microfone',
    icon: Stethoscope,
    iconColor: 'text-emerald-500',
    bgGlow: 'from-emerald-500/10 to-emerald-500/5',
    borderHover: 'hover:border-emerald-300',
    tag: '🎙️ Áudio + Gemini IA',
  },
  {
    id: 'pulmonar' as ActiveTool,
    title: 'Ausculta Pulmonar IA',
    description: 'Análise de sons respiratórios via microfone',
    icon: Wind,
    iconColor: 'text-cyan-500',
    bgGlow: 'from-cyan-500/10 to-cyan-500/5',
    borderHover: 'hover:border-cyan-300',
    tag: '🌬️ Respiração + Gemini IA',
  },
  {
    id: 'tremor' as ActiveTool,
    title: 'Tremorometria IA',
    description: 'Análise de tremores neuromotores via acelerômetro',
    icon: Activity,
    iconColor: 'text-orange-500',
    bgGlow: 'from-orange-500/10 to-orange-500/5',
    borderHover: 'hover:border-orange-300',
    tag: 'Acelerômetro',
  },
  {
    id: 'urine' as ActiveTool,
    title: 'Urinálise IA',
    description: 'Leitura colorimétrica de tiras reagentes de urina',
    icon: ScanSearch,
    iconColor: 'text-yellow-500',
    bgGlow: 'from-yellow-500/10 to-yellow-500/5',
    borderHover: 'hover:border-yellow-300',
    tag: 'Colorimetria',
  },
  {
    id: 'acuity' as ActiveTool,
    title: 'Acuidade Visual',
    description: 'Teste gamificado de acuidade visual com Optotipos',
    icon: Eye,
    iconColor: 'text-teal-500',
    bgGlow: 'from-teal-500/10 to-teal-500/5',
    borderHover: 'hover:border-teal-300',
    tag: 'Optotipos',
  },
  {
    id: 'gps' as ActiveTool,
    title: 'Rastreador GPS Cardíaco',
    description: 'Monitoramento ao ar livre com satélite e calorias',
    icon: Activity,
    iconColor: 'text-indigo-500',
    bgGlow: 'from-indigo-500/10 to-indigo-500/5',
    borderHover: 'hover:border-indigo-300',
    tag: 'Satélite & Haversine',
  },
];

export default function MonitoramentoSaude() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const navigate = useNavigate();

  const renderTool = () => {
    switch (activeTool) {
      case 'cardiaco':
        return <MonitorCardiaco />;
      case 'fundoscopia':
        return <ExameFundoOlho onComplete={() => setActiveTool(null)} />;
      case 'oximetria':
        return <OximetriaOptica onComplete={() => setActiveTool(null)} />;
      case 'dermatoscopia':
        return <DermatoscopiaDigital onComplete={() => setActiveTool(null)} />;
      case 'mobilidade':
        return <AvaliacaoMobilidade onComplete={() => setActiveTool(null)} />;
      case 'estetoscopio':
        return <EstetoscopioDigital />;
      case 'pulmonar':
        return <AuscultaPulmonar />;
      case 'tremor':
        return <TremorometriaDigital />;
      case 'urine':
        return <ColorimetriaUrinaria />;
      case 'acuity':
        return <AcuidadeVisual />;
      case 'gps':
        return <AtividadeFisicaGPS />;
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Monitoramento de Saúde | Planta y Raiz — Ferramentas de Diagnóstico com IA</title>
        <meta name="description" content="Central de Monitoramento de Saúde da Planta y Raiz. 5 ferramentas de diagnóstico com IA: Monitor Cardíaco, Fundo de Olho, Oximetria SpO2, Dermatoscopia e Mobilidade Articular. Tudo pelo smartphone." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "Monitoramento de Saúde - Planta y Raiz",
          description: "Central de diagnóstico remoto com 5 ferramentas de IA",
          medicalAudience: { "@type": "MedicalAudience", audienceType: "Patient" },
        })}</script>
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-background to-slate-950">
        {/* Hero */}
        <section className="pt-24 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
                <Stethoscope className="w-3.5 h-3.5" />
                Central de Diagnóstico Remoto
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 font-display">
                Monitoramento de{' '}
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  Saúde com IA
                </span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                5 ferramentas de diagnóstico remoto alimentadas por inteligência artificial.
                Realize exames pelo seu smartphone com segurança e precisão.
              </p>
            </motion.div>

            {/* Enfª Brisa — assistente de voz, logo abaixo do texto */}
            <div className="mt-8 text-left">
              <BrisaVoiceAssistant />
            </div>
          </div>
        </section>


        {/* Tool Grid or Active Tool */}
        <section className="px-4 pb-16 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTool ? (
              <motion.div
                key="active-tool"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full"
              >
                {/* Back button */}
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5"
                    onClick={() => setActiveTool(null)}
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </Button>
                  <h2 className="text-lg font-bold text-foreground">
                    {tools.find(t => t.id === activeTool)?.title}
                  </h2>
                </div>

                {/* Tool container */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-primary/5 min-h-[500px]">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  }>
                    {renderTool()}
                  </Suspense>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tool-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                  {tools.map((tool, index) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setActiveTool(tool.id)}
                      className={`group cursor-pointer rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] ${tool.borderHover}`}
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.bgGlow} flex items-center justify-center mb-4 border border-border/50 group-hover:scale-110 transition-transform`}>
                        <tool.icon className={`w-7 h-7 ${tool.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm">{tool.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Sparkles className="w-3 h-3" /> {tool.tag}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* How it Works */}
                <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 mb-8">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-500" /> Como funciona nosso diagnóstico com IA
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-black text-primary">1</div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Captura</p>
                        <p className="text-[11px] text-muted-foreground">Seu smartphone captura dados biométricos via câmera, flash e sensores.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-black text-primary">2</div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Análise IA</p>
                        <p className="text-[11px] text-muted-foreground">O Gemini 2.5 Flash cruza seus dados com nosso banco de patologias e +40k estudos científicos.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-black text-primary">3</div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Resultado</p>
                        <p className="text-[11px] text-muted-foreground">Receba um parecer técnico com patologias detectadas, recomendações e conexão com cannabis medicinal.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-8">
                    <Button 
                      size="lg" 
                      className="bg-primary text-primary-foreground font-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all gap-2"
                      onClick={() => navigate('/relatorio-paciente')}
                    >
                      <FileText className="w-5 h-5" /> Baixar Meu Relatório Clínico (PDF)
                    </Button>
                  </div>
                </div>

                {/* Cannabis + Diagnostics Banner */}
                <div className="rounded-2xl border border-green-800/30 bg-gradient-to-r from-green-950/50 to-emerald-950/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                      <Pill className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-green-300 mb-1">🌿 Cannabis Medicinal + Diagnóstico com IA</h3>
                      <p className="text-xs text-green-200/70 leading-relaxed">
                        O sistema endocanabinoide está presente em todos os sistemas do corpo humano — incluindo olhos, coração, pele e articulações. 
                        Nossos exames cruzam seus resultados com evidências científicas sobre como CBD e THC podem auxiliar no tratamento das condições detectadas. 
                        Sempre sob supervisão médica qualificada.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-800/30">
                  <p className="text-[10px] text-amber-200/60 leading-relaxed flex items-start gap-1.5">
                    <Shield className="w-3 h-3 mt-0.5 shrink-0 text-amber-400" />
                    <span>
                      <strong>Aviso Legal:</strong> Todas as ferramentas de diagnóstico remoto da Planta y Raiz são exames de triagem digital e 
                      NÃO substituem avaliação presencial com profissional de saúde habilitado. Os resultados são indicativos e devem ser confirmados 
                      por exames clínicos complementares. Plataforma sob supervisão técnica da Dra. Suelen Naves Rodrigues (CRM-PR 49354).
                    </span>
                  </p>
                </div>
                {/* Brisa Voice Assistant Section */}
                <div className="mt-8 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Tire suas dúvidas com a Enfermeira Brisa</h2>
                      <p className="text-xs text-muted-foreground">Assistente de voz com IA — pergunte sobre seus exames ou saúde</p>
                    </div>
                  </div>
                  <BrisaVoiceAssistant />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <Footer />
    </>
  );
}
