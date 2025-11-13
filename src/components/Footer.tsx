import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">Doutor Park</h3>
            <p className="text-muted-foreground mb-4">
              Plataforma completa de telemedicina e gestão de consultório online para médicos modernos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <NavLink to="/solucao" className="text-muted-foreground hover:text-primary transition-colors">
                  Nossa Solução
                </NavLink>
              </li>
              <li>
                <NavLink to="/precos" className="text-muted-foreground hover:text-primary transition-colors">
                  Preços
                </NavLink>
              </li>
              <li>
                <NavLink to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </NavLink>
              </li>
              <li>
                <NavLink to="/contato" className="text-muted-foreground hover:text-primary transition-colors">
                  Contato
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone size={16} className="text-primary" />
                <a href="tel:+5511987131241" className="hover:text-primary transition-colors">
                  (11) 98713-1241
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} className="text-primary" />
                <a href="mailto:drbezerramed@gmail.com" className="hover:text-primary transition-colors">
                  drbezerramed@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin size={16} className="text-primary mt-1" />
                <span>São Paulo, SP - Capital</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <NavLink to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </NavLink>
              </li>
              <li>
                <NavLink to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            © 2025 Doutor Park. Todos os direitos reservados. Criado com{" "}
            <Heart size={16} className="text-red-500 fill-red-500" /> por Dr. Edilson Bezerra
          </p>
        </div>
      </div>
    </footer>
  );
};
