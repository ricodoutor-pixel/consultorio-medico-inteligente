import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * NAVBAR OTIMIZADA
 * ✅ "Meu Painel" REMOVIDO
 * ✅ Layout limpo e organizado
 * ✅ Responsivo mobile/desktop
 * ✅ Tamanhos otimizados
 */

export function NavbarOptimized() {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Início', href: '/' },
    { label: 'Profissionais', href: '/profissionais' },
    { label: 'Telemedicina', href: '/telemedicina' },
    { label: 'Shopping', href: '/shopping' },
    { label: 'Biblioteca', href: '/biblioteca' },
    { label: 'Comunidade', href: '/comunidade' },
    { label: 'Planos', href: '/planos' }
    // ✅ "Meu Painel" REMOVIDO - Funcionalidades integradas ao ADM
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-green-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 md:w-10 h-8 md:h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-base">🌿</span>
            </div>
            <span className="text-white font-bold text-sm md:text-lg hidden sm:inline">
              Planta & Raiz
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3 lg:px-4 py-2 text-sm lg:text-base text-slate-300 hover:text-green-400 transition-colors rounded-lg hover:bg-slate-700/50"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm lg:text-base text-white hover:text-green-400 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/admin"
              className="px-4 lg:px-6 py-2 lg:py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm lg:text-base"
            >
              ADM
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-slate-700 pt-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block px-4 py-3 text-base text-slate-300 hover:text-green-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-slate-700">
              <Link
                to="/login"
                className="flex-1 px-4 py-3 text-center text-base text-white hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/admin"
                className="flex-1 px-4 py-3 text-center text-base bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                ADM
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
