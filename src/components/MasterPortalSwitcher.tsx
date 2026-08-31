import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isMasterAdminEmail } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  KeyRound, 
  User, 
  Stethoscope, 
  Store, 
  ShieldAlert, 
  ChevronRight, 
  X,
  Truck
} from "lucide-react";

export function MasterPortalSwitcher() {
  const [isMaster, setIsMaster] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && isMasterAdminEmail(user.email)) {
        setIsMaster(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMasterAdminEmail(session.user.email)) {
        setIsMaster(true);
      } else {
        setIsMaster(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isMaster) return null;

  const currentPath = location.pathname;

  const portals = [
    { name: "Paciente", path: "/dashboard-paciente", icon: User, color: "text-emerald-400" },
    { name: "Médico", path: "/workspace-medico", icon: Stethoscope, color: "text-sky-400" },
    { name: "Farmácia", path: "/lojistas", icon: Store, color: "text-amber-400" },
    { name: "Admin", path: "/admin", icon: ShieldAlert, color: "text-purple-400" },
    { name: "Entregador GPS", path: "/entregador", icon: Truck, color: "text-cyan-400" }
  ];

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 left-4 z-50 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 hover:scale-105 transition-all text-xs font-bold"
        title="Abrir Seletor Chave Mestra"
      >
        <KeyRound size={16} className="text-emerald-400 animate-pulse" />
        <span>Chave Mestra</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-card/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center gap-1.5 flex-wrap max-w-lg">
      <div className="flex items-center gap-1.5 pl-1 pr-2 border-r border-border/50">
        <KeyRound size={15} className="text-emerald-400 animate-pulse" />
        <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Chave Mestra</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {portals.map((p) => {
          const isActive = currentPath === p.path || (p.path === "/dashboard-paciente" && currentPath === "/prontuario");
          const Icon = p.icon;

          return (
            <Button
              key={p.path}
              size="sm"
              variant={isActive ? "default" : "ghost"}
              onClick={() => navigate(p.path)}
              className={`h-7 px-2 text-[11px] rounded-xl font-bold flex items-center gap-1 ${
                isActive 
                  ? "bg-emerald-600 text-white" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={12} className={isActive ? "text-white" : p.color} />
              {p.name}
            </Button>
          );
        })}
      </div>

      <button
        onClick={() => setMinimized(true)}
        className="text-muted-foreground hover:text-foreground p-1 rounded-lg ml-1"
        title="Minimizar"
      >
        <X size={13} />
      </button>
    </div>
  );
}
