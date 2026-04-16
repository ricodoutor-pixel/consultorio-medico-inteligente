import { Leaf, Instagram, MessageCircle, Lock, ShieldCheck, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background" role="contentinfo" aria-label="Rodapé do site">
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Institucional */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf size={16} className="text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground text-sm tracking-tight">Planta y Raiz</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[240px]">
              Inovação e acolhimento em saúde canabinoide.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="https://www.instagram.com/plantayraiz" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="Instagram">
                <Instagram size={14} />
              </a>
              <a href="https://wa.me/5511991363154" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="WhatsApp">
                <MessageCircle size={14} />
              </a>
            </div>
          </div>

          {/* Jurídica */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Jurídico</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/reembolso" className="text-muted-foreground hover:text-primary transition-colors">Política de Reembolso</Link></li>
            </ul>
            <div className="pt-2 text-[10px] text-muted-foreground/70 leading-relaxed space-y-0.5">
              <p>CNPJ: [Pendente de registro]</p>
              <p>Razão Social: Planta y Raiz Saúde Digital Ltda.</p>
            </div>
          </div>

          {/* Médica / Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Compliance Médico</h4>
            <div className="text-[10px] text-muted-foreground/70 leading-relaxed space-y-1">
              <p className="text-xs text-muted-foreground">Diretor Técnico: Dr. Edilson Bezerra</p>
              <p>CRM: 10963 — Bolívia</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1 max-w-[260px]">
              O conteúdo deste site é informativo. A prescrição de terapias canabinoides depende de avaliação médica individual.
            </p>
          </div>

          {/* Selos */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Segurança</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <ShieldCheck size={14} className="text-primary/60 shrink-0" />
                <span className="text-[10px]">Pagamento Seguro via Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <Lock size={14} className="text-primary/60 shrink-0" />
                <span className="text-[10px]">Site Protegido (SSL)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted-foreground/50">
          <p>© {new Date().getFullYear()} Planta y Raiz. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <Link to="/legal" className="hover:text-primary transition-colors">Conformidade</Link>
            <span>·</span>
            <Link to="/afiliados" className="hover:text-primary transition-colors">Afiliados</Link>
            <span>·</span>
            <Link to="/admin-login" className="opacity-0 hover:opacity-10 transition-opacity" tabIndex={-1} aria-hidden="true">·</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
