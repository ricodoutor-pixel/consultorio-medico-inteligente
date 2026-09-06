import { Leaf, Instagram, MessageCircle, Lock, ShieldCheck, Download, Youtube, Linkedin, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { AnvisaBadge } from "@/components/AnvisaBadge";
import { EmergencyWebChat } from "@/components/EmergencyWebChat";

export const Footer = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

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
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <a href="https://www.instagram.com/plantayraizltda/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="Instagram">
                <Instagram size={14} />
              </a>
              <a href="https://www.linkedin.com/company/plantayraiz/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="LinkedIn — Planta y Raiz">
                <Linkedin size={14} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61572129577082" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://wa.me/5511991363154" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="WhatsApp">
                <MessageCircle size={14} />
              </a>
              <a href="https://www.youtube.com/channel/UC_Azx7mmS0_edjCxv4MXQ1Q" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200" aria-label="Canal no YouTube — Planta y Raiz">
                <Youtube size={14} />
              </a>
            </div>
          </div>

          {/* Jurídica & Propriedade Intelectual */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Jurídico & Propriedade Intelectual</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/reembolso" className="text-muted-foreground hover:text-primary transition-colors">Política de Reembolso</Link></li>
            </ul>
            <div className="pt-2 text-[10px] text-muted-foreground/70 leading-relaxed space-y-1">
              <p>Razão Social: Bezerra Med Soluções Integradas Ltda.</p>
              <p>CNPJ: 30.740.319/0001-14</p>
              <p>Nome fantasia: Planta y Raiz — Mega Clínica Digital</p>
              <p>CNAE 6209-1/00 — Intermediação digital em saúde.</p>
              <div className="pt-1.5 border-t border-border/40 space-y-0.5 text-foreground/80 font-medium">
                <p>• <strong>Software no INPI:</strong> Proc. nº 512026007103-8 (Lei nº 9.609/1998 — Proteção de Código-Fonte e IA)</p>
                <p>• <strong>Marca Registrada:</strong> PLANTA Y RAÍZ — Proc. INPI nº 944933084 (Classe NCL 44 - Serviços Médicos e Telemedicina)</p>
              </div>
            </div>
          </div>

          {/* Médica / Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Compliance Médico</h4>
            <div className="text-[10px] text-muted-foreground/70 leading-relaxed space-y-1">
              <p className="text-xs text-muted-foreground">Supervisora Técnica: Dra. Suelen Naves Rodrigues (CRM 49354/PR)</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1 max-w-[260px]">
              O conteúdo deste site é informativo. A prescrição de terapias canabinoides depende de avaliação médica individual do profissional prescritor cadastrado.
            </p>
          </div>

          {/* Selos de Segurança & Conformidade */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Segurança & Conformidade</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-muted-foreground/80">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span className="text-[10px] font-medium">Prontuário com Integridade Criptográfica (SHA-512)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/70">
                <ShieldCheck size={14} className="text-primary/70 shrink-0" />
                <span className="text-[10px]">Pagamento Seguro via Mercado Pago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/70">
                <Lock size={14} className="text-primary/70 shrink-0" />
                <span className="text-[10px]">Site Protegido (SSL 256-bit)</span>
              </div>
              <div className="pt-1">
                <AnvisaBadge registration="RDC 660/2022" />
              </div>
              <Link
                to="/produtos-anvisa"
                className="block text-[10px] text-muted-foreground/70 hover:text-primary transition-colors"
              >
                Produtos & Conformidade ANVISA →
              </Link>
            </div>
            <div className="pt-2">
              <EmergencyWebChat />
            </div>
          </div>
        </div>

        {/* Disclaimer Legal — Intermediação Tecnológica */}
        <div className="border-t border-border/30 mt-8 pt-5">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              <strong className="text-foreground">Disclaimer Legal — Intermediação Tecnológica:</strong>{" "}
              A Planta y Raiz atua estritamente como plataforma de tecnologia e intermediação em saúde digital.
              A <strong>Bezerra Med Soluções Integradas Ltda.</strong> (CNPJ: 30.740.319/0001-14),
              operando sob o nome fantasia <strong>Planta y Raiz</strong>, não possui vínculo com a produção,
              fabricação, comercialização, distribuição ou entrega de produtos farmacêuticos ou
              fitoterápicos. Não realizamos vendas diretas nem detemos posse ou propriedade dos
              produtos. Toda a responsabilidade técnica pelo ato médico é do profissional
              prescritor cadastrado (supervisão técnica: Dra. Suelen Naves Rodrigues (CRM 49354/PR)),
              e a responsabilidade pela qualidade, entrega, eficácia e efeitos dos produtos é
              exclusiva das farmácias e importadoras parceiras devidamente licenciadas pela ANVISA.
            </p>
          </div>
        </div>

        {/* Bottom bar — heart admin à esquerda, evita sobreposição com FAB Brisa e MobileBottomNav */}
        <div className="border-t border-border/30 mt-8 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted-foreground/50">
          <div className="flex items-center gap-3 order-2 sm:order-1">
            {/* Porta oculta de administração — clicar no coração leva ao /admin (proteção de role aplicada na rota) */}
            <Link
              to="/admin"
              className="opacity-30 hover:opacity-100 hover:text-primary transition-all shrink-0"
              aria-label="Acesso administrativo"
              title="Feito com ❤️"
            >
              <Heart size={12} className="inline-block" fill="currentColor" />
            </Link>
            <span className="opacity-70">© {new Date().getFullYear()} Bezerra Med Soluções Integradas Ltda - CNPJ: 30.740.319/0001-14. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-3 order-1 sm:order-2 flex-wrap justify-center">
            {canInstall && !isInstalled && (
              <>
                <button
                  onClick={() => promptInstall()}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Download size={10} />
                  Instalar App
                </button>
                <span>·</span>
              </>
            )}
            <Link to="/confianca" className="hover:text-primary transition-colors">Central de Confiança</Link>
            <span>·</span>
            <Link to="/legal" className="hover:text-primary transition-colors">Conformidade</Link>
            <span>·</span>
            <Link to="/afiliados" className="hover:text-primary transition-colors">Afiliados</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
