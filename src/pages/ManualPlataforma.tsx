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
  FileText,
  Power,
  Bell,
  Upload,
  BadgeCheck,
  CalendarClock,
  Banknote,
  Star,
  Link2,
  PenTool,
  AlertTriangle,
  MessageCircle,
  UserPlus,
  Users,
  TrendingUp,
  Crown,
  DollarSign,
  Layers,
  Network,
  Copy,
  Percent,
  Flame,
  Zap,
  Share2,
  CheckCircle2,
  type LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadPermanentReferralCode } from "@/lib/referral-code";

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

type DoctorStep = {
  icon: LucideIcon;
  title: string;
  items: string[];
  note?: string;
  link?: { to: string; label: string };
  highlight?: boolean;
};

/** Jornada real do médico, conferida no código (cadastro → aprovação → ON → consulta → repasse → saque). */
const DOCTOR_STEPS: DoctorStep[] = [
  {
    icon: UserPlus,
    title: "Faça seu cadastro",
    items: [
      "Preencha seus dados, o CRM com a UF e o WhatsApp. É por esse número que os pacientes chegam até você.",
      "Crie uma senha. Seu login é o e-mail informado.",
    ],
    link: { to: "/cadastro-profissional", label: "Cadastrar agora" },
  },
  {
    icon: Upload,
    title: "Anexe os documentos",
    items: [
      "Obrigatórios: CRM (frente e verso), RG ou CNH (frente), documento do CPF e comprovante de endereço.",
      "Recomendados: foto de perfil, print da consulta do CRM no site do Conselho e a imagem da sua assinatura. A imagem da assinatura aparece no PDF das receitas.",
      "Faltou algum documento? Envie depois em Consultório → Perfil e KYC, ou pela página de atualização de documentos.",
    ],
    note: "Sem os documentos obrigatórios, seu card não é liberado na vitrine de profissionais.",
    link: { to: "/atualizar-documentos-medico", label: "Enviar ou atualizar documentos" },
  },
  {
    icon: BadgeCheck,
    title: "Aguarde a aprovação da equipe",
    items: [
      "A equipe confere CRM e documentos manualmente. Depois disso, seu card aparece na vitrine de profissionais.",
      "Você recebe o aviso da aprovação pela plataforma.",
    ],
    note: "Assinar um plano não aprova o cadastro. A aprovação depende só do CRM e dos documentos.",
  },
  {
    icon: ShieldCheck,
    title: "Assine o contrato no painel",
    items: [
      "No seu painel médico, clique em \"ASSINAR CONTRATO CFM\". Depois de assinado, o botão fica verde.",
    ],
    link: { to: "/dashboard-medico", label: "Ir para o painel médico" },
  },
  {
    icon: CalendarClock,
    title: "Complete o perfil e publique seus horários",
    items: [
      "Coloque foto, especialidade e uma apresentação curta. É o que o paciente lê antes de escolher você.",
      "Em Consultório → \"Horários & Consulta por Vídeo\", publique sua agenda. O paciente só consegue agendar nos horários que você publicar.",
      "Seus valores são tabelados: consulta por chat R$ 100, consulta por vídeo R$ 150 e retorno R$ 90. Você escolhe apenas o valor da Consulta Premium (vídeo + chat), a partir de R$ 100.",
      "A Orientação Técnica de R$ 30 é atendida somente pela Enfª Brisa. Ela não aparece no seu cartão e você não realiza nem recebe por essa modalidade.",
    ],
    link: { to: "/consultorio", label: "Abrir Consultório" },
  },
  {
    icon: Power,
    title: "Ligue o botão ON e deixe o Consultório aberto",
    highlight: true,
    items: [
      "Entre no Consultório e ligue o botão ON. O status muda para \"ONLINE (Atendendo)\".",
      "Mantenha a página aberta, no computador ou no celular. A cada 30 segundos ela avisa o sistema de que você está presente.",
      "Na vitrine, o verde quer dizer que você está disponível e o amarelo, que você está em consulta.",
      "Fechou a página ou perdeu a internet? Em até 2 minutos você aparece offline e as consultas vão para outro médico.",
    ],
    note: "Só ligar o ON e sair não funciona. Para receber pacientes de hora em hora, o Consultório precisa ficar aberto.",
    link: { to: "/consultorio", label: "Ligar o ON agora" },
  },
  {
    icon: Bell,
    title: "Receba e aceite o paciente",
    items: [
      "O paciente paga antes (Pix ou cartão) e responde à triagem. Casos com sinal de alarme são encaminhados ao pronto-socorro e não chegam à consulta.",
      "Você recebe WhatsApp e e-mail avisando que há uma consulta. Esse aviso não traz dados de saúde do paciente.",
      "Você tem 5 minutos para aceitar. Depois disso, a consulta vai para o próximo médico, nesta ordem: o médico escolhido pelo paciente, depois os assinantes de planos, depois os médicos online.",
    ],
  },
  {
    icon: MessageCircle,
    title: "Atenda por chat ou vídeo",
    items: [
      "Ao abrir a consulta, a sala é liberada para o paciente: chat em tempo real, vídeo dentro da própria página e anexos de exames e fotos (imagem ou PDF, até 10 MB).",
      "Use o Copiloto e o Escriba do seu plano. O Escriba só grava a consulta inteira se você confirmar o consentimento do paciente.",
      "Ao terminar, clique em encerrar. O paciente segue para a avaliação.",
    ],
  },
  {
    icon: PenTool,
    title: "Emita receita, atestado ou pedido de exames",
    items: [
      "No Workspace, clique em \"Emitir & Assinar\". A plataforma gera o PDF timbrado.",
      "Assine o PDF no gov.br (assinador.iti.br) e envie o arquivo assinado. O sistema só aceita PDF com assinatura digital.",
      "O paciente baixa o documento na página da consulta e recebe um aviso por WhatsApp.",
    ],
    note: "Receita de controle especial exige certificado ICP-Brasil qualificado (A1, A3 ou em nuvem, como VIDaaS ou BirdID). A assinatura gov.br não serve para esse tipo de receita.",
  },
  {
    icon: Star,
    title: "A avaliação do paciente libera o seu repasse",
    items: [
      "Quando o paciente avalia a consulta, 93% do valor vai para o seu saldo. Os outros 7% são a taxa da plataforma, igual em todos os planos.",
      "Você recebe o aviso \"pagamento disponível\" no painel e no WhatsApp.",
    ],
  },
  {
    icon: Banknote,
    title: "Saque por Pix: seu primeiro pagamento",
    items: [
      "No Consultório, abra a área financeira e clique em sacar. Informe sua chave Pix (telefone com +55).",
      "Saque mínimo: R$ 50. Há uma taxa de manutenção de 5% sobre o valor sacado.",
      "Você acompanha o status do saque (em processamento ou enviado) no painel. Se o Mercado Pago recusar, o valor volta para o seu saldo.",
    ],
    link: { to: "/consultorio", label: "Ver meu saldo" },
  },
  {
    icon: Network,
    title: "Traga seus pacientes e colegas — Renda Mensal Vitalícia em 3 Gerações",
    highlight: true,
    items: [
      "No Consultório ou no topo do Dashboard Médico, acesse seus 4 Links Personalizados exclusivos vinculados ao seu CRM e ao seu código permanente no servidor (ensure_referral_code).",
      "Link de Pacientes (Vídeo ou Chat): o paciente entra direto com você para consulta ou renovação de receita, sem passar pela fila geral da plataforma.",
      "Link de Colegas Médicos: cadastra novos médicos que viram sua 1ª Geração no programa Médico Sócio.",
      "Renda Mensal Vitalícia até a 3ª Geração: toda vez que seus colegas atendem, assinam planos ou prescrevem medicamentos na Farmácia Integrada (2ª e 3ª geração), você recebe comissões perpétuas em cascata caindo no Pix.",
      "Plano Meta R$ 15.000/mês (3 colegas que indicam 3): com apenas 3 médicos que trazem 3 até a 3ª geração (39 médicos na rede), você atinge a meta de R$ 15.000,00/mês de salário vitalício no Pix somando planos, consultas e farmácia!",
    ],
    note: "Cada indicação fica gravada perpetuamente ao seu código no banco de dados. Nunca expira!",
    link: { to: "/indicacoes", label: "Abrir Painel de Indicações & Simulador" },
  },
];

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

  // Simulador de Indicações em 3 Gerações (Médico Sócio)
  const [docDirects, setDocDirects] = useState(3);
  const [docPerColleague, setDocPerColleague] = useState(3);

  // Simulador de Indicações para Pacientes
  const [patientDirects, setPatientDirects] = useState(5);
  const [patientPerFriend, setPatientPerFriend] = useState(3);

  // Código permanente do usuário logado
  const [userCode, setUserCode] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const code = await loadPermanentReferralCode(session.user.id).catch(() => null);
          if (code) setUserCode(code);
        }
      } catch {}
    })();
  }, []);

  const copyText = (text: string, label: string) => {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado com sucesso!`),
      () => toast.error("Não foi possível copiar o link."),
    );
  };

  const shareWhatsApp = (text: string, url: string) => {
    const full = `${text}\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(full)}`, "_blank");
  };

  // Cálculos do simulador médico (Meta R$ 15.000/mês com 3 que indicam 3)
  const gen1Docs = docDirects;
  const gen2Docs = gen1Docs * docPerColleague;
  const gen3Docs = gen2Docs * docPerColleague;
  const totalNetworkDocs = gen1Docs + gen2Docs + gen3Docs;

  // Pilar 1: Comissões mensais sobre assinaturas de planos médicos:
  // G1: R$ 100/mês | G2: R$ 50/mês | G3: R$ 30/mês (3x3x3 = R$ 1.560/mês)
  const planEarnings = (gen1Docs * 100) + (gen2Docs * 50) + (gen3Docs * 30);

  // Pilar 2: Volume de consultas & teleatendimentos da rede (~25 atendimentos/mês por médico ativo):
  // G1: R$ 300/mês (25 x R$ 12) | G2: R$ 200/mês (25 x R$ 8) | G3: ~R$ 131,11/mês (25 x R$ 5,24)
  // 3x3x3 = R$ 6.240/mês
  const consultationEarnings = (gen1Docs * 300) + (gen2Docs * 200) + Math.round(gen3Docs * (3540 / 27));

  // Pilar 3: Farmácia Canabinoide Integrada Planta y Raíz (~15 prescrições/mês por médico ativo):
  // G1: R$ 375/mês (15 x R$ 25) | G2: R$ 225/mês (15 x R$ 15) | G3: R$ 150/mês (15 x R$ 10)
  // 3x3x3 = R$ 7.200/mês
  const pharmacyEarnings = (gen1Docs * 375) + (gen2Docs * 225) + (gen3Docs * 150);

  // Salário Mensal Consolidado no Pix (R$ 1.560 + R$ 6.240 + R$ 7.200 = R$ 15.000/mês com 3 que indicam 3!)
  const totalDocMonthlySalary = planEarnings + consultationEarnings + pharmacyEarnings;

  // Cálculos do simulador paciente
  const gen1Patients = patientDirects;
  const gen2Patients = gen1Patients * patientPerFriend;
  const gen3Patients = gen2Patients * patientPerFriend;
  const totalNetworkPatients = gen1Patients + gen2Patients + gen3Patients;
  // Assinatura média de R$ 50/mês: G1 (50% = R$ 25), G2 (5% = R$ 2.5), G3 (2% = R$ 1)
  const patientEarnings = (gen1Patients * 25) + (gen2Patients * 2.5) + (gen3Patients * 1);

  const colleagueShareLink = userCode 
    ? `${typeof window !== "undefined" ? window.location.origin : "https://plantayraiz.com.br"}/cadastro-profissional?ref=${encodeURIComponent(userCode)}`
    : `${typeof window !== "undefined" ? window.location.origin : "https://plantayraiz.com.br"}/cadastro-profissional`;

  const patientShareLink = userCode
    ? `${typeof window !== "undefined" ? window.location.origin : "https://plantayraiz.com.br"}/cadastro?ref=${encodeURIComponent(userCode)}`
    : `${typeof window !== "undefined" ? window.location.origin : "https://plantayraiz.com.br"}/cadastro`;

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

              {/* ETAPA 4: INDIQUE AMIGOS & FAMILIARES - RENDA MENSAL VITALÍCIA VIA PIX */}
              <ComicPanel color="purple" className="md:col-span-2 ring-2 ring-purple-400/60 bg-purple-950/20">
                <NarrationBox text="ETAPA 4: INDIQUE AMIGOS & FAMILIARES — RENDA MENSAL VITALÍCIA VIA PIX" color="purple" />
                
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Flame className="text-purple-400" size={24} />
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        Ganhe Comissões Recorrentes Todo Mês Indicando Saúde!
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed">
                      Compartilhe seu link exclusivo com amigos, familiares e contatos. Toda vez que alguém se cadastra pelo seu link e assina um plano ou realiza atendimentos na plataforma, você recebe comissões perpétuas caindo direto no seu Pix em até 3 gerações:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-950/90 border-2 border-purple-500/50 p-3.5 rounded-2xl">
                        <span className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                          <Crown size={14} className="text-amber-400" /> 1ª Geração (Diretos)
                        </span>
                        <p className="text-2xl font-black text-white mt-1">50%</p>
                        <p className="text-[11px] font-bold text-purple-200">De comissão mensal recorrente</p>
                      </div>

                      <div className="bg-slate-950/90 border-2 border-sky-500/50 p-3.5 rounded-2xl">
                        <span className="text-xs font-black uppercase text-sky-300 flex items-center gap-1.5">
                          <Layers size={14} className="text-sky-400" /> 2ª Geração (Indiretos)
                        </span>
                        <p className="text-2xl font-black text-white mt-1">5%</p>
                        <p className="text-[11px] font-bold text-sky-200">Dos amigos dos seus amigos</p>
                      </div>

                      <div className="bg-slate-950/90 border-2 border-emerald-500/50 p-3.5 rounded-2xl">
                        <span className="text-xs font-black uppercase text-emerald-300 flex items-center gap-1.5">
                          <Network size={14} className="text-emerald-400" /> 3ª Geração (Rede)
                        </span>
                        <p className="text-2xl font-black text-white mt-1">2%</p>
                        <p className="text-[11px] font-bold text-emerald-200">Expansão viral perpétua</p>
                      </div>
                    </div>

                    {/* Simulador Interativo Paciente */}
                    <div className="bg-slate-950/90 border-2 border-purple-500/60 p-4 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-purple-300 text-sm flex items-center gap-1.5">
                          <TrendingUp size={16} /> SIMULADOR DE RENDA PASSIVA PARA USUÁRIOS
                        </h4>
                        <span className="text-xs font-extrabold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                          3 Gerações Ativas
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-300">
                            <span>Amigos indicados diretamente (G1):</span>
                            <span className="text-purple-400 font-black text-sm">{patientDirects} amigos</span>
                          </div>
                          <Slider 
                            value={[patientDirects]} 
                            min={1} 
                            max={20} 
                            step={1} 
                            onValueChange={(val) => setPatientDirects(val[0])}
                            className="py-2" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-300">
                            <span>Quantos cada amigo indica (G2 e G3):</span>
                            <span className="text-sky-400 font-black text-sm">{patientPerFriend} amigos</span>
                          </div>
                          <Slider 
                            value={[patientPerFriend]} 
                            min={1} 
                            max={10} 
                            step={1} 
                            onValueChange={(val) => setPatientPerFriend(val[0])}
                            className="py-2" 
                          />
                        </div>
                      </div>

                      <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-xs font-bold text-slate-300 text-center sm:text-left">
                          <p>Rede total: <strong className="text-white">{totalNetworkPatients} usuários</strong> ({gen1Patients} na G1 + {gen2Patients} na G2 + {gen3Patients} na G3)</p>
                          <p className="text-[11px] text-purple-200">Comissões mensais creditadas no seu saldo e sacáveis via Pix</p>
                        </div>
                        <div className="text-center sm:text-right shrink-0">
                          <span className="text-[11px] font-black uppercase text-purple-300 block">Sua Renda Mensal Vitalícia</span>
                          <span className="text-2xl font-black text-emerald-400">
                            R$ {patientEarnings.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <Button 
                        size="sm"
                        onClick={() => copyText(patientShareLink, "Seu Link de Paciente")}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs"
                      >
                        <Copy size={14} className="mr-1.5" /> Copiar Meu Link de Indicação
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => shareWhatsApp(
                          "Olha que incrível a Planta y Raíz! Criei minha conta para cuidar da minha saúde e renovar receitas direto com médicos especialistas. Cadastre-se pelo meu link:",
                          patientShareLink
                        )}
                        className="border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10 font-black rounded-xl text-xs"
                      >
                        <Share2 size={14} className="mr-1.5" /> Enviar no WhatsApp
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        asChild
                        className="text-purple-300 hover:text-white font-black text-xs"
                      >
                        <Link to="/indicacoes">
                          <Network size={14} className="mr-1.5" /> Ver Painel Completo de Indicações
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </ComicPanel>

            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: MÉDICO */}
          {/* ============================================================ */}
          <TabsContent value="medico" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AVISO PRINCIPAL: BOTÃO ON */}
            <div className="rounded-3xl border-2 border-emerald-400 bg-emerald-500/10 p-5 sm:p-6 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-emerald-500 flex items-center justify-center">
                  <Power size={34} className="text-slate-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                    Sem o botão ON ligado, nenhum paciente chega até você.
                  </h2>
                  <p className="text-sm font-bold text-emerald-200 mt-1 leading-relaxed">
                    O sistema só oferece consultas a quem está com o <strong className="text-white">Consultório aberto e o botão ON ligado</strong>. Ligar o ON e fechar a página não basta: com a página fechada, você fica offline em até 2 minutos.
                  </p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl h-11 px-5 shrink-0" asChild>
                  <Link to="/consultorio"><Power className="mr-2" size={16} /> Abrir meu Consultório</Link>
                </Button>
              </div>
            </div>

            <p className="text-center text-sm font-bold text-sky-300">
              Do cadastro ao primeiro pagamento: siga as etapas na ordem.
            </p>

            <div className="space-y-4">
              {DOCTOR_STEPS.map((step, i) => (
                <ComicPanel key={step.title} color={step.highlight ? "emerald" : "sky"} className={step.highlight ? "ring-2 ring-emerald-400" : ""}>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-base ${step.highlight ? "bg-emerald-400 text-slate-950" : "bg-sky-500 text-slate-950"}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <step.icon size={20} className={step.highlight ? "text-emerald-400 shrink-0" : "text-sky-400 shrink-0"} />
                        {step.title}
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm font-bold text-slate-200">
                        {step.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <ArrowRight className={step.highlight ? "text-emerald-400 shrink-0 mt-0.5" : "text-sky-400 shrink-0 mt-0.5"} size={15} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {step.note && (
                        <p className="text-xs font-bold text-amber-200 bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2">
                          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" /> {step.note}
                        </p>
                      )}
                      {step.link && (
                        <Button size="sm" variant="outline" className="rounded-xl font-black border-sky-500/50 text-sky-300 hover:bg-sky-500/10" asChild>
                          <Link to={step.link.to}>{step.link.label} <ArrowRight className="ml-1.5" size={14} /></Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </ComicPanel>
              ))}
            </div>

            {/* ============================================================ */}
            {/* CAPÍTULO ESPECIAL: PROGRAMA MÉDICO SÓCIO — RENDA VITALÍCIA */}
            {/* ============================================================ */}
            <ComicPanel color="emerald" className="ring-2 ring-emerald-400 border-2 border-emerald-400 bg-emerald-950/20">
              <NarrationBox text="CAPÍTULO ESPECIAL: PROGRAMA MÉDICO SÓCIO — RENDA MENSAL VITALÍCIA EM 3 GERAÇÕES" color="emerald" />

              <div className="space-y-6">
                {/* HERO DO PROGRAMA */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-950/90 border-2 border-emerald-500/50 p-5 rounded-2xl shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                    <Crown size={36} className="text-slate-950" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase px-3 py-0.5 rounded-full border border-emerald-500/40 mb-1.5">
                      <Zap size={13} /> O Motor de Crescimento da Plataforma — Faça a Roda Girar!
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      Crie um Salário Robusto e Vitalício no seu Pix Compartilhando seu Link
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-emerald-200 mt-1 leading-relaxed">
                      Você não precisa viver apenas do tempo gasto atendendo consultas: no programa <strong className="text-white">Médico Sócio</strong>, cada colega médico e paciente que você indica fica registrado permanentemente ao seu CRM no servidor. Você recebe comissões perpétuas em cascata até a <strong className="text-emerald-400">3ª Geração</strong> toda vez que eles assinam planos, atendem ou renovam receitas!
                    </p>
                  </div>
                </div>

                {/* AS 3 GERAÇÕES EXPLICADAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/95 border-2 border-emerald-400 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Crown size={15} /> 1ª Geração
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40">
                          DIRETO
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">Médicos Indicados por Você</h4>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        Colegas que criam a conta pelo seu link exclusivo.
                      </p>
                      <div className="pt-2 space-y-1.5 text-xs font-black">
                        <p className="text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          <span>R$ 50,00/mês por plano ativo</span>
                        </p>
                        <p className="text-teal-300 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                          <span>+ comissão sobre consultas realizadas</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-3 pt-3 border-t border-slate-800">
                      Vínculo definitivo com trava no banco de dados.
                    </p>
                  </div>

                  <div className="bg-slate-950/95 border-2 border-sky-400 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={15} /> 2ª Geração
                        </span>
                        <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-sky-400/40">
                          INDIRETO
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">Indicados dos Seus Colegas</h4>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        Médicos trazidos pelos colegas da sua 1ª geração.
                      </p>
                      <div className="pt-2 space-y-1.5 text-xs font-black">
                        <p className="text-sky-300 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
                          <span>R$ 15,00/mês por plano ativo</span>
                        </p>
                        <p className="text-sky-200 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-sky-300 shrink-0" />
                          <span>+ comissão perpétua sobre atendimentos</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-3 pt-3 border-t border-slate-800">
                      Você ganha sem precisar conhecer o novo médico.
                    </p>
                  </div>

                  <div className="bg-slate-950/95 border-2 border-purple-400 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Network size={15} /> 3ª Geração
                        </span>
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400/40">
                          EXPANSÃO VIRAL
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">Rede Expandida da 2ª Geração</h4>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        A multiplicação geométrica da rede médica pelo Brasil.
                      </p>
                      <div className="pt-2 space-y-1.5 text-xs font-black">
                        <p className="text-purple-300 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                          <span>R$ 10,00/mês por plano ativo</span>
                        </p>
                        <p className="text-purple-200 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-purple-300 shrink-0" />
                          <span>+ comissão perpétua sobre atendimentos</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-3 pt-3 border-t border-slate-800">
                      Efeito bola de neve: faturamento passivo 24h por dia.
                    </p>
                  </div>
                </div>

                {/* PLANO META: COMO CHEGAR A R$ 15.000/MÊS COM A FÓRMULA DOS 3 QUE INDICAM 3 */}
                <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 p-5 sm:p-6 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="text-amber-400 shrink-0" size={26} />
                      <div>
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-400/40">
                          🎯 Meta Salarial Oficial do Médico Sócio
                        </span>
                        <h4 className="text-lg sm:text-2xl font-black text-amber-300 mt-0.5">
                          Como Fazer R$ 15.000,00 de Salário/Mês Indicando 3 Colegas que Indicam 3
                        </h4>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setDocDirects(3);
                        setDocPerColleague(3);
                        toast.success("Simulador ajustado para a Meta de R$ 15.000/mês!");
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shrink-0 shadow-lg shadow-amber-500/20"
                    >
                      <Sparkles size={14} className="mr-1.5" /> Aplicar Meta no Simulador
                    </Button>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed mb-4">
                    Veja a matemática exata, transparente e sustentável de como a multiplicação geométrica de apenas <strong className="text-white">3 indicações diretas</strong> gera um salário vitalício de <strong className="text-emerald-400">R$ 15.000,00 por mês no seu Pix</strong>:
                  </p>

                  {/* CARDS DA DUPLICAÇÃO 3x3x3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center mb-5">
                    <div className="bg-slate-950 border-2 border-emerald-500/50 p-3.5 rounded-xl">
                      <p className="text-[11px] font-black text-emerald-400 uppercase">1ª Geração</p>
                      <p className="text-2xl font-black text-white mt-0.5">3 Médicos</p>
                      <p className="text-[11px] font-bold text-slate-300">Convidado direto por você</p>
                      <p className="text-xs font-black text-emerald-300 mt-1">R$ 2.325,00/mês</p>
                    </div>

                    <div className="bg-slate-950 border-2 border-sky-500/50 p-3.5 rounded-xl">
                      <p className="text-[11px] font-black text-sky-400 uppercase">2ª Geração (3 × 3)</p>
                      <p className="text-2xl font-black text-white mt-0.5">9 Médicos</p>
                      <p className="text-[11px] font-bold text-slate-300">Seus 3 indicaram 3 colegas</p>
                      <p className="text-xs font-black text-sky-300 mt-1">R$ 4.275,00/mês</p>
                    </div>

                    <div className="bg-slate-950 border-2 border-purple-500/50 p-3.5 rounded-xl">
                      <p className="text-[11px] font-black text-purple-400 uppercase">3ª Geração (9 × 3)</p>
                      <p className="text-2xl font-black text-white mt-0.5">27 Médicos</p>
                      <p className="text-[11px] font-bold text-slate-300">Os 9 indicaram 3 colegas</p>
                      <p className="text-xs font-black text-purple-300 mt-1">R$ 8.400,00/mês</p>
                    </div>

                    <div className="bg-emerald-950/80 border-2 border-emerald-400 p-3.5 rounded-xl flex flex-col justify-center">
                      <p className="text-[11px] font-black text-emerald-300 uppercase">Rede Consolidada</p>
                      <p className="text-2xl font-black text-emerald-300 mt-0.5">39 Médicos</p>
                      <p className="text-[11px] font-bold text-emerald-200">Ativos & Atendendo</p>
                      <p className="text-xs font-black text-emerald-400 mt-1">100% vitalício no Pix</p>
                    </div>
                  </div>

                  {/* OS 3 PILARES QUE SOMAM 15 MIL */}
                  <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-black text-amber-300 uppercase tracking-wide">
                      De onde vem os R$ 15.000,00 mensais? (A Força do Ecossistema Planta y Raíz):
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-900/90 border border-emerald-500/30 p-3 rounded-lg">
                        <span className="text-[11px] font-black text-emerald-300 uppercase block">1. Assinaturas de Planos Médicos</span>
                        <span className="text-lg font-black text-white">R$ 1.560,00 / mês</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          Comissões recorrentes: R$ 100 na G1 (3×100) + R$ 50 na G2 (9×50) + R$ 30 na G3 (27×30).
                        </p>
                      </div>

                      <div className="bg-slate-900/90 border border-sky-500/30 p-3 rounded-lg">
                        <span className="text-[11px] font-black text-sky-300 uppercase block">2. Consultas e Teleatendimentos</span>
                        <span className="text-lg font-black text-white">R$ 6.240,00 / mês</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          39 médicos fazendo ~25 consultas/mês (apenas 1 paciente/dia!): repasses de R$ 12 na G1 + R$ 8 na G2 + ~R$ 5,24 na G3.
                        </p>
                      </div>

                      <div className="bg-slate-900/90 border border-purple-500/30 p-3 rounded-lg">
                        <span className="text-[11px] font-black text-purple-300 uppercase block">3. Farmácia Integrada (Medicamentos)</span>
                        <span className="text-lg font-black text-white">R$ 7.200,00 / mês</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          Pacientes comprando e renovando produtos canabinoides (~15 compras/mês por médico): R$ 25 na G1 + R$ 15 na G2 + R$ 10 na G3.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-800">
                      <div className="text-center sm:text-left">
                        <span className="text-xs font-black text-slate-300 uppercase block">Total Consolidado Mensal da Rede</span>
                        <span className="text-xs font-bold text-emerald-300">R$ 1.560 (Planos) + R$ 6.240 (Consultas) + R$ 7.200 (Farmácia)</span>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-xs font-black text-amber-300 uppercase block">Seu Salário Mensal no Pix</span>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                          R$ 15.000,00 / MÊS
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center sm:text-left">
                    <p className="text-xs font-bold text-amber-200">
                      🚀 <strong>Efeito Multiplicador sem Limites:</strong>
                      <br />• Se você e sua rede indicarem <strong>4 que indicam 4</strong> (84 médicos): sua renda salta para <strong>R$ 38.000,00/mês</strong>.
                      <br />• Com <strong>5 que indicam 5</strong> (155 médicos): ultrapassa <strong>R$ 70.000,00/mês</strong> de renda vitalícia no Pix!
                    </p>
                  </div>
                </div>

                {/* SIMULADOR INTERATIVO COM SLIDERS */}
                <div className="bg-slate-950/95 border-2 border-emerald-500/60 p-5 sm:p-6 rounded-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-lg font-black text-white flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" size={20} />
                        Simulador Interativo de Ganhos Médicos em 3 Gerações
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        Arraste os controles abaixo para simular qualquer tamanho de rede e ver o faturamento mensal projetado:
                      </p>
                    </div>
                    <span className="text-xs font-extrabold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 shrink-0">
                      Cálculo em Tempo Real
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-bold text-slate-200">
                          1. Quantos colegas você convida diretamente (1ª Geração)?
                        </span>
                        <span className="text-base font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                          {docDirects} médicos
                        </span>
                      </div>
                      <Slider 
                        value={[docDirects]} 
                        min={1} 
                        max={20} 
                        step={1} 
                        onValueChange={(val) => setDocDirects(val[0])}
                        className="py-3" 
                      />
                      <p className="text-[11px] font-bold text-slate-400">
                        Cada colega direto gera R$ 50/mês em plano + comissão de atendimento.
                      </p>
                    </div>

                    <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-bold text-slate-200">
                          2. Quantos médicos cada colega indica (2ª e 3ª Geração)?
                        </span>
                        <span className="text-base font-black text-sky-400 bg-sky-500/20 px-2.5 py-0.5 rounded-lg border border-sky-500/40">
                          {docPerColleague} médicos
                        </span>
                      </div>
                      <Slider 
                        value={[docPerColleague]} 
                        min={1} 
                        max={10} 
                        step={1} 
                        onValueChange={(val) => setDocPerColleague(val[0])}
                        className="py-3" 
                      />
                      <p className="text-[11px] font-bold text-slate-400">
                        Multiplicação automática da sua rede em cascata.
                      </p>
                    </div>
                  </div>

                  {/* RESULTADO DO SIMULADOR */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-900/90 border border-emerald-500/40 p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">1ª Geração</p>
                      <p className="text-xl font-black text-white">{gen1Docs}</p>
                      <p className="text-[10px] font-bold text-slate-400">médicos diretos</p>
                    </div>
                    <div className="bg-slate-900/90 border border-sky-500/40 p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-sky-400 uppercase">2ª Geração</p>
                      <p className="text-xl font-black text-white">{gen2Docs}</p>
                      <p className="text-[10px] font-bold text-slate-400">médicos indiretos</p>
                    </div>
                    <div className="bg-slate-900/90 border border-purple-500/40 p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-purple-400 uppercase">3ª Geração</p>
                      <p className="text-xl font-black text-white">{gen3Docs}</p>
                      <p className="text-[10px] font-bold text-slate-400">médicos na rede</p>
                    </div>
                    <div className="bg-emerald-950/80 border-2 border-emerald-400 p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-emerald-300 uppercase">Rede Total</p>
                      <p className="text-xl font-black text-emerald-300">{totalNetworkDocs}</p>
                      <p className="text-[10px] font-bold text-emerald-200">médicos ativos</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-2 border-emerald-400 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                        <DollarSign size={16} /> Salário Mensal Estimado no Pix (Planos + Consultas + Farmácia)
                      </span>
                      <p className="text-3xl sm:text-4xl font-black text-white mt-1">
                        R$ {totalDocMonthlySalary.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-sm font-bold text-emerald-300"> / mês</span>
                      </p>
                      <p className="text-xs font-bold text-slate-300 mt-1">
                        Sendo R$ {planEarnings.toLocaleString("pt-BR")} em planos + R$ {consultationEarnings.toLocaleString("pt-BR")} em consultas + R$ {pharmacyEarnings.toLocaleString("pt-BR")} na Farmácia Integrada
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-center sm:items-end gap-1">
                      <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">
                        ⚡ Saque Direto no Pix
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Meta R$ 15.000/mês com 3 que indicam 3
                      </span>
                    </div>
                  </div>

                  {/* COMPARTILHAMENTO EM 1 CLIQUE */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-200">
                        <strong className="text-white">Seu Link Personalizado de Convite Médico:</strong>
                        <p className="text-[11px] text-slate-400 font-normal truncate max-w-lg mt-0.5">
                          {colleagueShareLink}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          size="sm"
                          onClick={() => copyText(colleagueShareLink, "Link de Colega Médico")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs"
                        >
                          <Copy size={14} className="mr-1.5" /> Copiar Link
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => shareWhatsApp(
                            "Olá colega! Estou convidando você para fazer parte do corpo clínico da Planta y Raíz, a maior plataforma de medicina canabinoide e telemedicina do Brasil. Cadastre-se pelo meu link de médico sócio:",
                            colleagueShareLink
                          )}
                          className="border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10 font-black rounded-xl text-xs"
                        >
                          <Share2 size={14} className="mr-1.5" /> WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button 
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl px-8 h-12 text-sm shadow-xl shadow-emerald-500/20"
                      asChild
                    >
                      <Link to="/indicacoes">
                        <Network className="mr-2" size={18} /> Acessar Meu Painel Completo de Indicações & Rede
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </ComicPanel>

            {/* ORIENTAÇÃO TÉCNICA: SÓ O ENFª BRISA */}
            <ComicPanel color="amber">
              <NarrationBox text="ORIENTAÇÃO TÉCNICA: SÓ O ENFª BRISA" color="amber" />
              <p className="text-sm font-black text-amber-200 mb-3">
                Você não atende, não oferece e não recebe pela Orientação Técnica. Essa modalidade é exclusiva da Enfª Brisa.
              </p>
              <ul className="space-y-2 text-sm text-slate-200">
                <li><strong className="text-white">O que é:</strong> uma conversa educativa de R$ 30 pelo chat. É a porta de entrada da plataforma para quem ainda não pode pagar uma consulta.</li>
                <li><strong className="text-white">Quem atende:</strong> a Enfª Brisa, uma assistente virtual supervisionada pelo Dr. Edilson Bezerra. Nenhum outro médico da vitrine realiza essa modalidade.</li>
                <li><strong className="text-white">O que ela não faz:</strong> não é consulta, não dá diagnóstico e não emite receita. É só o início do cuidado.</li>
                <li><strong className="text-white">Onde aparece:</strong> na página inicial e na página própria da Orientação Técnica. Ela não aparece no seu cartão nem no seu perfil.</li>
                <li><strong className="text-white">O que chega até você:</strong> o paciente que precisa de consulta é orientado a escolher um médico na vitrine. Aí começa o seu trabalho, com consulta paga.</li>
                <li><strong className="text-white">Os seus serviços:</strong> consulta por chat R$ 100, consulta por vídeo R$ 150 e retorno R$ 90, valores tabelados. Você escolhe apenas o valor da Consulta Premium (vídeo + chat), a partir de R$ 100.</li>
              </ul>
            </ComicPanel>

            {/* EXEMPLO DE GANHOS */}
            <ComicPanel color="purple">
              <NarrationBox text="EXEMPLO: QUANTO CHEGA NO SEU PIX" color="purple" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950/90 border-2 border-slate-600 p-4 rounded-2xl">
                  <p className="text-xl font-black text-white">R$ 100,00</p>
                  <p className="text-[11px] font-bold text-slate-300 uppercase">Paciente paga a consulta</p>
                </div>
                <div className="bg-slate-950/90 border-2 border-amber-500/50 p-4 rounded-2xl">
                  <p className="text-xl font-black text-amber-400">− R$ 7,00</p>
                  <p className="text-[11px] font-bold text-amber-200 uppercase">Taxa da plataforma (7%)</p>
                </div>
                <div className="bg-slate-950/90 border-2 border-emerald-500/50 p-4 rounded-2xl">
                  <p className="text-xl font-black text-emerald-400">R$ 93,00</p>
                  <p className="text-[11px] font-bold text-emerald-200 uppercase">Entra no seu saldo</p>
                </div>
                <div className="bg-slate-950/90 border-2 border-purple-500/50 p-4 rounded-2xl">
                  <p className="text-xl font-black text-purple-300">R$ 88,35</p>
                  <p className="text-[11px] font-bold text-purple-200 uppercase">Cai no Pix (saque com 5%)</p>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-3 text-center">
                Valores ilustrativos de uma consulta de R$ 100. A taxa de 7% vale em todos os planos. No saque, há uma taxa de manutenção de 5% sobre o valor sacado.
              </p>
            </ComicPanel>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl px-6 h-11" asChild>
                <Link to="/consultorio"><Power className="mr-2" size={16} /> Abrir Consultório e ligar o ON</Link>
              </Button>
              <Button variant="outline" className="font-black rounded-xl px-6 h-11 border-sky-500/50 text-sky-300" asChild>
                <Link to="/cadastro-profissional"><UserPlus className="mr-2" size={16} /> Ainda não tenho cadastro</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
