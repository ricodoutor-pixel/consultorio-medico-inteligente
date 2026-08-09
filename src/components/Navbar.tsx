import { useState, useEffect, useCallback } from "react";
import { Menu, X, Leaf, LogIn, LogOut, User, ChevronRight, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FrogMascot } from "@/components/FrogMascot";

import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GlobalComplianceBadge } from "@/components/GlobalComplianceBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string; fullName?: string; avatarUrl?: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isDenseCatalogRoute = location.pathname.startsWith("/biblioteca");
  const showNavbarMascot = !(isDenseCatalogRoute && isMobile);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .maybeSingle();

        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: profile?.full_name || session.user.email?.split("@")[0] || "Usuário",
          avatarUrl: profile?.avatar_url || undefined,
        });
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .maybeSingle();

        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: profile?.full_name || session.user.email?.split("@")[0] || "Usuário",
          avatarUrl: profile?.avatar_url || undefined,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const primaryLinks = [
    { to: "/", label: "Início" },
    { to: "/profissionais", label: "Profissionais" },
    { to: "/telemedicina", label: "Telemedicina" },
    { to: "/monitoramento-saude", label: "Monitoramento" },
    { to: "/shopping", label: "Shopping" },
    { to: "/planos", label: "Planos" },
  ];

  // Links secundários agrupados em "Mais"
  const secondaryLinks = [
    { to: "/saude-verde", label: "Saúde Verde" },
    { to: "/biblioteca", label: "Biblioteca" },
    { to: "/nossa-historia", label: "Nossa História" },
    { to: "/comunidade", label: "Comunidade" },
    { to: "/planos-tratamento", label: "Tratamento" },
    { to: "/afiliados", label: "Afiliados" },
    { to: "/dashboard", label: "Meu Painel" },
  ];

  // União para o menu mobile (mostra tudo, sem duplicar Monitoramento)
  const links = [...primaryLinks, ...secondaryLinks];

  const openChat = useCallback(() => window.dispatchEvent(new Event("open-frog-chat")), []);

  const UserMenu = ({ compact = false }: { compact?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2 font-bold rounded-xl text-muted-foreground hover:text-foreground">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {getInitials(user?.fullName || "U")}
            </AvatarFallback>
          </Avatar>
          {!compact && <span className="max-w-[120px] truncate">{user?.fullName}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2 cursor-pointer">
          <User size={14} /> Meu Painel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
          <LogOut size={14} /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <nav
        className={isDenseCatalogRoute
          ? "fixed top-0 left-0 right-0 border-b border-border z-50 will-change-transform sticky-header bg-background/95"
          : "fixed top-0 left-0 right-0 glass border-b border-border z-50 will-change-transform sticky-header"
        }
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center h-16 md:h-[72px] justify-between">
            
            {/* Logo + Verdinho */}
            <div className="flex items-center gap-1.5 md:gap-3.5 lg:gap-4 flex-shrink-0 -ml-1 md:-ml-3 lg:-ml-4">
              <NavLink to="/" aria-label="Planta y Raíz - Início" className="flex items-center gap-2 md:gap-3">
                <img
                  src="/logo-planta-raiz.webp"
                  alt="Planta y Raíz - Mega Clínica Digital"
                  width={520}
                  height={190}
                  {...({ fetchpriority: "high" } as Record<string, string>)}
                  loading="eager"
                  decoding="sync"
                  className="h-[62px] md:h-[74px] w-auto max-w-[210px] md:max-w-[260px] object-contain object-left drop-shadow-[0_0_14px_rgba(34,197,94,0.25)]"
                />
              </NavLink>




            </div>

            {/* Desktop: Verdinho exatamente no meio entre o logo e o menu */}
            <div className={`hidden ${showNavbarMascot ? "lg:flex" : ""} flex-1 items-center justify-center`}>
              <div className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                <FrogMascot size={72} mood="happy" onClick={openChat} enableJumpToNav={true} />
              </div>
            </div>

            {/* Desktop: Menu Centralizado (aparece a partir de lg = 1024px) */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 justify-end">
              <div className="flex items-center gap-1 xl:gap-2" role="menubar">
                {primaryLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="text-[13px] xl:text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors whitespace-nowrap px-3 py-2 rounded-lg tracking-tight"
                    activeClassName="text-primary bg-primary/10"
                  >
                    {link.label}
                  </NavLink>
                ))}

                {/* Dropdown "Mais" — agrupa links secundários */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-[13px] xl:text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors whitespace-nowrap px-3 py-2 rounded-lg tracking-tight">
                      Mais <ChevronDown size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {secondaryLinks.map((link) => (
                      <DropdownMenuItem key={link.to} asChild className="cursor-pointer">
                        <Link to={link.to} className="font-semibold text-sm">
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
                <div className="hidden xl:block scale-90">
                  <LanguageSwitcher />
                </div>

                {/* Botão CTA principal — vivo, brilhante, com ícone */}
                <Button
                  size="sm"
                  className="relative overflow-hidden bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_100%] animate-[shine_3s_linear_infinite] text-secondary-foreground font-black rounded-xl text-sm h-10 px-5 hover:scale-105 transition-all shadow-lg shadow-secondary/50 ring-2 ring-secondary/30 hover:ring-secondary/60"
                  asChild
                >
                  <NavLink to="/telemedicina">
                    <span className="mr-1.5">🩺</span> Consulta
                  </NavLink>
                </Button>


                {user ? (
                  <UserMenu compact />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="font-bold rounded-xl text-muted-foreground hover:text-foreground gap-1 text-xs h-9 px-3" asChild>
                      <NavLink to="/login"><LogIn size={14} /> Login</NavLink>
                    </Button>
                    <Button size="sm" variant="outline" className="hidden xl:inline-flex font-bold rounded-xl border-primary/40 text-primary text-xs h-9 px-3" asChild>
                      <NavLink to="/cadastro">Cadastro</NavLink>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions (até lg) */}
            <div className="lg:hidden flex items-center gap-2">
               <Button size="sm" className="bg-secondary text-secondary-foreground font-black rounded-lg text-[10px] h-8 px-2 animate-pulse shadow-lg shadow-secondary/40" asChild>
                <NavLink to="/telemedicina">CONSULTA</NavLink>
              </Button>
              <button
                className="p-2 text-foreground flex-shrink-0 relative z-[60]"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY - Embutido e Padronizado */}
      <div 
        className={`fixed inset-0 z-[55] bg-background/98 backdrop-blur-xl lg:hidden flex flex-col pt-[env(safe-area-inset-top,20px)] pb-[env(safe-area-inset-bottom,20px)] overflow-y-auto transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto translate-x-0" : "opacity-0 pointer-events-none translate-x-full"
        }`}
      >
        <div className="container mx-auto px-4 flex flex-col flex-1">
          {/* Botão seta para sair do menu mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm mb-4 self-start p-2 -ml-2 rounded-xl hover:bg-muted/50 transition active:scale-95"
            aria-label="Fechar menu"
          >
            <ArrowLeft size={22} className="text-primary" />
            <span>Voltar</span>
          </button>

          {/* Verdinho dentro do menu mobile */}
          <div className="flex justify-center mb-6 relative" style={{ minHeight: 180 }}>
            <FrogMascot size={81} mood="happy" onClick={() => { setIsOpen(false); openChat(); }} enableJumpToNav={false} />
          </div>


          <div className="grid grid-cols-1 gap-1 flex-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex items-center justify-between py-3 px-4 text-foreground font-black text-base md:text-lg rounded-xl hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                onClick={() => setIsOpen(false)}
              >
                <span className="tracking-tight uppercase">{link.label}</span>
                <ChevronRight size={18} className="text-primary/50" />
              </NavLink>
            ))}
          </div>
          <div className="pt-6 border-t border-border mt-4 space-y-4">
            {user ? (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl mb-3">
                <UserMenu compact={false} />
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <Button variant="outline" className="flex-1 font-bold rounded-xl border-primary/30 text-primary" asChild>
                  <NavLink to="/login" onClick={() => setIsOpen(false)}>
                    <LogIn size={16} className="mr-1" /> Login
                  </NavLink>
                </Button>
                <Button className="flex-1 font-bold rounded-xl bg-primary text-primary-foreground" asChild>
                  <NavLink to="/cadastro" onClick={() => setIsOpen(false)}>Cadastro</NavLink>
                </Button>
              </div>
            )}
            <Button className="w-full bg-secondary text-secondary-foreground font-black rounded-xl h-14 text-lg shadow-xl" asChild>
              <NavLink to="/telemedicina" onClick={() => setIsOpen(false)}>INICIAR CONSULTA AGORA</NavLink>
            </Button>
            <div className="flex flex-col items-center gap-4">
              <LanguageSwitcher />
              <GlobalComplianceBadge />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
