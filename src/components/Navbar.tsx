import { useState, useEffect } from "react";
import { Menu, X, Leaf, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FrogMascot } from "@/components/FrogMascot";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    { to: "/indicacoes", label: "Indicações" },
    { to: "/planos", label: "Planos" },
  ];

  const openChat = () => window.dispatchEvent(new Event("open-frog-chat"));

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
    <nav className="fixed top-0 w-full glass border-b border-border z-50" role="navigation" aria-label="Navegação principal">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Verdinho mascot */}
          <div className="flex items-center gap-1 md:gap-2">
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

            <div className="ml-1">
              <FrogMascot
                size={60}
                mood="happy"
                onClick={openChat}
                enableJumpToNav={true}
              />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5" role="menubar">
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

          {/* Desktop auth area */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Button size="sm" variant="ghost" className="font-bold rounded-xl text-muted-foreground hover:text-foreground gap-1.5" asChild>
                  <NavLink to="/login"><LogIn size={16} /> Fazer Login</NavLink>
                </Button>
                <Button size="sm" variant="outline" className="font-bold rounded-xl border-primary/30 text-primary" asChild>
                  <NavLink to="/cadastro">Cadastro</NavLink>
                </Button>
              </>
            )}
            <Button size="sm" className="bg-primary text-primary-foreground font-black rounded-xl" asChild>
              <NavLink to="/telemedicina">Iniciar Consulta</NavLink>
            </Button>
          </div>

          {/* Mobile auth + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            {user ? (
              <UserMenu compact />
            ) : (
              <Button size="sm" variant="ghost" className="font-bold rounded-xl text-muted-foreground hover:text-foreground gap-1.5" asChild>
                <NavLink to="/login"><LogIn size={16} /> Login</NavLink>
              </Button>
            )}
            <button
              className="p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div id="mobile-menu" className="lg:hidden py-4 space-y-3 border-t border-border" role="menu" aria-label="Menu mobile">
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
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                {!user && (
                  <Button variant="outline" className="flex-1 font-bold rounded-xl border-primary/30 text-primary" asChild>
                    <NavLink to="/cadastro" onClick={() => setIsOpen(false)}>Cadastro</NavLink>
                  </Button>
                )}
                <Button className="flex-1 bg-primary text-primary-foreground font-black rounded-xl" asChild>
                  <NavLink to="/telemedicina" onClick={() => setIsOpen(false)}>Consulta</NavLink>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
