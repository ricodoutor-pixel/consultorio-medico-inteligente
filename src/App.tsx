import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FrogChatModal } from "./components/FrogChatModal";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AdminRoute } from "@/components/AdminRoute";

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
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const DashboardPaciente = lazy(() => import("./pages/DashboardPaciente"));
const Agendamento = lazy(() => import("./pages/Agendamento"));
const Prontuario = lazy(() => import("./pages/Prontuario"));
const DashboardMedico = lazy(() => import("./pages/DashboardMedico"));
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FrogChatModal />
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
                <Route path="/indicacoes" element={<Indicacoes />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/termos" element={<Legal />} />
                <Route path="/privacidade" element={<Legal />} />
                <Route path="/pagamento" element={<ConsultationPayment />} />
                <Route path="/dashboard-especialista" element={<SpecialistDashboard />} />
                <Route path="/influenciadores" element={<InfluencerDashboard />} />
                <Route path="/usuarios-online" element={<OnlineUsers />} />
                <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
