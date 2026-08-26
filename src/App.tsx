import DashboardDiretoria from "./components/admin/DashboardDiretoria";
import { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FrogChatModal } from "./components/FrogChatModal";
import { BrisaChatModal } from "./components/BrisaChatModal";
import { ShoppingCart } from "./components/ShoppingCart";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { TenantProvider } from "@/contexts/TenantContext";

import { OfflineAlert } from "@/components/OfflineAlert";
import { useCart } from "@/store/cart";
import { AccessibilitySkipLink } from "@/components/AccessibilitySkipLink";
import MascotVerdinho from "@/components/MascotVerdinho";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { OpenGraphHead } from "@/components/OpenGraphHead";
import { FacebookPixelProvider } from "@/components/FacebookPixelProvider";
import { ReferralCaptureProvider } from "@/components/ReferralCaptureProvider";
import { SearchEngineOptimization } from "@/components/SearchEngineOptimization";
import { DynamicSEOHead } from "@/components/DynamicSEOHead";
import { LocalCTABanner } from "@/components/LocalCTABanner";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ConsentManager } from "@/components/ConsentManager";
import { lazyWithRecovery, reportFrontendRuntimeError } from "@/lib/runtime-recovery";

const MonitoramentoCSI = lazyWithRecovery(() => import("./pages/MonitoramentoCSI"), { sourceRef: "/monitoramento" });
const Loading = () => (
  <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-[-15px] rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <div className="animate-bounce" style={{ animationDuration: '2s' }}>
        <img 
          src="/dr-verdinho.png" 
          alt="Carregando Plataforma" 
          className="w-24 h-24 object-contain rounded-full shadow-lg"
        />
      </div>
    </div>
    <p className="mt-8 text-primary font-bold animate-pulse">Carregando...</p>
  </div>
);

// Code splitting - lazy load all routes
const Index = lazyWithRecovery(() => import("./pages/Index"), { sourceRef: "/" });
const OnboardingFlow = lazyWithRecovery(() => import("./pages/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })), { sourceRef: "/onboarding" });
const ComoFunciona = lazyWithRecovery(() => import("./pages/ComoFunciona"), { sourceRef: "/como-funciona" });
const Profissionais = lazyWithRecovery(() => import("./pages/Profissionais"), { sourceRef: "/profissionais" });
const Shopping = lazyWithRecovery(() => import("./pages/Shopping"), { sourceRef: "/shopping" });
const ComunidadeConteudoIA = lazyWithRecovery(() => import("./pages/ComunidadeConteudoIA"), { sourceRef: "/comunidade" });
const Agendamento = lazyWithRecovery(() => import("./pages/Agendamento"), { sourceRef: "/agendamento" });
const FAQ = lazyWithRecovery(() => import("./pages/FAQ"), { sourceRef: "/faq" });
const Contato = lazyWithRecovery(() => import("./pages/Contato"), { sourceRef: "/contato" });
const Pay = lazyWithRecovery(() => import("./pages/Pay"), { sourceRef: "/pay" });
const Carteira = lazyWithRecovery(() => import("./pages/Carteira"), { sourceRef: "/carteira" });
const Admin = lazyWithRecovery(() => import("./pages/Admin"), { sourceRef: "/admin" });
const AdminClinicas = lazyWithRecovery(() => import("./pages/AdminClinicas"), { sourceRef: "/admin/clinicas" });
const AdminIndicacoes = lazyWithRecovery(() => import("./pages/AdminIndicacoes"), { sourceRef: "/admin/indicacoes" });
const AdminLogin = lazyWithRecovery(() => import("./pages/AdminLogin"), { sourceRef: "/admin-login" });
const BibliotecaCientifica = lazyWithRecovery(() => import("./pages/BibliotecaCientifica"), { sourceRef: "/biblioteca" });
const CadastroProfissional = lazyWithRecovery(() => import("./pages/CadastroProfissional"), { sourceRef: "/cadastro-profissional" });
const FalarComEspecialista = lazyWithRecovery(() => import("./pages/FalarComEspecialista"), { sourceRef: "/falar-com-especialista" });
const Legal = lazyWithRecovery(() => import("./pages/Legal"), { sourceRef: "/legal" });
const Confianca = lazyWithRecovery(() => import("./pages/Confianca"), { sourceRef: "/confianca" });
const NossaHistoria = lazyWithRecovery(() => import("./pages/NossaHistoria"), { sourceRef: "/nossa-historia" });
const MeuCartao = lazyWithRecovery(() => import("./pages/MeuCartao"), { sourceRef: "/saude-plus/meu-cartao" });
const TermosDeUso = lazyWithRecovery(() => import("./pages/TermosDeUso"), { sourceRef: "/termos" });
const PoliticaDePrivacidade = lazyWithRecovery(() => import("./pages/PoliticaDePrivacidade"), { sourceRef: "/privacidade" });
const PoliticaDeReembolso = lazyWithRecovery(() => import("./pages/PoliticaDeReembolso"), { sourceRef: "/reembolso" });
const Indicacoes = lazyWithRecovery(() => import("./pages/Indicacoes"), { sourceRef: "/indicacoes" });
const Unsubscribe = lazyWithRecovery(() => import("./pages/Unsubscribe"), { sourceRef: "/unsubscribe" });
const MeusExames = lazyWithRecovery(() => import("./pages/MeusExames"), { sourceRef: "/meus-exames" });
const Telemedicina = lazyWithRecovery(() => import("./pages/Telemedicina"), { sourceRef: "/telemedicina" });
const Cadastro = lazyWithRecovery(() => import("./pages/Cadastro"), { sourceRef: "/cadastro" });
const ConfiguracoesMedico = lazyWithRecovery(() => import("./pages/ConfiguracoesMedico"), { sourceRef: "/configuracoes-medico" });
const AtualizarDocumentosMedico = lazyWithRecovery(() => import("./pages/AtualizarDocumentosMedico"), { sourceRef: "/atualizar-documentos-medico" });
const Login = lazyWithRecovery(() => import("./pages/Login"), { sourceRef: "/login" });
const ResetPassword = lazyWithRecovery(() => import("./pages/ResetPassword"), { sourceRef: "/reset-password" });
const ConsultationPayment = lazyWithRecovery(() => import("./pages/ConsultationPayment"), { sourceRef: "/pagamento" });
const SpecialistDashboard = lazyWithRecovery(() => import("./pages/SpecialistDashboard"), { sourceRef: "/dashboard-especialista" });
const InfluencerDashboard = lazyWithRecovery(() => import("./pages/InfluencerDashboard"), { sourceRef: "/influenciadores" });
const OnlineUsers = lazyWithRecovery(() => import("./pages/OnlineUsers"), { sourceRef: "/usuarios-online" });
const AdminDashboard = lazyWithRecovery(() => import("./pages/AdminDashboard"), { sourceRef: "/admin-ceo" });
const DownloadApp = lazyWithRecovery(() => import("./pages/DownloadApp"), { sourceRef: "/download" });
const MonitorCardiacoPage = lazyWithRecovery(() => import("./pages/MonitorCardiaco"), { sourceRef: "/monitor-cardiaco" });
const ConsultationMonitorPage = lazyWithRecovery(() => import("./pages/ConsultationMonitor").then(m => ({ default: m.ConsultationMonitorPage })), { sourceRef: "/consultation-monitor" });
const Precos = lazyWithRecovery(() => import("./pages/Precos"), { sourceRef: "/precos" });
const SaudeDigital = lazyWithRecovery(() => import("./pages/SaudeDigital"), { sourceRef: "/saude-digital" });
const DashboardPaciente = lazyWithRecovery(() => import("./pages/DashboardPaciente"), { sourceRef: "/dashboard" });
const Prontuario = lazyWithRecovery(() => import("./pages/Prontuario"), { sourceRef: "/prontuario" });
const DashboardMedico = lazyWithRecovery(() => import("./pages/DashboardMedico"), { sourceRef: "/dashboard-medico" });
const RelatorioPaciente = lazyWithRecovery(() => import("./pages/RelatorioPaciente").then(m => ({ default: m.RelatorioPaciente })), { sourceRef: "/relatorio-paciente" });
const ProntuarioInteligente = lazyWithRecovery(() => import("./pages/medico/ProntuarioInteligente").then(m => ({ default: m.ProntuarioInteligente })), { sourceRef: "/medico/prontuario" });
const WorkspaceMedico = lazyWithRecovery(() => import("./pages/WorkspaceMedico"), { sourceRef: "/workspace-medico" });
const DashboardExecutivo = lazyWithRecovery(() => import("./pages/DashboardExecutivo"), { sourceRef: "/dashboard-executivo" });
const Notificacoes = lazyWithRecovery(() => import("./pages/Notificacoes"), { sourceRef: "/notificacoes" });
const SalaEspera = lazyWithRecovery(() => import("./pages/SalaEspera"), { sourceRef: "/sala-espera" });
const ManualPlataforma = lazyWithRecovery(() => import("./pages/ManualPlataforma"), { sourceRef: "/manual" });
const OrientacaoVideo = lazyWithRecovery(() => import("./pages/OrientacaoVideo"), { sourceRef: "/orientacao-video" });
const Appointments = lazyWithRecovery(() => import("./pages/Appointments"), { sourceRef: "/consultas" });
const RIPD = lazyWithRecovery(() => import("./pages/RIPD"), { sourceRef: "/ripd" });
const LGPDDireitos = lazyWithRecovery(() => import("./pages/LGPDDireitos"), { sourceRef: "/lgpd" });
const GlobalCompliance = lazyWithRecovery(() => import("./pages/GlobalCompliance"), { sourceRef: "/compliance" });
const TreatmentTracker = lazyWithRecovery(() => import("./pages/TreatmentTracker"), { sourceRef: "/treatment-tracker" });
const Dispensario = lazyWithRecovery(() => import("./pages/Dispensario"), { sourceRef: "/dispensario" });
const ProdutosAnvisa = lazyWithRecovery(() => import("./pages/ProdutosAnvisa"), { sourceRef: "/produtos-anvisa" });
const IoMTHub = lazyWithRecovery(() => import("./pages/IoMTHub"), { sourceRef: "/iomt" });
const Blog = lazyWithRecovery(() => import("./pages/Blog"), { sourceRef: "/blog" });
const ShoppingDashboard = lazyWithRecovery(() => import("./pages/ShoppingDashboard"), { sourceRef: "/dashboard-loja" });
const InvestorDashboard = lazyWithRecovery(() => import("./pages/InvestorDashboard"), { sourceRef: "/investidores" });
// /videochamada foi consolidada em /orientacao-video (mesmo backend real:
// create-video-room + join-video-room). Mantemos a rota como redirect para
// nao quebrar links antigos ja enviados a pacientes/medicos.
const LegacyVideoCallRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/orientacao-video${location.search}`} replace />;
};
const OrientacaoRapida = lazyWithRecovery(() => import("./pages/OrientacaoRapida"), { sourceRef: "/orientacao-rapida" });
const SEOCondicoes = lazyWithRecovery(() => import("./pages/SEOCondicoes"), { sourceRef: "/tratamentos" });
const Status = lazyWithRecovery(() => import("./pages/Status"), { sourceRef: "/status" });
const Passaporte = lazyWithRecovery(() => import("./pages/Passaporte"), { sourceRef: "/passaporte" });
const TratamentoDorCronica = lazyWithRecovery(() => import("./pages/TratamentoDorCronica"), { sourceRef: "/tratamento-dor-cronica" });
const TratamentoAnsiedadeSaudeMental = lazyWithRecovery(() => import("./pages/TratamentoAnsiedadeSaudeMental"), { sourceRef: "/tratamento-ansiedade-saude-mental" });
const Club = lazyWithRecovery(() => import("./pages/Club"), { sourceRef: "/club" });
const Deposits = lazyWithRecovery(() => import("./pages/Deposits"), { sourceRef: "/deposits" });
const CartCheckout = lazyWithRecovery(() => import("./pages/CartCheckout"), { sourceRef: "/cart-checkout" });
const PaymentSuccess = lazyWithRecovery(() => import("./pages/PaymentSuccess"), { sourceRef: "/payment/success" });
const PaymentFailure = lazyWithRecovery(() => import("./pages/PaymentFailure"), { sourceRef: "/payment/failure" });
const PaymentPending = lazyWithRecovery(() => import("./pages/PaymentPending"), { sourceRef: "/payment/pending" });
const Cursos = lazyWithRecovery(() => import("./pages/Cursos"), { sourceRef: "/cursos" });
const Forum = lazyWithRecovery(() => import("./pages/Forum"), { sourceRef: "/forum" });
const Webinars = lazyWithRecovery(() => import("./pages/Webinars"), { sourceRef: "/webinars" });
const Voluntarios = lazyWithRecovery(() => import("./pages/Voluntarios"), { sourceRef: "/voluntarios" });
const ImpactoSocial = lazyWithRecovery(() => import("./pages/ImpactoSocial"), { sourceRef: "/impacto" });
const EbookLanding = lazyWithRecovery(() => import("./pages/EbookLanding"), { sourceRef: "/ebook" });
const EbookMedicinaCanabinoide = lazyWithRecovery(() => import("./pages/EbookMedicinaCanabinoide"), { sourceRef: "/ebook-medicina-canabinoide" });
const EbookAnalyticsDashboard = lazyWithRecovery(() => import("./pages/EbookAnalyticsDashboard"), { sourceRef: "/admin/ebook-analytics" });
const RevenueDistribution = lazyWithRecovery(() => import("./pages/RevenueDistribution"), { sourceRef: "/revenue-distribution" });
const ProfessionalDashboard = lazyWithRecovery(() => import("./pages/ProfessionalDashboard"), { sourceRef: "/dashboard/professional" });
const AdminMaster = lazyWithRecovery(() => import("./pages/AdminMaster"), { sourceRef: "/admin-master" });
const AdminMasterControl = lazyWithRecovery(() => import("./pages/AdminMasterControl"), { sourceRef: "/admin/master-control" });
const AdminBI = lazyWithRecovery(() => import("./pages/AdminBI"), { sourceRef: "/admin/bi" });
const Badges = lazyWithRecovery(() => import("./pages/Badges"), { sourceRef: "/badges" });
const HealthCheck = lazyWithRecovery(() => import("./pages/HealthCheck"), { sourceRef: "/health" });
const AutomationsDashboard = lazyWithRecovery(() => import("./pages/AutomationsDashboard"), { sourceRef: "/admin/automations" });
const OnboardingMatch = lazyWithRecovery(() => import("./pages/OnboardingMatch"), { sourceRef: "/onboarding-match" });
const TelemedicinaAssincrona = lazyWithRecovery(() => import("./pages/TelemedicinaAssincrona"), { sourceRef: "/telemedicina-assincrona" });
const AfiliadosGamificado = lazyWithRecovery(() => import("./pages/AfiliadosGamificado"), { sourceRef: "/afiliados" });
const AdminAfiliados = lazyWithRecovery(() => import("./pages/admin/AdminAfiliados"), { sourceRef: "/admin/afiliados" });
const LojistaDashboard = lazyWithRecovery(() => import("./pages/LojistaDashboard"), { sourceRef: "/lojistas" });
const ConviteMedico = lazyWithRecovery(() => import("./pages/ConviteMedico"), { sourceRef: "/convite-medico" });

// ── Cartão Saúde Verde ──
const SaudeVerdeLanding = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeLanding"), { sourceRef: "/saude-verde" });
const SaudeVerdeRede = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeRede"), { sourceRef: "/saude-verde/rede" });
const SaudeVerdeCartao = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeCartao"), { sourceRef: "/saude-verde/cartao" });
const SaudeVerdeAgendar = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeAgendar"), { sourceRef: "/saude-verde/agendar" });
const SaudeVerdeEmpresas = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeEmpresas"), { sourceRef: "/saude-verde/empresas" });
const SaudeVerdeParceiros = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeParceiros"), { sourceRef: "/saude-verde/seja-parceiro" });
const AdminSaudeVerde = lazyWithRecovery(() => import("./pages/admin/AdminSaudeVerde"), { sourceRef: "/admin/saude-verde" });
const AdminMpWebhooks = lazyWithRecovery(() => import("./pages/admin/AdminMpWebhooks"), { sourceRef: "/admin/mp-webhooks" });
const SaudeVerdeAssinatura = lazyWithRecovery(() => import("./pages/saude-verde/SaudeVerdeAssinatura"), { sourceRef: "/saude-verde/assinatura" });
const OmniChannelDashboard = lazyWithRecovery(() => import("./pages/OmniChannelDashboard"), { sourceRef: "/admin/omni-channel" });
const BrisaCEO = lazyWithRecovery(() => import("./pages/admin/BrisaCEO"), { sourceRef: "/admin/brisa-ceo" });
const BrisaOrientacoes = lazyWithRecovery(() => import("./pages/admin/BrisaOrientacoes"), { sourceRef: "/admin/brisa-orientacoes" });
const OfertaEspecial = lazyWithRecovery(() => import("./pages/OfertaEspecial"), { sourceRef: "/oferta-especial" });
const AdminFinanceiro = lazyWithRecovery(() => import("./pages/AdminFinanceiro"), { sourceRef: "/admin/financeiro" });
const AdminCreditAudit = lazyWithRecovery(() => import("./pages/AdminCreditAudit"), { sourceRef: "/admin/credit-audit" });
const GrowthDashboard = lazyWithRecovery(() => import("./pages/admin/GrowthDashboard"), { sourceRef: "/admin/growth" });
const AdminMonitoramento = lazyWithRecovery(() => import("./pages/AdminMonitoramento"), { sourceRef: "/admin/monitoramento" });
const QuizTriagem = lazyWithRecovery(() => import("./pages/QuizTriagem"), { sourceRef: "/quiz-triagem" });
const CondicaoTratamento = lazyWithRecovery(() => import("./pages/CondicaoTratamento"), { sourceRef: "/condicao" });
const Consultorio = lazyWithRecovery(() => import("./pages/Consultorio"), { sourceRef: "/consultorio" });
const FastTrackCheckout = lazyWithRecovery(() => import("./pages/FastTrackCheckout"), { sourceRef: "/checkout/fast-track" });
const PlanosTratamento = lazyWithRecovery(() => import("./pages/PlanosTratamento"), { sourceRef: "/planos-tratamento" });
const AffiliateDashboard = lazyWithRecovery(() => import("./pages/AffiliateDashboard"), { sourceRef: "/afiliados/dashboard" });
const PrescriptionCheckout = lazyWithRecovery(() => import("./pages/PrescriptionCheckout"), { sourceRef: "/checkout/:token" });
const CheckoutReturn = lazyWithRecovery(() => import("./pages/CheckoutReturn"), { sourceRef: "/checkout/return" });
const GestaoPacientes = lazyWithRecovery(() => import("./pages/GestaoPacientes"), { sourceRef: "/gestao-pacientes" });
const NotFound = lazyWithRecovery(() => import("./pages/NotFound"), { sourceRef: "*" });
const RodizioMedicos = lazyWithRecovery(() => import("./pages/RodizioMedicos"), { sourceRef: "/rodizio" });
const BrisaOrientacaoRedirect = lazyWithRecovery(() => import("./pages/BrisaOrientacaoRedirect"), { sourceRef: "/brisa-orientacao" });
const AuditLog = lazyWithRecovery(() => import("./pages/admin/AuditLog"), { sourceRef: "/admin/audit-log" });
const CronHealth = lazyWithRecovery(() => import("./pages/admin/CronHealth"), { sourceRef: "/admin/cron-health" });
const RemoteCommandLog = lazyWithRecovery(() => import("./pages/admin/RemoteCommandLog"), { sourceRef: "/admin/remote-commands" });
const InfraServices = lazyWithRecovery(() => import("./pages/admin/InfraServices"), { sourceRef: "/admin/infra-services" });
const ConversionsUnified = lazyWithRecovery(() => import("./pages/admin/ConversionsUnified"), { sourceRef: "/admin/conversoes" });
const ConversoesUptime = lazyWithRecovery(() => import("./pages/admin/ConversoesUptime"), { sourceRef: "/admin/conversoes-uptime" });
const AdminLeads = lazyWithRecovery(() => import("./pages/admin/Leads"), { sourceRef: "/admin/leads" });
const AdminLeadDetail = lazyWithRecovery(() => import("./pages/admin/LeadDetail"), { sourceRef: "/admin/leads/:id" });
const AdminLeadsEmergencia = lazyWithRecovery(() => import("./pages/admin/LeadsEmergencia"), { sourceRef: "/admin/leads-emergencia" });
const President360 = lazyWithRecovery(() => import("./pages/admin/President360"), { sourceRef: "/admin/president" });
const SentinelControl = lazyWithRecovery(() => import("./pages/admin/SentinelControl"), { sourceRef: "/admin/sentinel" });
const TelemedBrisaCheck = lazyWithRecovery(() => import("./pages/admin/TelemedBrisaCheck"), { sourceRef: "/admin/telemed-brisa-check" });
const CadastrosRealtime = lazyWithRecovery(() => import("./pages/admin/CadastrosRealtime"), { sourceRef: "/admin/cadastros" });
const AdminGlobalOps = lazyWithRecovery(() => import("./pages/AdminGlobalOps"), { sourceRef: "/admin/global-ops" });
const WhatsAppInbox = lazyWithRecovery(() => import("./pages/admin/WhatsAppInbox"), { sourceRef: "/admin/whatsapp-inbox" });
const AdminAprovacoes = lazyWithRecovery(() => import("./pages/admin/AdminAprovacoes"), { sourceRef: "/admin/aprovacoes-medicas" });
const AdminAprovacoesFarmacias = lazyWithRecovery(() => import("./pages/admin/AdminAprovacoesFarmacias"), { sourceRef: "/admin/aprovacoes-farmacias" });
const AdminAprovacoesPacientes = lazyWithRecovery(() => import("./pages/admin/AdminAprovacoesPacientes"), { sourceRef: "/admin/aprovacoes-pacientes" });
const AdminMedicosOnline = lazyWithRecovery(() => import("./pages/admin/MedicosOnline"), { sourceRef: "/admin/medicos-online" });
const AuthCallback = lazyWithRecovery(() => import("./pages/AuthCallback"), { sourceRef: "/auth/callback" });
const MedSocio = lazyWithRecovery(() => import("./pages/MedSocio"), { sourceRef: "/medsocio" });
const TelemedWhatsApp = lazyWithRecovery(() => import("./pages/TelemedWhatsApp"), { sourceRef: "/telemed-whatsapp" });
const MonitoramentoSaude = lazyWithRecovery(() => import("./pages/MonitoramentoSaude"), { sourceRef: "/monitoramento-saude" });

const queryClient = new QueryClient();

/**
 * Ruído de extensões do navegador (MetaMask/carteiras cripto, tradutores).
 * Não são falhas da plataforma e não devem ser reportadas nem acionar recovery.
 */
const isExtensionNoise = (err: unknown): boolean => {
  try {
    const seen = new Set<unknown>();
    let cur: any = err;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const msg = String(cur?.message ?? cur ?? "");
      const stack = String(cur?.stack ?? "");
      if (/chrome-extension:\/\/|moz-extension:\/\/|safari-web-extension:\/\//.test(stack + msg)) return true;
      if (/MetaMask|ethereum provider|web3|Failed to connect to MetaMask/i.test(msg)) return true;
      cur = cur?.cause;
    }
  } catch {
    /* noop */
  }
  return false;
};

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (isExtensionNoise(event.error ?? event.message) || /extension:\/\//.test(event.filename || "")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    reportFrontendRuntimeError(event.error ?? event.message, {
      sourceRef: window.location.pathname,
      phase: "fatal-runtime",
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isExtensionNoise(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    reportFrontendRuntimeError(event.reason, {
      sourceRef: window.location.pathname,
      phase: "unhandled-rejection",
    });
  });
}


const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
      <LanguageProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineAlert />
          <BrowserRouter>
            <OpenGraphHead />
            <SearchEngineOptimization />
            <DynamicSEOHead />
            <LocalCTABanner />
            <AccessibilitySkipLink />
            <FacebookPixelProvider />
            <ReferralCaptureProvider />
            <FrogChatModal />
            <BrisaChatModal />
            <ShoppingCart />
            <OnboardingModal />
            <ConsentManager />
            <Suspense fallback={<Loading />}>
              <main id="main-content" role="main">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<OnboardingFlow />} />
                <Route path="/onboarding-match" element={<OnboardingMatch />} />
                <Route path="/cadastro-completo" element={<OnboardingFlow />} />
                <Route path="/como-funciona" element={<ComoFunciona />} />
                <Route path="/profissionais" element={<Profissionais />} />
                <Route path="/profissionais/:id" element={<Profissionais />} />
                <Route path="/shopping" element={<Shopping />} />
                <Route path="/shopping/:id" element={<Shopping />} />
                <Route path="/loja" element={<Shopping />} />
                <Route path="/loja/:id" element={<Shopping />} />
                <Route path="/planos" element={<Precos />} />
                <Route path="/precos" element={<Precos />} />
                <Route path="/saude-digital" element={<SaudeDigital />} />
                <Route path="/convite-medico" element={<ConviteMedico />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/manual" element={<ManualPlataforma />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/pay" element={<Pay />} />
                <Route path="/carteira" element={<Carteira />} />
                <Route path="/cadastro-profissional" element={<CadastroProfissional />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/falar-com-especialista" element={<FalarComEspecialista />} />
                <Route path="/telemedicina" element={<Telemedicina />} />
                <Route path="/rodizio" element={<RodizioMedicos />} />
                <Route path="/brisa-orientacao" element={<BrisaOrientacaoRedirect />} />
                <Route path="/afiliados" element={<Indicacoes />} />
                <Route path="/indicacoes" element={<Indicacoes />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/confianca" element={<Confianca />} />
                <Route path="/trust" element={<Confianca />} />
                <Route path="/nossa-historia" element={<NossaHistoria />} />
                <Route path="/saude-plus/meu-cartao" element={<MeuCartao />} />
                <Route path="/meu-cartao" element={<MeuCartao />} />
                <Route path="/termos" element={<TermosDeUso />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />
                <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
                <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
                <Route path="/reembolso" element={<PoliticaDeReembolso />} />
                <Route path="/politica-de-reembolso" element={<PoliticaDeReembolso />} />
                <Route path="/pagamento" element={<ConsultationPayment />} />
                <Route path="/dashboard-especialista" element={<SpecialistDashboard />} />
                <Route path="/influenciadores" element={<InfluencerDashboard />} />
                <Route path="/usuarios-online" element={<OnlineUsers />} />
                <Route path="/admin-ceo" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="/admin/president" element={<AdminRoute><President360 /></AdminRoute>} />
                <Route path="/admin/presidente" element={<AdminRoute><President360 /></AdminRoute>} />
                <Route path="/admin/sentinela" element={<AdminRoute><SentinelControl /></AdminRoute>} />
                <Route path="/admin/sentinel" element={<AdminRoute><SentinelControl /></AdminRoute>} />
                <Route path="/admin/telemed-brisa-check" element={<AdminRoute><TelemedBrisaCheck /></AdminRoute>} />
                <Route path="/admin/clinicas" element={<AdminRoute><AdminClinicas /></AdminRoute>} />
                <Route path="/admin/financeiro" element={<AdminRoute><AdminFinanceiro /></AdminRoute>} />
                <Route path="/admin/credit-audit" element={<AdminRoute><AdminCreditAudit /></AdminRoute>} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/biblioteca" element={<BibliotecaCientifica />} />
                <Route path="/download" element={<DownloadApp />} />
                <Route path="/monitor-cardiaco" element={<MonitorCardiacoPage />} />
                <Route path="/check-up-rapido" element={<MonitorCardiacoPage />} />
                <Route path="/consultation-monitor/:appointmentId" element={<PrivateRoute><ConsultationMonitorPage /></PrivateRoute>} />
                <Route path="/consultation-monitor" element={<PrivateRoute><ConsultationMonitorPage /></PrivateRoute>} />
                <Route path="/comunidade" element={<ComunidadeConteudoIA />} />
                <Route path="/dashboard" element={<DashboardPaciente />} />
                <Route path="/telemedicina-assincrona" element={<PrivateRoute><TelemedicinaAssincrona /></PrivateRoute>} />
                <Route path="/medico/prontuario" element={<PrivateRoute><ProntuarioInteligente /></PrivateRoute>} />
              <Route path="/relatorio-paciente" element={<PrivateRoute><RelatorioPaciente /></PrivateRoute>} />
              <Route path="/dashboard-medico" element={<PrivateRoute><DashboardMedico /></PrivateRoute>} />
                <Route path="/workspace-medico" element={<PrivateRoute><WorkspaceMedico /></PrivateRoute>} />
                <Route path="/dashboard-afiliado" element={<PrivateRoute><AffiliateDashboard /></PrivateRoute>} />
                <Route path="/afiliados" element={<PrivateRoute><AfiliadosGamificado /></PrivateRoute>} />
                <Route path="/lojistas" element={<PrivateRoute><LojistaDashboard /></PrivateRoute>} />
                <Route path="/agendamento" element={<Agendamento />} />
                <Route path="/prontuario" element={<Prontuario />} />
                <Route path="/dashboard-executivo" element={<DashboardExecutivo />} />
                <Route path="/notificacoes" element={<Notificacoes />} />
                <Route path="/sala-espera" element={<SalaEspera />} />
                <Route path="/orientacao-video" element={<OrientacaoVideo />} />
                <Route path="/consultas" element={<Appointments />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/consulta-video" element={<OrientacaoVideo />} />
                <Route path="/ripd" element={<RIPD />} />
                <Route path="/lgpd" element={<LGPDDireitos />} />
                <Route path="/meus-dados" element={<LGPDDireitos />} />
                <Route path="/compliance" element={<GlobalCompliance />} />
                <Route path="/conformidade-global" element={<GlobalCompliance />} />
                <Route path="/treatment-tracker" element={<TreatmentTracker />} />
                <Route path="/acompanhamento" element={<TreatmentTracker />} />
                <Route path="/dispensario" element={<Dispensario />} />
                <Route path="/produtos-anvisa" element={<ProdutosAnvisa />} />
                <Route path="/iomt" element={<IoMTHub />} />
                <Route path="/dispositivos" element={<IoMTHub />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/dashboard-loja" element={<ShoppingDashboard />} />
                <Route path="/investidores" element={<InvestorDashboard />} />
                <Route path="/videochamada" element={<LegacyVideoCallRedirect />} />
                <Route path="/orientacao-rapida" element={<OrientacaoRapida />} />
                <Route path="/consulta-rapida" element={<OrientacaoRapida />} />
                <Route path="/tratamento-dor-cronica" element={<TratamentoDorCronica />} />
                <Route path="/tratamento-ansiedade-saude-mental" element={<TratamentoAnsiedadeSaudeMental />} />
                <Route path="/tratamentos" element={<SEOCondicoes />} />
                <Route path="/tratamento" element={<SEOCondicoes />} />
                <Route path="/tratamentos/:condicao" element={<SEOCondicoes />} />
                <Route path="/tratamento/:condicao" element={<SEOCondicoes />} />
                <Route path="/club" element={<Club />} />
                <Route path="/deposits" element={<Deposits />} />
                <Route path="/cart-checkout" element={<CartCheckout />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failure" element={<PaymentFailure />} />
                <Route path="/payment/pending" element={<PaymentPending />} />
                <Route path="/cursos" element={<Cursos />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/webinars" element={<Webinars />} />
                <Route path="/voluntarios" element={<Voluntarios />} />
                <Route path="/impacto" element={<ImpactoSocial />} />
                <Route path="/ebook" element={<EbookLanding />} />
                <Route path="/ebook-gratis" element={<EbookLanding />} />
                <Route path="/ebook-medicina-canabinoide" element={<EbookMedicinaCanabinoide />} />
                <Route path="/admin/ebook-analytics" element={<AdminRoute><EbookAnalyticsDashboard /></AdminRoute>} />
                <Route path="/distribuicao-renda" element={<RevenueDistribution />} />
                <Route path="/revenue-distribution" element={<RevenueDistribution />} />
                <Route path="/dashboard/professional" element={<PrivateRoute><ProfessionalDashboard /></PrivateRoute>} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/conquistas" element={<Badges />} />
                <Route path="/admin-master" element={<AdminRoute><AdminMaster /></AdminRoute>} />
                <Route path="/admin/master-control" element={<AdminRoute><AdminMasterControl /></AdminRoute>} />
                <Route path="/admin/bi" element={<AdminRoute><AdminBI /></AdminRoute>} />
                <Route path="/health" element={<AdminRoute><HealthCheck /></AdminRoute>} />
                <Route path="/admin/automations" element={<AdminRoute><AutomationsDashboard /></AdminRoute>} />
                <Route path="/admin/omni-channel" element={<AdminRoute><OmniChannelDashboard /></AdminRoute>} />
                <Route path="/admin/brisa-ceo" element={<AdminRoute><BrisaCEO /></AdminRoute>} />
                <Route path="/admin/brisa" element={<AdminRoute><BrisaCEO /></AdminRoute>} />
                <Route path="/admin/brisa-orientacoes" element={<AdminRoute><BrisaOrientacoes /></AdminRoute>} />
                <Route path="/admin/orientacoes" element={<AdminRoute><BrisaOrientacoes /></AdminRoute>} />
                <Route path="/admin/whatsapp-inbox" element={<AdminRoute><WhatsAppInbox /></AdminRoute>} />
                <Route path="/admin/inbox" element={<AdminRoute><WhatsAppInbox /></AdminRoute>} />
                <Route path="/admin/auditoria-de-crédito" element={<AdminRoute><AdminCreditAudit /></AdminRoute>} />
                <Route path="/admin/audit-log" element={<AdminRoute><AuditLog /></AdminRoute>} />
                <Route path="/admin/auditoria" element={<AdminRoute><AuditLog /></AdminRoute>} />
                <Route path="/admin/cron-health" element={<AdminRoute><CronHealth /></AdminRoute>} />
                <Route path="/admin/remote-commands" element={<AdminRoute><RemoteCommandLog /></AdminRoute>} />
                <Route path="/admin/comandos-remotos" element={<AdminRoute><RemoteCommandLog /></AdminRoute>} />
                <Route path="/admin/infra-services" element={<AdminRoute><InfraServices /></AdminRoute>} />
                <Route path="/admin/pagamentos-externos" element={<AdminRoute><InfraServices /></AdminRoute>} />
                <Route path="/admin/conversoes-uptime" element={<AdminRoute><ConversoesUptime /></AdminRoute>} />
                <Route path="/admin/conversoes" element={<AdminRoute><ConversionsUnified /></AdminRoute>} />
                <Route path="/admin/monitoramento" element={<AdminRoute><AdminMonitoramento /></AdminRoute>} />
                <Route path="/admin/diretoria" element={<AdminRoute><DashboardDiretoria /></AdminRoute>} />
                <Route path="/admin/growth" element={<AdminRoute><GrowthDashboard /></AdminRoute>} />
                <Route path="/admin/leads" element={<AdminRoute><AdminLeads /></AdminRoute>} />
                <Route path="/admin/leads-emergencia" element={<AdminRoute><AdminLeadsEmergencia /></AdminRoute>} />
                <Route path="/admin/cadastros" element={<AdminRoute><CadastrosRealtime /></AdminRoute>} />
                <Route path="/admin/cadastros-tempo-real" element={<AdminRoute><CadastrosRealtime /></AdminRoute>} />
                <Route path="/admin/afiliados" element={<AdminRoute><AdminAfiliados /></AdminRoute>} />
                <Route path="/admin/indicacoes" element={<AdminRoute><AdminIndicacoes /></AdminRoute>} />
                <Route path="/admin/global-ops" element={<AdminRoute><AdminGlobalOps /></AdminRoute>} />
                <Route path="/admin/mapa-global" element={<AdminRoute><AdminGlobalOps /></AdminRoute>} />
                <Route path="/admin/aprovacoes-medicas" element={<AdminRoute><AdminAprovacoes /></AdminRoute>} />
                <Route path="/admin/aprovacoes-farmacias" element={<AdminRoute><AdminAprovacoesFarmacias /></AdminRoute>} />
                <Route path="/admin/kyc-lojas" element={<AdminRoute><AdminAprovacoesFarmacias /></AdminRoute>} />
                <Route path="/admin/aprovacoes-pacientes" element={<AdminRoute><AdminAprovacoesPacientes /></AdminRoute>} />
                <Route path="/admin/kyc-pacientes" element={<AdminRoute><AdminAprovacoesPacientes /></AdminRoute>} />
                <Route path="/admin/medicos-online" element={<AdminRoute><AdminMedicosOnline /></AdminRoute>} />
                <Route path="/admin/medicos" element={<AdminRoute><AdminMedicosOnline /></AdminRoute>} />
                <Route path="/admin/leads/:id" element={<AdminRoute><AdminLeadDetail /></AdminRoute>} />
                <Route path="/oferta-especial" element={<OfertaEspecial />} />
                <Route path="/quiz-triagem" element={<QuizTriagem />} />
                <Route path="/quiz" element={<QuizTriagem />} />
                <Route path="/condicao/:condicao" element={<CondicaoTratamento />} />
                <Route path="/consultorio" element={<PrivateRoute><Consultorio /></PrivateRoute>} />
                <Route path="/configuracoes-medico" element={<PrivateRoute><ConfiguracoesMedico /></PrivateRoute>} />
                <Route path="/atualizar-documentos-medico" element={<PrivateRoute><AtualizarDocumentosMedico /></PrivateRoute>} />
                <Route path="/checkout/fast-track" element={<FastTrackCheckout />} />
                <Route path="/checkout/:token" element={<PrescriptionCheckout />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/afiliados/dashboard" element={<PrivateRoute><AffiliateDashboard /></PrivateRoute>} />
                <Route path="/gestao-pacientes" element={<PrivateRoute><GestaoPacientes /></PrivateRoute>} />
                <Route path="/status" element={<Status />} />
                <Route path="/passaporte/:token" element={<Passaporte />} />
                <Route path="/planos-tratamento" element={<PlanosTratamento />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                {/* ── MÓDULO: CARTÃO SAÚDE VERDE ── */}
                <Route path="/saude-verde" element={<SaudeVerdeLanding />} />
                <Route path="/saude-verde/rede" element={<SaudeVerdeRede />} />
                <Route path="/saude-verde/cartao" element={<PrivateRoute><SaudeVerdeCartao /></PrivateRoute>} />
                <Route path="/saude-verde/agendar" element={<PrivateRoute><SaudeVerdeAgendar /></PrivateRoute>} />
                <Route path="/saude-verde/empresas" element={<SaudeVerdeEmpresas />} />
                <Route path="/saude-verde/seja-parceiro" element={<SaudeVerdeParceiros />} />
                <Route path="/admin/saude-verde" element={<AdminRoute><AdminSaudeVerde /></AdminRoute>} />
                <Route path="/admin/mp-webhooks" element={<AdminRoute><AdminMpWebhooks /></AdminRoute>} />
                <Route path="/saude-verde/assinatura" element={<PrivateRoute><SaudeVerdeAssinatura /></PrivateRoute>} />
                <Route path="/cartao-saude" element={<SaudeVerdeLanding />} />
                <Route path="/desconto-saude" element={<SaudeVerdeLanding />} />
                <Route path="/exames-com-desconto" element={<SaudeVerdeRede />} />
                <Route path="/consultas-com-desconto" element={<SaudeVerdeRede />} />
                <Route path="/medsocio" element={<MedSocio />} />
                                <Route path="/monitoramento" element={<MonitoramentoCSI />} />
<Route path="/monitoramento-saude" element={<MonitoramentoSaude />} />
                <Route path="/meus-exames" element={<MeusExames />} />
                <Route path="/telemed-whatsapp" element={<PrivateRoute><TelemedWhatsApp /></PrivateRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            
            
            {/* Verdinho mobile flutuante removido por solicitação — fica só no menu mobile */}
            {/* WhatsApp Brisa Button */}
            <WhatsAppButton />
            {/* ManyChatWidget removido — Brisa agora é nativa no WhatsAppButton */}
            <MobileBottomNav />
            <CookieConsentBanner />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </CurrencyProvider>
    </LanguageProvider>
    </TenantProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;



