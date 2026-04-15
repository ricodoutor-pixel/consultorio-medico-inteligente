import { Leaf, Mail, MapPin, Phone, Heart, Scale, Shield, Facebook, Instagram, Youtube, Download, Share2, Plus, CheckCircle2, MoreVertical, Chrome, Smartphone } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

type ModalType = "ios" | "android" | "desktop" | null;

export const Footer = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const isMobile = useIsMobile();
  const [modalType, setModalType] = useState<ModalType>(null);

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === "ios") setModalType("ios");
    else if (result === "android-manual") setModalType("android");
    else if (result === "desktop-manual") setModalType("desktop");
  };

  const StepItem = ({ step, icon: Icon, text }: { step: number; icon: any; text: string }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm shrink-0">{step}</div>
      <div className="flex items-start gap-2">
        <Icon size={18} className="text-primary shrink-0 mt-0.5" />
        <span className="text-sm text-foreground">{text}</span>
      </div>
    </div>
  );

  const ModalContent = () => {
    if (modalType === "ios") return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-muted-foreground">Para instalar no iPhone/iPad:</p>
        <StepItem step={1} icon={Share2} text="Toque no ícone de Compartilhar" />
        <StepItem step={2} icon={Plus} text='Selecione "Adicionar à Tela de Início"' />
        <StepItem step={3} icon={CheckCircle2} text='Confirme tocando em "Adicionar"' />
      </div>
    );
    if (modalType === "android") return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-muted-foreground">Para instalar no Android:</p>
        <StepItem step={1} icon={MoreVertical} text="Toque nos 3 pontinhos (⋮) no Chrome" />
        <StepItem step={2} icon={Plus} text='Selecione "Adicionar à tela inicial"' />
        <StepItem step={3} icon={CheckCircle2} text='Confirme tocando em "Instalar"' />
      </div>
    );
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-muted-foreground">Para instalar no computador:</p>
        <StepItem step={1} icon={Chrome} text="Abra no Chrome ou Edge" />
        <StepItem step={2} icon={Download} text="Clique no ícone (⊕) na barra de endereço" />
        <StepItem step={3} icon={CheckCircle2} text='Clique em "Instalar"' />
      </div>
    );
  };

  return (
    <footer className="border-t border-border bg-card/50" role="contentinfo" aria-label="Rodapé do site">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <Leaf size={14} className="text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground text-sm md:text-base">Planta y Raiz</span>
            </div>
            <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
              A maior clínica de telemedicina + Shopping de cannabis medicinal. Democratizando o acesso com segurança e tecnologia IA.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-xs md:text-sm">Navegação</h4>
            <ul className="space-y-1.5 md:space-y-2">
              {[
                { to: "/telemedicina", label: "Telemedicina" },
                { to: "/profissionais", label: "Profissionais" },
                { to: "/shopping", label: "Shopping" },
                { to: "/biblioteca", label: "Biblioteca" },
                { to: "/tratamento-ansiedade-saude-mental", label: "Ansiedade & Sono" },
                { to: "/afiliados", label: "Afiliados" },
                { to: "/planos", label: "Planos" },
                { to: "/cadastro", label: "Cadastro" },
              ].map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div itemScope itemType="https://schema.org/LocalBusiness">
            <h4 className="font-semibold text-foreground mb-3 text-xs md:text-sm">Contato</h4>
            <ul className="space-y-2 md:space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm">
                <Phone size={12} className="text-primary shrink-0" />
                <a href="tel:+5511991363154" className="hover:text-primary transition-colors" itemProp="telephone">(11) 99136-3154</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm">
                <Mail size={12} className="text-primary shrink-0" />
                <a href="mailto:contato@plantayraiz.com.br" className="hover:text-primary transition-colors break-all" itemProp="email">contato@plantayraiz.com.br</a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-xs md:text-sm">
                <MapPin size={12} className="text-primary mt-0.5 shrink-0" />
                <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                  <span itemProp="streetAddress">Av. Paulista, 1000 — Bela Vista</span><br />
                  <span itemProp="addressLocality">São Paulo</span>, <span itemProp="addressRegion">SP</span> — Brasil
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-xs md:text-sm">Legal & Compliance</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li><NavLink to="/legal" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"><Scale size={10} /> Conformidade & Legal</NavLink></li>
              <li><NavLink to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Serviço</NavLink></li>
              <li><NavLink to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</NavLink></li>
            </ul>
            <p className="mt-3 text-[10px] md:text-xs text-muted-foreground leading-relaxed">
              ⚠️ Conteúdo educativo. Prescrição e conduta clínica dependem de avaliação por profissional habilitado.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border mt-6 md:mt-8 pt-5 md:pt-6 text-center">
          <p className="text-muted-foreground text-xs md:text-sm mb-4 md:mb-6">
            Suporte 24/7: <a href="mailto:contato@plantayraiz.com.br" className="hover:text-primary transition-colors">contato@plantayraiz.com.br</a> | <a href="tel:+5511991363154" className="hover:text-primary transition-colors">+55 11 99136-3154</a>
          </p>

          {/* LGPD + ANVISA Badges */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 md:mb-6">
            <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2 hover:border-primary/40 hover:shadow-md transition-all duration-300 group" title="Lei Geral de Proteção de Dados">
              <Shield size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-[10px] md:text-xs font-bold text-foreground leading-tight">LGPD</span>
                <span className="block text-[8px] md:text-[10px] text-muted-foreground leading-tight">Compliant</span>
              </div>
            </a>
            <a href="https://www.gov.br/anvisa/pt-br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-2 hover:border-primary/40 hover:shadow-md transition-all duration-300 group" title="Agência Nacional de Vigilância Sanitária">
              <svg viewBox="0 0 32 32" className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" fill="none">
                <path d="M16 2L4 8v8c0 7.73 5.12 14.96 12 17 6.88-2.04 12-9.27 12-17V8L16 2z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
                <path d="M12 16h8M16 12v8M10 10l12 12M22 10L10 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              </svg>
              <div className="text-left">
                <span className="block text-[10px] md:text-xs font-bold text-foreground leading-tight">ANVISA</span>
                <span className="block text-[8px] md:text-[10px] text-muted-foreground leading-tight">Regular</span>
              </div>
            </a>
          </div>

          {/* Baixe nosso App */}
          {!isInstalled && (
            <div className="flex justify-center mb-4 md:mb-6">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
              >
                <Download size={12} className="group-hover:scale-110 transition-transform" />
                <span>Baixe nosso App</span>
              </button>
            </div>
          )}

          {/* Social Media */}
          <div className="mb-4 md:mb-6">
            <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">Nossas Redes e Recursos</h4>
            <div className="flex items-center justify-center gap-3">
              <a href="https://www.facebook.com/plantayraiz" target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300" aria-label="Facebook">
                <Facebook size={16} className="md:hidden" /><Facebook size={20} className="hidden md:block" />
              </a>
              <a href="https://www.instagram.com/plantayraiz" target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300" aria-label="Instagram">
                <Instagram size={16} className="md:hidden" /><Instagram size={20} className="hidden md:block" />
              </a>
              <a href="https://www.youtube.com/@plantayraiz" target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300" aria-label="YouTube">
                <Youtube size={16} className="md:hidden" /><Youtube size={20} className="hidden md:block" />
              </a>
              <a href="https://www.google.com/search?q=Planta+y+Raiz+telemedicina+cannabis" target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-card border border-border flex items-center justify-center hover:scale-110 hover:shadow-lg hover:border-primary/40 transition-all duration-300" aria-label="Pesquisar no Google" title="Acessar Recursos Externos">
                <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom links */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">
            <NavLink to="/legal" className="hover:text-primary transition-colors">Quem Somos</NavLink>
            <span>|</span>
            <NavLink to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</NavLink>
            <span>|</span>
            <NavLink to="/termos" className="hover:text-primary transition-colors">Termos de Uso</NavLink>
          </div>

          <p className="text-muted-foreground text-xs md:text-sm flex items-center justify-center gap-1.5 flex-wrap">
            © {new Date().getFullYear()} Planta y Raiz. Todos os direitos reservados. Feito com
            <Link to="/admin-login" className="hover:scale-125 transition-transform" title="Área administrativa">
              <Heart size={12} className="text-destructive fill-destructive cursor-pointer" />
            </Link>
            para quem mais precisa
          </p>
          <Link to="/admin/automations" className="inline-block mt-2 text-[0px] leading-none opacity-0 hover:opacity-5" aria-hidden="true" tabIndex={-1}>·</Link>
        </div>
      </div>

      {/* Install Instructions Modal */}
      {isMobile ? (
        <Sheet open={modalType !== null} onOpenChange={(open) => !open && setModalType(null)}>
          <SheetContent className="px-4 pb-8">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-foreground">
                <Smartphone size={20} className="text-primary" />
                Instalar Planta y Raiz
              </SheetTitle>
            </SheetHeader>
            <ModalContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={modalType !== null} onOpenChange={(open) => !open && setModalType(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Smartphone size={20} className="text-primary" />
                Instalar Planta y Raiz
              </DialogTitle>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </footer>
  );
};
