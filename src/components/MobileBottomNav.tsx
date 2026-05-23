import { Home, Search, ShoppingBag, Calendar, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Search, label: "Quiz", path: "/quiz" },
  { icon: Calendar, label: "Agendar", path: "/agendamento" },
  { icon: ShoppingBag, label: "Loja", path: "/shopping" },
  { icon: User, label: "Perfil", path: "/dashboard" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDenseCatalogRoute = location.pathname.startsWith("/biblioteca");
  const isPlansRoute = location.pathname === "/planos" || location.pathname === "/precos";

  // Hide on video call / admin pages
  const hiddenPaths = ["/consulta-video", "/videochamada", "/admin"];
  if (isPlansRoute || hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t border-border pb-[env(safe-area-inset-bottom,0px)]",
      isDenseCatalogRoute ? "bg-background/95" : "bg-black/95 backdrop-blur-xl"
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
