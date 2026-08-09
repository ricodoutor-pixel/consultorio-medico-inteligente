import { useState, useEffect } from 'react';
import { Menu, X, Leaf, LogIn, LogOut, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FrogMascot } from '@/components/FrogMascot';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GlobalComplianceBadge } from '@/components/GlobalComplianceBadge';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Navbar Responsivo Otimizado
 * Conformidade: Responsividade Mobile, Desktop, Tablet
 * Elementos: Logo, Menu, Idiomas, CTA, Mascote
 */

export const ResponsiveNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fechar menu ao navegar
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Controlar overflow do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Navbar Desktop */}
      <nav className="hidden md:flex items-center justify-between bg-white shadow-md px-6 py-4 sticky top-0 z-40">
        {/* Logo e Título */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href="/">
            <div className="w-48 md:w-64 h-12 md:h-16 relative flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.jpg" 
                alt="Planta y Raíz - Mega Clínica Digital" 
                className="absolute w-full h-full object-contain mix-blend-screen brightness-75 contrast-150 scale-[1.8] md:scale-[2.2]"
              />
            </div>
          </a>
        </div>

        {/* Menu Central */}
        <div className="hidden lg:flex items-center gap-8 flex-1 justify-center mx-8">
          <a href="/" className="text-gray-700 hover:text-green-600 font-medium transition">
            Início
          </a>
          <a href="/nossa-historia" className="text-gray-700 hover:text-green-600 font-medium transition">
            Nossa História
          </a>
          <a href="/consultas" className="text-gray-700 hover:text-green-600 font-medium transition">
            Orientações Técnicas
          </a>
          <a href="/profissionais" className="text-gray-700 hover:text-green-600 font-medium transition">
            Médicos
          </a>
        </div>

        {/* Espaço para Mascote Removido */}

        {/* Direita: Idiomas e CTA */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <LanguageSwitcher />
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            onClick={() => navigate('/consulta')}
          >
            🩺 Iniciar Orientação Técnica
          </Button>
          <Button variant="ghost" size="sm">
            <LogIn className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Navbar Mobile */}
      <nav className="md:hidden bg-white shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="/">
              <div className="w-48 h-12 relative flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.jpg" 
                  alt="Planta y Raíz - Mega Clínica Digital" 
                  className="absolute w-full h-full object-contain mix-blend-screen brightness-75 contrast-150 scale-[1.8]"
                />
              </div>
            </a>
          </div>

          {/* CTA Fixo em Mobile */}
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
            onClick={() => navigate('/consulta')}
          >
            🩺 Orientação Técnica
          </Button>

          {/* Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Menu Expandido Mobile */}
        {isOpen && (
          <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-4">
            {/* Mascote Removido */}

            {/* Links do Menu */}
            <a href="/" className="block text-gray-700 hover:text-green-600 font-medium py-2">
              Início
            </a>
            <a href="/nossa-historia" className="block text-gray-700 hover:text-green-600 font-medium py-2">
              Nossa História
            </a>
            <a href="/consultas" className="block text-gray-700 hover:text-green-600 font-medium py-2">
              Orientações Técnicas
            </a>
            <a href="/profissionais" className="block text-gray-700 hover:text-green-600 font-medium py-2">
              Médicos
            </a>

            {/* Divisor */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {/* Idiomas */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Idioma:</span>
                <LanguageSwitcher />
              </div>

              {/* Botões de Ação */}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-2"
                onClick={() => navigate('/login')}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 font-semibold"
                onClick={() => navigate('/cadastro')}
              >
                Criar Conta
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Compliance Badge */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 flex items-center justify-center gap-2">
        <GlobalComplianceBadge />
        <span className="text-xs text-gray-600 font-medium">
          Plataforma Popular-Saúde-Shopping | Conformidade: ANVISA | CFM | LGPD
        </span>
      </div>
    </>
  );
};

export default ResponsiveNavbar;
