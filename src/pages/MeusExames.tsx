import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Stethoscope, Smartphone, ChevronRight, LayoutDashboard, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const diagnosticToolsMap: Record<string, { title: string; route: string; icon: any }> = {
  cardiaco: { title: "Monitor Card�aco", route: "/monitoramento", icon: Stethoscope },
  fundoscopia: { title: "Fundo de Olho IA", route: "/monitoramento", icon: Smartphone },
  oximetria: { title: "Oximetria �ptica", route: "/monitoramento", icon: Smartphone },
  dermatoscopia: { title: "Dermatoscopia IA", route: "/monitoramento", icon: Smartphone },
  mobilidade: { title: "Mobilidade Articular", route: "/monitoramento", icon: Smartphone },
  estetoscopio: { title: "Estetosc�pio Digital", route: "/monitoramento", icon: Stethoscope },
  pulmonar: { title: "Ausculta Pulmonar", route: "/monitoramento", icon: Stethoscope },
  tremor: { title: "Tremorometria IA", route: "/monitoramento", icon: Smartphone },
  urine: { title: "Urin�lise IA", route: "/monitoramento", icon: Smartphone },
  acuity: { title: "Acuidade Visual", route: "/monitoramento", icon: Smartphone },
  gps: { title: "Rastreador GPS", route: "/monitoramento", icon: Smartphone },
};

const MeusExames = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }
        
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const profile = data as Record<string, unknown> | null;
        const raw = profile?.purchased_tools;
        if (raw) {
          const pt = Array.isArray(raw) ? raw : JSON.parse((raw as string) || "[]");
          setTools(pt);
        }

      } catch (e) {
        console.error("Error fetching tools", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTools();
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="p-4 flex items-center gap-3 border-b border-border/40 bg-card/50 sticky top-0 z-10 backdrop-blur-md">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/consultorio")}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-display font-black tracking-tight">Hub M�dico</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-black mb-2">Seja bem-vindo</h2>
          <p className="text-muted-foreground text-sm">Escolha o que deseja acessar agora</p>
        </div>

        <Link 
          to="/consultorio" 
          className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-5"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <LayoutDashboard size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black mb-1">Acessar Plataforma Cl�nica</h3>
            <p className="text-xs text-muted-foreground">Telemedicina, Prontu�rios e Consultas</p>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </Link>

        <div className="mt-4">
          <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground mb-4 pl-2">
            ?? Minhas Ferramentas Diagn�sticas
          </h3>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : tools.length === 0 ? (
            <div className="bg-card/40 border border-border/40 rounded-3xl p-8 text-center">
              <Smartphone size={40} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Voc� ainda n�o possui m�dulos de exame.</p>
              <Button onClick={() => navigate("/planos")} className="rounded-2xl font-bold bg-primary text-primary-foreground">
                Explorar Ferramentas
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tools.map(toolId => {
                const toolInfo = diagnosticToolsMap[toolId];
                if (!toolInfo) return null;
                const Icon = toolInfo.icon;
                
                return (
                  <Link 
                    key={toolId}
                    to={toolInfo.route}
                    className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:bg-card/80 transition-colors active:scale-[0.99]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-green text-primary flex items-center justify-center shrink-0 shadow-inner">
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{toolInfo.title}</h4>
                      <p className="text-xs text-muted-foreground">Toque para abrir</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Play size={14} className="ml-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MeusExames;
