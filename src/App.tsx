import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import ComoFunciona from "./pages/ComoFunciona";
import Profissionais from "./pages/Profissionais";
import Shopping from "./pages/Shopping";
import Precos from "./pages/Precos";
import FAQ from "./pages/FAQ";
import Contato from "./pages/Contato";
import Pay from "./pages/Pay";
import Carteira from "./pages/Carteira";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import BibliotecaCientifica from "./pages/BibliotecaCientifica";
import CadastroProfissional from "./pages/CadastroProfissional";
import FalarComEspecialista from "./pages/FalarComEspecialista";
import Legal from "./pages/Legal";
import Indicacoes from "./pages/Indicacoes";
import Telemedicina from "./pages/Telemedicina";
import Cadastro from "./pages/Cadastro";
import ConsultationPayment from "./pages/ConsultationPayment";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import OnlineUsers from "./pages/OnlineUsers";
import DownloadApp from "./pages/DownloadApp";
import Comunidade from "./pages/Comunidade";
import DashboardPaciente from "./pages/DashboardPaciente";
import NotFound from "./pages/NotFound";
import { FrogChatModal } from "./components/FrogChatModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FrogChatModal />
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/biblioteca" element={<BibliotecaCientifica />} />
          <Route path="/download" element={<DownloadApp />} />
          <Route path="/comunidade" element={<Comunidade />} />
          <Route path="/dashboard" element={<DashboardPaciente />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
