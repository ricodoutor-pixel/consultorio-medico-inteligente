import { Home, Search, ShieldCheck, Calendar, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AccountMenu } from "@/components/AccountMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Search, label: "Quiz", path: "/quiz" },
  { icon: Calendar, label: "Agendar", path: "/agendamento" },
  { icon: ShieldCheck, label: "Produtos", path: "/shopping" },
  { icon: User, label: "Perfil", path: "/dashboard" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlansRoute = location.pathname === "/planos" || location.pathname === "/precos";

  // Hide on video call / admin pages
  const hiddenPaths = ["/consulta-video", "/videochamada", "/admin"];
  if (isPlansRoute || hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom,0px)] xl:hidden">


      <div className="grid grid-cols-5 items-center h-16 px-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          if (label === "Perfil") return <div key={path} className="h-full min-w-0"><AccountMenu bottom /></div>;
          return (
            <Button variant="ghost"
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-full h-full px-1 min-w-0 rounded-none transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none truncate max-w-full">{label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
