import { useState, useEffect, useCallback } from "react";
import { Menu, X, Leaf, LogIn, LogOut, User, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FrogMascot } from "@/components/FrogMascot";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GlobalComplianceBadge } from "@/components/GlobalComplianceBadge";
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

  const links = [
    { to: "/", label: "Início" },
    { to: "/profissionais", label: "Profissionais" },
    { to: "/telemedicina", label: "Telemedicina" },
    { to: "/shopping", label: "Shopping" },
    { to: "/biblioteca", label: "Biblioteca" },
    { to: "/comunidade", label: "Comunidade" },
    { to: "/dashboard", label: "Meu Painel" },
    { to: "/afiliados", label: "Afiliados" },
    { to: "/planos", label: "Planos" },
  ];

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
        className="fixed top-0 left-0 right-0 glass border-b border-border z-50 will-change-transform sticky-header"
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center h-16 md:h-[72px] justify-between">
            
            {/* Logo + Verdinho (Máximo de Espaço) */}
            <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
              <NavLink to="/" className="flex items-center gap-1.5 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-green flex-shrink-0">
                  <Leaf size={22} className="text-primary-foreground" />
                </div>
                <div className="leading-tight hidden xs:block">
                  <span className="text-sm md:text-lg font-display font-black text-foreground block whitespace-nowrap">
                    Planta <span className="text-gradient-purple">y</span> Raiz
                  </span>
                  <span className="text-[10px] md:text-xs text-muted-foreground font-bold block uppercase tracking-tighter">Mega Clínica Digital</span>
                </div>
              </NavLink>
              
              {/* Espaço Generoso para o Verdinho no Desktop */}
              <div className="hidden md:block ml-4 flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                <FrogMascot size={72} mood="happy" onClick={openChat} enableJumpToNav={true} />
              </div>
            </div>

            {/* Mobile: Iniciar Consulta no Topo + Selo */}
            <div className="flex md:hidden items-center gap-2">
               <Button size="sm" className="bg-secondary text-secondary-foreground font-black rounded-lg text-[10px] h-8 px-2 animate-pulse" asChild>
                <NavLink to="/telemedicina">INICIAR CONSULTA</NavLink>
              </Button>
              <div className="scale-75 origin-right">
                <GlobalComplianceBadge region="br" />
              </div>
            </div>

            {/* Desktop: Menu Alinhado ao Idioma/Login */}
            <div className="hidden xl:flex items-center gap-6">
              <div className="flex items-center gap-3 2xl:gap-5" role="menubar">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="text-[11px] 2xl:text-xs font-black text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap px-1 py-1 uppercase tracking-tight"
                    activeClassName="text-primary border-b-2 border-primary"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="flex items-center gap-3 border-l border-border pl-6">
                <div className="flex flex-col items-center gap-0.5">
                  {user ? (
                    <UserMenu />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="font-bold rounded-xl text-muted-foreground hover:text-foreground gap-1 text-[10px] h-7 px-2" asChild>
                        <NavLink to="/login"><LogIn size={10} /> Login</NavLink>
                      </Button>
                      <Button size="sm" variant="outline" className="font-bold rounded-xl border-primary/30 text-primary text-[10px] h-7 px-2" asChild>
                        <NavLink to="/cadastro">Cadastro</NavLink>
                      </Button>
                    </div>
                  )}
                  <div className="scale-90">
                    <LanguageSwitcher />
                  </div>
                </div>
                
                <Button size="sm" className="bg-secondary text-secondary-foreground font-black rounded-xl text-xs h-10 px-5 hover:scale-105 transition-all shadow-lg shadow-secondary/20" asChild>
                  <NavLink to="/telemedicina">Iniciar Consulta</NavLink>
                </Button>
              </div>
            </div>

            {/* Hamburger Mobile */}
            <div className="xl:hidden flex items-center">
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

      {/* MOBILE MENU OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[55] bg-background/98 backdrop-blur-xl xl:hidden flex flex-col pt-20 pb-8 overflow-y-auto">
          <div className="container mx-auto px-4 flex flex-col flex-1">
            <div className="flex justify-center mb-8">
               <FrogMascot size={120} mood="happy" onClick={openChat} />
            </div>
            <div className="space-y-1 flex-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between py-4 px-4 text-foreground font-black text-lg rounded-xl hover:bg-muted/50"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={20} className="text-primary" />
                </NavLink>
              ))}
            </div>
            <div className="pt-6 border-t border-border mt-4 space-y-4">
              <Button className="w-full bg-secondary text-secondary-foreground font-black rounded-xl h-14 text-lg shadow-xl" asChild>
                <NavLink to="/telemedicina" onClick={() => setIsOpen(false)}>INICIAR CONSULTA AGORA</NavLink>
              </Button>
              <div className="flex flex-col items-center gap-4">
                <LanguageSwitcher />
                <GlobalComplianceBadge variant="hero" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
