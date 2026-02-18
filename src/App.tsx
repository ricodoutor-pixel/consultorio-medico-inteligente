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
import CadastroProfissional from "./pages/CadastroProfissional";
import FalarComEspecialista from "./pages/FalarComEspecialista";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/falar-com-especialista" element={<FalarComEspecialista />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
