import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FrogChatModal } from "./components/FrogChatModal";
import { ShoppingCart } from "./components/ShoppingCart";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useCart } from "@/store/cart";
import { AccessibilitySkipLink } from "@/components/AccessibilitySkipLink";
import MascotVerdinho from "@/components/MascotVerdinho";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { OpenGraphHead } from "@/components/OpenGraphHead";
import { SearchEngineOptimization } from "@/components/SearchEngineOptimization";
import { DynamicSEOHead } from "@/components/DynamicSEOHead";
import { LocalCTABanner } from "@/components/LocalCTABanner";

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

// Code splitting - lazy load all routes
const Index = lazy(() => import("./pages/Index"));
const ComoFunciona = lazy(() => import("./pages/ComoFunciona"));
const Profissionais = lazy(() => import("./pages/Profissionais"));
const Shopping = lazy(() => import("./pages/Shopping"));
const Precos = lazy(() => import("./pages/Precos"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contato = lazy(() => import("./pages/Contato"));
const Pay = lazy(() => import("./pages/Pay"));
const Carteira = lazy(() => import("./pages/Carteira"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const BibliotecaCientifica = lazy(() => import("./pages/BibliotecaCientifica"));
const CadastroProfissional = lazy(() => import("./pages/CadastroProfissional"));
const FalarComEspecialista = lazy(() => import("./pages/FalarComEspecialista"));
const Legal = lazy(() => import("./pages/Legal"));
const Indicacoes = lazy(() => import("./pages/Indicacoes"));
const Telemedicina = lazy(() => import("./pages/Telemedicina"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ConsultationPayment = lazy(() => import("./pages/ConsultationPayment"));
const SpecialistDashboard = lazy(() => import("./pages/SpecialistDashboard"));
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const OnlineUsers = lazy(() => import("./pages/OnlineUsers"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const DashboardPaciente = lazy(() => import("./pages/DashboardPaciente"));
const Agendamento = lazy(() => import("./pages/Agendamento"));
const Prontuario = lazy(() => import("./pages/Prontuario"));
const DashboardMedico = lazy(() => import("./pages/DashboardMedico"));
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const SalaEspera = lazy(() => import("./pages/SalaEspera"));
const ConsultaVideo = lazy(() => import("./pages/ConsultaVideo"));
const RIPD = lazy(() => import("./pages/RIPD"));
const LGPDDireitos = lazy(() => import("./pages/LGPDDireitos"));
const GlobalCompliance = lazy(() => import("./pages/GlobalCompliance"));
const TreatmentTracker = lazy(() => import("./pages/TreatmentTracker"));
const Dispensario = lazy(() => import("./pages/Dispensario"));
const IoMTHub = lazy(() => import("./pages/IoMTHub"));
const Blog = lazy(() => import("./pages/Blog"));
const ShoppingDashboard = lazy(() => import("./pages/ShoppingDashboard"));
const InvestorDashboard = lazy(() => import("./pages/InvestorDashboard"));
const VideoCall = lazy(() => import("./pages/VideoCall"));
const ConsultaRapida = lazy(() => import("./pages/ConsultaRapida"));
const SEOCondicoes = lazy(() => import("./pages/SEOCondicoes"));
const TratamentoDorCronica = lazy(() => import("./pages/TratamentoDorCronica"));
const Club = lazy(() => import("./pages/Club"));
const Deposits = lazy(() => import("./pages/Deposits"));
const CartCheckout = lazy(() => import("./pages/CartCheckout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const Cursos = lazy(() => import("./pages/Cursos"));
const Forum = lazy(() => import("./pages/Forum"));
const Webinars = lazy(() => import("./pages/Webinars"));
const Voluntarios = lazy(() => import("./pages/Voluntarios"));
const ImpactoSocial = lazy(() => import("./pages/ImpactoSocial"));
const EbookLanding = lazy(() => import("./pages/EbookLanding"));
const EbookMedicinaCanabinoide = lazy(() => import("./pages/EbookMedicinaCanabinoide"));
const EbookAnalyticsDashboard = lazy(() => import("./pages/EbookAnalyticsDashboard"));
const RevenueDistribution = lazy(() => import("./pages/RevenueDistribution"));
const ProfessionalDashboard = lazy(() => import("./pages/ProfessionalDashboard"));
const AdminMaster = lazy(() => import("./pages/AdminMaster"));
const Badges = lazy(() => import("./pages/Badges"));
const HealthCheck = lazy(() => import("./pages/HealthCheck"));
const AutomationsDashboard = lazy(() => import("./pages/AutomationsDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OpenGraphHead />
            <SearchEngineOptimization />
            <DynamicSEOHead />
            <LocalCTABanner />
            <AccessibilitySkipLink />
            <FrogChatModal />
            <ShoppingCart />
            <Suspense fallback={<Loading />}>
              <main id="main-content" role="main">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/como-funciona" element={<ComoFunciona />} />
                <Route path="/profissionais" element={<Profissionais />} />
                <Route path="/profissionais/:id" element={<Profissionais />} />
                <Route path="/shopping" element={<Shopping />} />
                <Route path="/shopping/:id" element={<Shopping />} />
                <Route path="/planos" element={<Precos />} />
                <Route path="/precos" element={<Precos />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/pay" element={<Pay />} />
                <Route path="/carteira" element={<Carteira />} />
                <Route path="/cadastro-profissional" element={<CadastroProfissional />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/falar-com-especialista" element={<FalarComEspecialista />} />
                <Route path="/telemedicina" element={<Telemedicina />} />
                <Route path="/afiliados" element={<Indicacoes />} />
                <Route path="/indicacoes" element={<Indicacoes />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/termos" element={<Legal />} />
                <Route path="/privacidade" element={<Legal />} />
                <Route path="/pagamento" element={<ConsultationPayment />} />
                <Route path="/dashboard-especialista" element={<SpecialistDashboard />} />
                <Route path="/influenciadores" element={<InfluencerDashboard />} />
                <Route path="/usuarios-online" element={<OnlineUsers />} />
                <Route path="/admin-ceo" element={<AdminDashboard />} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/biblioteca" element={<BibliotecaCientifica />} />
                <Route path="/download" element={<DownloadApp />} />
                <Route path="/comunidade" element={<Comunidade />} />
                <Route path="/dashboard" element={<DashboardPaciente />} />
                <Route path="/agendamento" element={<Agendamento />} />
                <Route path="/prontuario" element={<Prontuario />} />
                <Route path="/dashboard-medico" element={<DashboardMedico />} />
                <Route path="/dashboard-executivo" element={<DashboardExecutivo />} />
                <Route path="/notificacoes" element={<Notificacoes />} />
                <Route path="/sala-espera" element={<SalaEspera />} />
                <Route path="/consulta-video" element={<ConsultaVideo />} />
                <Route path="/ripd" element={<RIPD />} />
                <Route path="/lgpd" element={<LGPDDireitos />} />
                <Route path="/meus-dados" element={<LGPDDireitos />} />
                <Route path="/compliance" element={<GlobalCompliance />} />
                <Route path="/conformidade-global" element={<GlobalCompliance />} />
                <Route path="/treatment-tracker" element={<TreatmentTracker />} />
                <Route path="/acompanhamento" element={<TreatmentTracker />} />
                <Route path="/dispensario" element={<Dispensario />} />
                <Route path="/iomt" element={<IoMTHub />} />
                <Route path="/dispositivos" element={<IoMTHub />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/dashboard-loja" element={<ShoppingDashboard />} />
                <Route path="/investidores" element={<InvestorDashboard />} />
                <Route path="/videochamada" element={<VideoCall />} />
                <Route path="/consulta-rapida" element={<ConsultaRapida />} />
                <Route path="/tratamento-dor-cronica" element={<TratamentoDorCronica />} />
                <Route path="/tratamentos" element={<SEOCondicoes />} />
                <Route path="/tratamentos/:condicao" element={<SEOCondicoes />} />
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
                <Route path="/health" element={<AdminRoute><HealthCheck /></AdminRoute>} />
                <Route path="/admin/automations" element={<AdminRoute><AutomationsDashboard /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            
            
            {/* Mascote Verdinho removido — presente apenas na Navbar */}
            {/* WhatsApp Brisa Button */}
            <WhatsAppButton />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
