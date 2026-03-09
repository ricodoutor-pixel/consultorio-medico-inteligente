import { useState } from "react";
import { Menu, X, Leaf, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FrogMascot } from "@/components/FrogMascot";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: "/", label: "Início" },
    { to: "/profissionais", label: "Profissionais" },
    { to: "/telemedicina", label: "Telemedicina" },
    { to: "/shopping", label: "Shopping" },
    { to: "/biblioteca", label: "Biblioteca" },
    { to: "/comunidade", label: "Comunidade" },
    { to: "/dashboard", label: "Meu Painel" },
    { to: "/planos", label: "Planos" },
  ];

  const openChat = () => window.dispatchEvent(new Event("open-frog-chat"));

  return (
    <nav className="fixed top-0 w-full glass border-b border-border z-50" role="navigation" aria-label="Navegação principal">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Verdinho mascot */}
          <div className="flex items-center gap-1 md:gap-2">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-green">
                <Leaf size={20} className="text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <span className="text-sm font-display font-black text-foreground block">
                  Planta <span className="text-gradient-purple">&</span> Raiz
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">Mega Clínica Digital</span>
              </div>
            </NavLink>

            {/* Verdinho mascot - next to logo, jumps along navbar */}
            <div className="ml-1">
              <FrogMascot
                size={60}
                mood="happy"
                onClick={openChat}
                enableJumpToNav={true}
              />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5" role="menubar">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-black"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Button size="sm" variant="outline" className="font-bold rounded-xl border-primary/30 text-primary" asChild>
              <NavLink to="/cadastro">Cadastro</NavLink>
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-black rounded-xl" asChild>
              <NavLink to="/telemedicina">Iniciar Consulta</NavLink>
            </Button>
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div id="mobile-menu" className="lg:hidden py-4 space-y-3 border-t border-border" role="menu" aria-label="Menu mobile">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 font-bold rounded-xl border-primary/30 text-primary" asChild>
                <NavLink to="/cadastro" onClick={() => setIsOpen(false)}>Cadastro</NavLink>
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground font-black rounded-xl" asChild>
                <NavLink to="/telemedicina" onClick={() => setIsOpen(false)}>Consulta</NavLink>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
