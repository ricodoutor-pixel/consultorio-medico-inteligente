import { useState } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: "/como-funciona", label: "Como Funciona" },
    { to: "/profissionais", label: "Profissionais" },
    { to: "/shopping", label: "Shopping" },
    { to: "/planos", label: "Planos" },
    { to: "/faq", label: "FAQ" },
    { to: "/contato", label: "Contato" },
  ];

  return (
    <nav className="fixed top-0 w-full glass border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center glow-green">
              <Leaf size={20} className="text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-display font-bold text-foreground block">
                Planta <span className="text-gradient-gold">&</span> Raiz
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">Democratizando o acesso</span>
            </div>
          </NavLink>

          <div className="hidden lg:flex items-center gap-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-bold"
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold" asChild>
              <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20começar%20na%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
                Começar Agora
              </a>
            </Button>
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Abrir menu de navegação"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 space-y-3 border-t border-border">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors font-semibold text-sm"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold" asChild>
              <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20começar%20na%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
                Começar Agora
              </a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
