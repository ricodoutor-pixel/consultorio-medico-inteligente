import { Leaf, Mail, MapPin, Phone, Heart } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <Leaf size={16} className="text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Planta & Raiz</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Democratizando o acesso a terapias e medicamentos à base de cannabis medicinal com segurança, profissionalismo e preço justo.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Navegação</h4>
            <ul className="space-y-2">
              {[
                { to: "/como-funciona", label: "Como Funciona" },
                { to: "/profissionais", label: "Profissionais" },
                { to: "/marketplace", label: "Marketplace" },
                { to: "/planos", label: "Planos" },
                { to: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone size={14} className="text-primary" />
                <a href="tel:+5511987131241" className="hover:text-primary transition-colors">(11) 98713-1241</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail size={14} className="text-primary" />
                <a href="mailto:drbezerramed@gmail.com" className="hover:text-primary transition-colors">drbezerramed@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin size={14} className="text-primary mt-0.5" />
                <span>São Paulo, SP</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</NavLink></li>
              <li><NavLink to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</NavLink></li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Conteúdo informativo. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            © {new Date().getFullYear()} Planta & Raiz. Feito com
            <Heart size={14} className="text-destructive fill-destructive" />
          </p>
        </div>
      </div>
    </footer>
  );
};
