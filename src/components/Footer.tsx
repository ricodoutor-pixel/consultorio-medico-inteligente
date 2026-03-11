import { Leaf, Mail, MapPin, Phone, Heart, Scale } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50" role="contentinfo" aria-label="Rodapé do site">
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
              A maior clínica de telemedicina + Shopping de cannabis medicinal. Democratizando o acesso com segurança e tecnologia IA.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Navegação</h4>
            <ul className="space-y-2">
              {[
                { to: "/telemedicina", label: "Telemedicina" },
                { to: "/profissionais", label: "Profissionais" },
                { to: "/shopping", label: "Shopping" },
                { to: "/biblioteca", label: "Biblioteca" },
                { to: "/afiliados", label: "Afiliados" },
                { to: "/planos", label: "Planos" },
                { to: "/cadastro", label: "Cadastro" },
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
                <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">(11) 98713-1241</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail size={14} className="text-primary" />
                <a href="mailto:drbezerramed@gmail.com" className="hover:text-primary transition-colors">drbezerramed@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin size={14} className="text-primary mt-0.5" />
                <span>São Paulo, SP — Brasil</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">Legal & Compliance</h4>
            <ul className="space-y-2 text-sm">
              <li><NavLink to="/legal" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"><Scale size={12} /> Conformidade & Legal</NavLink></li>
              <li><NavLink to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Serviço</NavLink></li>
              <li><NavLink to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</NavLink></li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              ⚠️ Conteúdo educativo. Prescrição e conduta clínica dependem de avaliação por profissional habilitado.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            © {new Date().getFullYear()} Planta & Raiz. Feito com
            <Link to="/admin-login" className="hover:scale-125 transition-transform" title="Área administrativa">
              <Heart size={14} className="text-destructive fill-destructive cursor-pointer" />
            </Link>
            para quem mais precisa
          </p>
        </div>
      </div>
    </footer>
  );
};
