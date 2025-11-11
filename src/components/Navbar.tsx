import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">Doutor Park</div>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/solucao"
              className="text-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Solução
            </NavLink>
            <NavLink
              to="/precos"
              className="text-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Preços
            </NavLink>
            <NavLink
              to="/faq"
              className="text-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              FAQ
            </NavLink>
            <NavLink
              to="/contato"
              className="text-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Contato
            </NavLink>
            <Button variant="default" asChild>
              <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
                Teste Grátis 30 Dias
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <NavLink
              to="/solucao"
              className="block py-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Solução
            </NavLink>
            <NavLink
              to="/precos"
              className="block py-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Preços
            </NavLink>
            <NavLink
              to="/faq"
              className="block py-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </NavLink>
            <NavLink
              to="/contato"
              className="block py-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contato
            </NavLink>
            <Button variant="default" className="w-full" asChild>
              <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
                Teste Grátis 30 Dias
              </a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
