import { useState } from "react";
import { Menu, X, Leaf } from "lucide-react";
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
    { to: "/indicacoes", label: "Indicações" },
    { to: "/planos", label: "Planos" },
    { to: "/influenciadores", label: "Influencers" },
  ];

  const openChat = () => {
    const event = new CustomEvent("open-frog-chat");
    window.dispatchEvent(event);
  };

  return (
    <nav className="fixed top-0 w-full glass border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
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
            <FrogMascot onClick={openChat} size={30} />
          </div>

          <div className="hidden lg:flex items-center gap-5">
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
