import { useState, useEffect, useCallback } from "react";
import { Menu, X, Leaf, LogIn, LogOut, User, ChevronRight } from "lucide-react";
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

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
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
    { to: "/blog", label: "Blog" },
    { to: "/iomt", label: "IoMT Hub" },
    { to: "/dashboard-loja", label: "Lojista" },
    { to: "/investidores", label: "Investidores" },
    { to: "/dashboard", label: "Meu Painel" },
    { to: "/afiliados", label: "Afiliados" },
    { to: "/planos", label: "Planos" },
  ];

  const openChat = useCallback(() => window.dispatchEvent(new Event("open-frog-chat")), []);

  const closeMenu = useCallback(() => setIsOpen(false), []);

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
        className="fixed top-0 left-0 right-0 w-full glass border-b border-border z-50 will-change-transform"
        role="navigation"
        aria-label="Navegação principal"
        style={{ WebkitBackfaceVisibility: "hidden", position: "sticky" as any }}
      >
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-10 2xl:px-16 max-w-[100vw]">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* Logo + Verdinho */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 min-w-0">
              <NavLink to="/" className="flex items-center gap-1.5 md:gap-2 min-w-0">
                <img src="/src/assets/verdinho-doctor.png" alt="Logo Planta y Raiz" className="w-10 h-10 object-contain glow-green flex-shrink-0" />
                <div className="leading-tight hidden xs:block min-w-0">
                  <span className="text-xs md:text-sm font-display font-black text-foreground block whitespace-nowrap truncate max-w-[120px] sm:max-w-none">
                    Planta <span className="text-gradient-purple">&</span> Raiz
                  </span>
                  <span className="text-[9px] md:text-[10px] text-muted-foreground font-semibold block">Mega Clínica Digital</span>
                </div>
              </NavLink>
              <div className="ml-0.5 md:ml-1 flex-shrink-0">
                <FrogMascot size={48} mood="happy" onClick={openChat} enableJumpToNav={true} />
              </div>
            </div>

            {/* Desktop Links */}
            <div className="hidden xl:flex items-center gap-1 2xl:gap-3 flex-shrink min-w-0" role="menubar">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-xs 2xl:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap px-1.5 2xl:px-2 py-1"
                  activeClassName="text-primary font-black"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden xl:flex items-center gap-1.5 flex-shrink-0">
              <GlobalComplianceBadge />
              <LanguageSwitcher />
              {user ? (
                <UserMenu />
              ) : (
                <>
                  <Button size="sm" variant="ghost" className="font-bold rounded-xl text-muted-foreground hover:text-foreground gap-1.5 text-xs h-9 px-3" asChild>
                    <NavLink to="/login"><LogIn size={14} /> Fazer Login</NavLink>
                  </Button>
                  <Button size="sm" variant="outline" className="font-bold rounded-xl border-primary/30 text-primary text-xs h-9 px-3" asChild>
                    <NavLink to="/cadastro">Cadastro</NavLink>
                  </Button>
                </>
              )}
              <Button size="sm" className="bg-primary text-primary-foreground font-black rounded-xl text-xs h-9 px-4" asChild>
                <NavLink to="/telemedicina">Iniciar Consulta</NavLink>
              </Button>
            </div>

            {/* Mobile Auth + Hamburger */}
            <div className="xl:hidden flex items-center gap-1 flex-shrink-0">
              <Button size="sm" className="bg-primary text-primary-foreground font-black rounded-xl text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3" asChild>
                <NavLink to="/telemedicina">Consulta</NavLink>
              </Button>
              {user ? (
                <UserMenu compact />
              ) : (
                <Button size="sm" variant="ghost" className="font-bold rounded-xl text-muted-foreground hover:text-foreground gap-1 text-xs h-9 px-2" asChild>
                  <NavLink to="/login"><LogIn size={14} /></NavLink>
                </Button>
              )}
              <button
                className="p-2 text-foreground flex-shrink-0 relative z-[60]"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE FULLSCREEN OVERLAY MENU ── */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[55] bg-background/98 backdrop-blur-xl xl:hidden flex flex-col pt-20 pb-8 overflow-y-auto"
          role="menu"
          aria-label="Menu mobile"
        >
          <div className="container mx-auto px-4 flex flex-col flex-1">
            {/* Navigation Links */}
            <div className="space-y-1 flex-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between py-3.5 px-4 text-foreground hover:text-primary transition-colors font-bold text-base rounded-xl hover:bg-muted/50 group"
                  activeClassName="text-primary bg-primary/5"
                  onClick={closeMenu}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </NavLink>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-6 border-t border-border mt-4">
              {!user && (
                <Button variant="outline" className="w-full font-bold rounded-xl border-primary/30 text-primary h-12 text-sm" asChild>
                  <NavLink to="/cadastro" onClick={closeMenu}>Cadastre-se Grátis</NavLink>
                </Button>
              )}
              <Button className="w-full bg-primary text-primary-foreground font-black rounded-xl h-12 text-sm" asChild>
                <NavLink to="/telemedicina" onClick={closeMenu}>Iniciar Consulta</NavLink>
              </Button>
              <div className="flex items-center justify-center gap-3 pt-2">
                <GlobalComplianceBadge />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
