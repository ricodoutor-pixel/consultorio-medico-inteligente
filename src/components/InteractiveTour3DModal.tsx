import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, Stethoscope,
  Users, Store, ShoppingBag, ShieldCheck, DollarSign, FileText, Zap,
  Bot, Video, QrCode, ArrowRight, Play, Eye, RotateCcw, HeartPulse,
  Award, Clock, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type TourRole = "paciente" | "medico" | "farmacia";

interface TourStep {
  stepNumber: number;
  title: string;
  badge: string;
  shortDesc: string;
  details: string[];
  highlight: string;
  icon: any;
  accentColor: string;
  bgGradient: string;
  interactivePreview: {
    title: string;
    sub: string;
    status: string;
    items: string[];
    tag: string;
  };
}

const TOUR_DATA: Record<TourRole, { title: string; subtitle: string; icon: any; steps: TourStep[] }> = {
  paciente: {
    title: "Jornada do Paciente",
    subtitle: "Como iniciar seu tratamento de forma 100% segura, acessível e humanizada",
    icon: Users,
    steps: [
      {
        stepNumber: 1,
        title: "Acolhimento & Triagem Enfª Brisa IA",
        badge: "Passo 1 de 5 · Pré-Consulta",
        shortDesc: "Inicie seu contato diretamente pelo WhatsApp ou pelo site. A Enfermeira Brisa faz a escuta inicial dos seus sintomas de forma acolhedora.",
        details: [
          "Coleta rápida de queixas (ansiedade, insônia, dor crônica, etc.)",
          "Organização de exames anteriores e histórico de saúde",
          "Emissão do Relatório Preliminar de Orientação Técnica (R$30)",
        ],
        highlight: "Atendimento 24/7 sem filas de espera",
        icon: Bot,
        accentColor: "text-emerald-400",
        bgGradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
        interactivePreview: {
          title: "Enfermeira Brisa IA · Triagem",
          sub: "WhatsApp Oficial (11) 99136-3154",
          status: "ONLINE · ACOLHENDO PACIENTE",
          items: ["Sintoma: Insônia e Ansiedade", "Relatório Clínico Gerado", "Encaminhado para Prescritor"],
          tag: "PRÉ-TRIAGEM CONCLUÍDA",
        },
      },
      {
        stepNumber: 2,
        title: "Escolha do Médico & Agendamento",
        badge: "Passo 2 de 5 · Guia de Especialistas",
        shortDesc: "Navegue pela lista de médicos homologados pelo CFM e escolha o profissional ideal com total transparência de currículo e valores.",
        details: [
          "Filtre por especialidade (Neurologia, Dor, Psiquiatria, etc.)",
          "Verifique CRM ativo, avaliações e fotos reais",
          "Escolha o melhor dia e horário na agenda integrada",
        ],
        highlight: "Médicos com ampla experiência clínica canabinoide",
        icon: Stethoscope,
        accentColor: "text-sky-400",
        bgGradient: "from-sky-500/20 via-sky-600/10 to-transparent",
        interactivePreview: {
          title: "Guia de Médicos Prescritores",
          sub: "Dr. Daniel Kobayashi / Dr. Edilson Bezerra",
          status: "AGENDA DISPONÍVEL HOJE",
          items: ["Consulta por Vídeo HD", "Prontuário CFM Integrado", "Duração: 30 a 50 min"],
          tag: "ESPECIALISTA VERIFICADO",
        },
      },
      {
        stepNumber: 3,
        title: "Pagamento Seguro via PIX (D+0)",
        badge: "Passo 3 de 5 · Checkout Transparente",
        shortDesc: "Realize o pagamento da sua consulta com total segurança via PIX (QR Code e Copia & Cola) com liberação instantânea da sala.",
        details: [
          "Geração imediata de QR Code PIX Mercado Pago / Banco Central",
          "Confirmação automática em 3 segundos sem envio de comprovante",
          "Recibo digital e garantia total de atendimento",
        ],
        highlight: "Valores populares e acessíveis a partir de R$ 30",
        icon: Zap,
        accentColor: "text-amber-400",
        bgGradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        interactivePreview: {
          title: "Checkout Seguro PIX",
          sub: "Mercado Pago & Banco Central",
          status: "PAGAMENTO APROVADO ✓",
          items: ["Valor da Consulta Confirmado", "Sala de Telemedicina Liberada", "Link Enviado no WhatsApp"],
          tag: "LIBERAÇÃO IMEDIATA",
        },
      },
      {
        stepNumber: 4,
        title: "Teleconsulta HD & Prescrição Digital ICP-Brasil",
        badge: "Passo 4 de 5 · Atendimento Clínico",
        shortDesc: "Conecte-se com seu médico em sala de vídeo de alta definição e receba sua receita digital assinada e válida em todo o Brasil.",
        details: [
          "Sala criptografada ponta-a-ponta que roda direto no celular",
          "Prescrição digital oficial com assinatura ICP-Brasil (Gov.br)",
          "Laudo para autorização de importação ANVISA RDC 660/2022",
        ],
        highlight: "Validade jurídica nacional em qualquer farmácia",
        icon: Video,
        accentColor: "text-purple-400",
        bgGradient: "from-purple-500/20 via-purple-600/10 to-transparent",
        interactivePreview: {
          title: "Prescrição Médica Digital",
          sub: "Assinatura Criptográfica SHA-512 ICP-Brasil",
          status: "RECEITA VÁLIDA ANVISA RDC 660",
          items: ["Óleo CBD Full Spectrum 3000mg", "Posologia Personalizada", "QR Code de Autenticidade CFM"],
          tag: "RECEITA ASSINADA",
        },
      },
      {
        stepNumber: 5,
        title: "Recebimento do Produto no Shopping Oficial",
        badge: "Passo 5 de 5 · Farmácia & Entrega",
        shortDesc: "Adquira seu tratamento com 1 clique na Farmácia Oficial Planta y Raíz ou importe com assessoria completa até a sua porta.",
        details: [
          "Catálogo oficial de fitocanabinoides certificados",
          "Rastreamento de ponta a ponta com entrega expressa",
          "Suporte contínuo da Enfª Brisa para ajuste de dosagem",
        ],
        highlight: "Acompanhamento integral durante todo o tratamento",
        icon: ShoppingBag,
        accentColor: "text-emerald-400",
        bgGradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
        interactivePreview: {
          title: "Farmácia Oficial Planta y Raíz",
          sub: "Dispensário ANVISA AFE / CRF Ativo",
          status: "PEDIDO EM TRANSPORTE",
          items: ["Despacho Regulado", "Código de Rastreio Ativo", "Suporte Farmacêutico 24/7"],
          tag: "ENTREGA GARANTIDA",
        },
      },
    ],
  },
  medico: {
    title: "Jornada do Médico Prescritor",
    subtitle: "Como atender com autonomia máxima, prontuário de ponta e retenção de 93% dos honorários",
    icon: Stethoscope,
    steps: [
      {
        stepNumber: 1,
        title: "Configuração do Consultório & Honorários",
        badge: "Passo 1 de 5 · Onboarding Médico",
        shortDesc: "Defina livremente o valor das suas consultas, seus horários de atendimento e sua chave PIX para repasse instantâneo.",
        details: [
          "Zero tabelamento: você define 100% dos seus preços",
          "Configuração de atendimento por Vídeo HD, Chat ou Ambos",
          "Link personalizado de agendamento para suas redes sociais",
        ],
        highlight: "Cadastro gratuito sem mensalidade ou taxas de adesão",
        icon: DollarSign,
        accentColor: "text-emerald-400",
        bgGradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
        interactivePreview: {
          title: "Painel de Configuração Médica",
          sub: "Consultório Virtual /consultorio",
          status: "PERFIL PROFISSIONAL ATIVO",
          items: ["Consulta Particular: R$ 250,00", "Repasse Médico (93%): R$ 232,50", "Chave PIX Cadastrada ✓"],
          tag: "VALORES LIVRES",
        },
      },
      {
        stepNumber: 2,
        title: "Recepção de Casos Pré-Triados pela Brisa IA",
        badge: "Passo 2 de 5 · Pré-Atendimento",
        shortDesc: "Receba o paciente já acolhido, com queixas organizadas, exames anexados e histórico preliminar pronto no prontuário.",
        details: [
          "Economize até 15 minutos de anamnese repetitiva",
          "Relatório de sintomas e triagem clínica estruturada",
          "Notificação no WhatsApp a cada nova consulta agendada",
        ],
        highlight: "Foco total na relação médico-paciente e escuta qualificada",
        icon: Bot,
        accentColor: "text-sky-400",
        bgGradient: "from-sky-500/20 via-sky-600/10 to-transparent",
        interactivePreview: {
          title: "Dossiê Pré-Clínico Brisa IA",
          sub: "Paciente: Maria Oliveira (54 anos)",
          status: "TRIAGEM PRONTA P/ AVALIAÇÃO",
          items: ["Dor Crônica Neuropática", "Exames de Imagem Anexados", "Interações Medicamentosas Checadas"],
          tag: "DOSSIÊ COMPLETO",
        },
      },
      {
        stepNumber: 3,
        title: "Teleconsulta HD com Prontuário CFM Integrado",
        badge: "Passo 3 de 5 · Atendimento Clínico",
        shortDesc: "Atenda em ambiente WebRTC seguro, com prontuário eletrônico na mesma tela e assistente de cálculo de dosagem CBD/THC.",
        details: [
          "Workspace split-pane: vídeo do paciente ao lado do prontuário",
          "Calculadora inteligente de dosagens e titulação canabinoide",
          "Histórico clínico salvo com criptografia médica de 7 anos",
        ],
        highlight: "Atenda de qualquer computador, tablet ou celular",
        icon: Video,
        accentColor: "text-purple-400",
        bgGradient: "from-purple-500/20 via-purple-600/10 to-transparent",
        interactivePreview: {
          title: "Workspace Clínico Telemedicina",
          sub: "Resolução CFM 2.314/2022",
          status: "SALA DE VÍDEO HD ATIVA",
          items: ["Câmera e Áudio Criptografados", "Evolução Clínica em 1-Clique", "Calculadora Canábica Ativa"],
          tag: "SALA PROTEGIDA",
        },
      },
      {
        stepNumber: 4,
        title: "Emissão de Prescrição Digital ICP-Brasil",
        badge: "Passo 4 de 5 · Prescrição & Laudos",
        shortDesc: "Emita receituários, laudos e termos ANVISA em segundos, com assinatura digital ICP-Brasil aceita em qualquer farmácia do país.",
        details: [
          "Catálogo integrado de fitocanabinoides (CBD, THC, CBG, CBN)",
          "Modelos prontos de posologia para dores, insônia, epilepsia e ansiedade",
          "Envio instantâneo do PDF assinado para o WhatsApp do paciente",
        ],
        highlight: "Total conformidade com a ANVISA RDC 660/2022",
        icon: FileText,
        accentColor: "text-amber-400",
        bgGradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        interactivePreview: {
          title: "Prescritor Canábico Digital",
          sub: "Assinatura Digital ICP-Brasil / Gov.br",
          status: "RECEITA EMITIDA COM SUCESSO",
          items: ["Óleo Full Spectrum 1500mg (30ml)", "Laudo de Justificativa Médica", "Assinatura Hash SHA-512"],
          tag: "VALIDADE NACIONAL",
        },
      },
      {
        stepNumber: 5,
        title: "Repasse Financeiro Instantâneo: 93% via PIX",
        badge: "Passo 5 de 5 · Liquidação Financeira",
        shortDesc: "Receba seus honorários imediatamente após o término da consulta via PIX D+0. Apenas 7% de taxa de intermediação da plataforma.",
        details: [
          "Menor taxa do mercado brasileiro (apenas 7%)",
          "Repasse automático D+0 sem esperar 30 ou 60 dias",
          "Comissões perpétuas por médicos e pacientes indicados",
        ],
        highlight: "Transparência financeira total com extrato detalhado",
        icon: CheckCircle2,
        accentColor: "text-emerald-400",
        bgGradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
        interactivePreview: {
          title: "Extrato Financeiro Médico",
          sub: "Split Automático 93% Médico / 7% Planta y Raíz",
          status: "PIX TRANSFERIDO COM SUCESSO ✓",
          items: ["Honorário Bruto: R$ 250,00", "Taxa Plataforma (7%): R$ 17,50", "PIX Enviado ao Médico: R$ 232,50"],
          tag: "PAGO VIA PIX D+0",
        },
      },
    ],
  },
  farmacia: {
    title: "Jornada da Farmácia & Lojista",
    subtitle: "Como comercializar fitocanabinoides regulados com validação de receita em 1 clique e liquidação segura",
    icon: Store,
    steps: [
      {
        stepNumber: 1,
        title: "Homologação Regulatória & Dossiê AFE",
        badge: "Passo 1 de 5 · Credenciamento",
        shortDesc: "Cadastre sua farmácia anexando AFE, CRF do Farmacêutico Responsável e Alvará Sanitário para operar com segurança jurídica total.",
        details: [
          "Validação de conformidade com RDC 327/2019 e RDC 660/2022",
          "Aprovação ágil pela diretoria técnica e jurídica",
          "Selo de Farmácia Homologada no Marketplace oficial",
        ],
        highlight: "Blindagem sanitária com responsabilidade técnica",
        icon: ShieldCheck,
        accentColor: "text-amber-400",
        bgGradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        interactivePreview: {
          title: "Dossiê Regulatório da Farmácia",
          sub: "Planta y Raíz Ltda / Farmácia Raiz Verde",
          status: "AFE / CRF HOMOLOGADO ✓",
          items: ["Alvará Sanitário Vigente", "Farmacêutico CRF/PR Ativo", "Homologada no Shopping"],
          tag: "LOJA OFICIAL ANVISA",
        },
      },
      {
        stepNumber: 2,
        title: "Cadastro & Gestão do Catálogo no Shopping",
        badge: "Passo 2 de 5 · Produtos & Estoque",
        shortDesc: "Cadastre seus produtos com concentrações de canabinoides (CBD, THC, CBG), COA (Certificado de Análise) e controle de estoque.",
        details: [
          "Upload de laudos laboratoriais e CoA oficial",
          "Definição de preço, prazo de envio e condições de frete",
          "Visibilidade nacional para milhares de pacientes prescritos",
        ],
        highlight: "Exposição direta para médicos prescritores e pacientes",
        icon: Store,
        accentColor: "text-sky-400",
        bgGradient: "from-sky-500/20 via-sky-600/10 to-transparent",
        interactivePreview: {
          title: "Catálogo de Fitocanabinoides",
          sub: "Shopping Planta y Raíz",
          status: "38 PRODUTOS ATIVOS",
          items: ["Óleos Full Spectrum 30ml", "Gummies CBD 25mg", "Cremes Tópicos Terapêuticos"],
          tag: "CATÁLOGO ATIVO",
        },
      },
      {
        stepNumber: 3,
        title: "Recepção de Pedidos & Validação de Receita",
        badge: "Passo 3 de 5 · Validação Criptográfica",
        shortDesc: "Receba pedidos automáticos com a receita médica ICP-Brasil já auditada e vinculada ao CPF do paciente com hash SHA-512.",
        details: [
          "Verificação automática de CRM do médico prescritor no CFM",
          "Validador de assinatura digital sem risco de falsificação",
          "Notificação em tempo real no painel do lojista",
        ],
        highlight: "Risco zero de dispensação sem receita válida",
        icon: FileText,
        accentColor: "text-purple-400",
        bgGradient: "from-purple-500/20 via-purple-600/10 to-transparent",
        interactivePreview: {
          title: "Motor de Validação de Receita",
          sub: "Protocolo UCP / MCP Agêntico",
          status: "RECEITA CONFERIDA & APROVADA ✓",
          items: ["Prescritor: Dr. Daniel (CRM-SP)", "Paciente: CPF 100% Compatível", "Hash ICP-Brasil Verificado"],
          tag: "DISPENSAÇÃO LIBERADA",
        },
      },
      {
        stepNumber: 4,
        title: "Despacho & Rastreabilidade de Entrega",
        badge: "Passo 4 de 5 · Logística Expressa",
        shortDesc: "Embale o produto regulado com etiqueta de rastreio e atualize o código no painel para que o paciente acompanhe a entrega.",
        details: [
          "Etiqueta de envio com dados regulatórios ANVISA",
          "Notificação automática via WhatsApp para o paciente",
          "Comprovante digital de recebimento e entrega segura",
        ],
        highlight: "Logística ágil com garantia de entrega refrigerada/segura",
        icon: ShoppingBag,
        accentColor: "text-emerald-400",
        bgGradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
        interactivePreview: {
          title: "Expedição & Rastreio",
          sub: "Transportadora Especializada",
          status: "OBJETO POSTADO (RASTREIO ATIVO)",
          items: ["Código: BR948201948PYR", "Previsão: 2 a 4 dias úteis", "WhatsApp Notificado ✓"],
          tag: "RASTREIO ATIVO",
        },
      },
      {
        stepNumber: 5,
        title: "Liquidação Financeira & Recebimento",
        badge: "Passo 5 de 5 · Faturamento Seguro",
        shortDesc: "Receba o valor das suas vendas diretamente na sua conta com liquidação transparente e relatórios fiscais integrados.",
        details: [
          "Split automático de pagamentos sem risco de inadimplência",
          "Extrato de vendas consolidado por período",
          "Suporte comercial e expansão contínua da sua loja",
        ],
        highlight: "Faturamento direto e escalável na maior clínica digital do país",
        icon: DollarSign,
        accentColor: "text-amber-400",
        bgGradient: "from-amber-500/20 via-amber-600/10 to-transparent",
        interactivePreview: {
          title: "Liquidação de Vendas do Shopping",
          sub: "Extrato Financeiro do Dispensário",
          status: "SALDO LIQUIDADO NA CONTA ✓",
          items: ["Total de Vendas no Mês: R$ 42.800", "Repasse Lojista Liberado", "Relatório Fiscal Gerado"],
          tag: "PAGAMENTO CONFIRMADO",
        },
      },
    ],
  },
};

export const InteractiveTour3DModal = ({
  initialRole = "paciente",
  autoOpen = false,
}: {
  initialRole?: TourRole;
  autoOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<TourRole>(initialRole);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Listen for global custom events to open the tour from any button
  useEffect(() => {
    const handleOpenTour = (event: any) => {
      const role = event.detail?.role || "paciente";
      setCurrentRole(role);
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("pyr:open-tour", handleOpenTour);
    return () => window.removeEventListener("pyr:open-tour", handleOpenTour);
  }, []);

  // Auto-open on first login/dashboard entry if requested
  useEffect(() => {
    if (autoOpen) {
      const hasSeen = localStorage.getItem(`pyr_tour_seen_${initialRole}`);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }
  }, [autoOpen, initialRole]);

  const activeTour = TOUR_DATA[currentRole];
  const step = activeTour.steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < activeTour.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem(`pyr_tour_seen_${currentRole}`, "true");
    setIsOpen(false);
  };

  const selectRole = (role: TourRole) => {
    setCurrentRole(role);
    setCurrentStepIndex(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl scale-[0.85] origin-center p-0 overflow-hidden border-border bg-slate-950/95 backdrop-blur-2xl text-foreground shadow-2xl rounded-3xl z-[150]">
        {/* Top Gradient Banner */}
        <div className="relative p-6 pb-4 border-b border-border/60 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-purple-950/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-display font-black text-foreground tracking-tight">
                    Tour Interativo 360° <span className="text-emerald-400">·</span> Planta y Raíz
                  </h2>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    3D STEP-BY-STEP
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aprenda todo o fluxo passo a passo desde o primeiro contato até o atendimento e recebimento
                </p>
              </div>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
              <button
                onClick={() => selectRole("paciente")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === "paciente"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-800/60"
                }`}
              >
                <Users size={13} /> Paciente
              </button>
              <button
                onClick={() => selectRole("medico")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === "medico"
                    ? "bg-sky-500 text-slate-950 shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-800/60"
                }`}
              >
                <Stethoscope size={13} /> Médico (93% PIX)
              </button>
              <button
                onClick={() => selectRole("farmacia")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === "farmacia"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-800/60"
                }`}
              >
                <Store size={13} /> Farmácia
              </button>
            </div>
          </div>

          {/* Progress step dots */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {activeTour.steps.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-md shadow-emerald-500/30 scale-105"
                      : idx < currentStepIndex
                      ? "bg-emerald-500/50"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono font-bold text-muted-foreground shrink-0 ml-2">
              Passo {currentStepIndex + 1} de {activeTour.steps.length}
            </span>
          </div>
        </div>

        {/* Modal Main Content with 3D Effect */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentRole}-${currentStepIndex}`}
              initial={{ opacity: 0, x: 20, rotateY: 5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -20, rotateY: -5 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Column: Step Description & Details (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5">
                    {step.badge}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Clock size={12} className="text-emerald-400" /> {step.highlight}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.bgGradient} border border-border flex items-center justify-center shrink-0 shadow-lg`}>
                    <step.icon size={24} className={step.accentColor} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-display font-black text-foreground tracking-tight leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {step.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Checklist points */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-border/80 space-y-2.5">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">Como funciona na prática:</p>
                  {step.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 3D Simulated Interactive Card Preview (5 cols) */}
              <div className="lg:col-span-5">
                <motion.div
                  whileHover={{ scale: 1.02, rotateY: -3, rotateX: 3 }}
                  style={{ perspective: 1000 }}
                  className="relative p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] font-mono font-bold text-emerald-400">{step.interactivePreview.status}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-bold bg-slate-800 text-slate-200">
                      {step.interactivePreview.tag}
                    </Badge>
                  </div>

                  <p className="text-sm font-black text-foreground">{step.interactivePreview.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">{step.interactivePreview.sub}</p>

                  <div className="space-y-2">
                    {step.interactivePreview.items.map((item, iIdx) => (
                      <div key={iIdx} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                        <span className="truncate">{item}</span>
                        <Check size={14} className="text-emerald-400 shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Planta y Raíz · Telemedicina</span>
                    <span className="text-emerald-400 font-bold">100% Conforme CFM/ANVISA</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-5 px-6 md:px-8 border-t border-border/60 bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Pular / Concluir Depois
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="text-xs rounded-xl border-border"
            >
              <ChevronLeft size={14} className="mr-1" /> Anterior
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
            >
              {currentStepIndex === activeTour.steps.length - 1 ? (
                <>
                  <CheckCircle2 size={14} className="mr-1.5" /> Concluir Tour
                </>
              ) : (
                <>
                  Próximo Passo <ChevronRight size={14} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const openGlobalTour = (role: TourRole = "paciente") => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pyr:open-tour", { detail: { role } }));
  }
};
