import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EdgeFunctionStatusGrid } from "@/components/admin/EdgeFunctionStatusGrid";
import { SocialAnalyticsModule } from "@/components/admin/SocialAnalyticsModule";
import { VisitorTrackingModule } from "@/components/admin/VisitorTrackingModule";
import { TokenManagerModule } from "@/components/admin/TokenManagerModule";
import { GrowthLoopsModule } from "@/components/admin/GrowthLoopsModule";
import { AutomationManagerModule } from "@/components/admin/AutomationManagerModule";
import { ClickHeatmapModule } from "@/components/admin/ClickHeatmapModule";
import { BrisaReportsModule } from "@/components/admin/BrisaReportsModule";
import { Activity, BarChart3, Globe, Key, Shield, LogOut, Zap, Bot, Flame, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const OmniChannelDashboard = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        if (data) {
          setAuthenticated(true);
        }
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("Acesso restrito. Faça login com uma conta de administrador.");
    navigate("/login");
  };

  if (checking) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-lg font-semibold text-slate-200">Omni-Channel Control</h1>
            <p className="text-xs text-slate-500 mt-1">Dashboard de Automação — Acesso Restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="password"
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-600 h-10"
              autoFocus
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-sm">
              Acessar Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">Omni-Channel Control Center</h1>
              <p className="text-[10px] text-slate-500">Planta & Raiz — 100 Automações Ativas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAuthenticated(false); navigate("/"); }}
              className="text-slate-500 hover:text-slate-300 h-7 text-xs"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto p-4 space-y-6">
        <EdgeFunctionStatusGrid />

        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-0.5 flex-wrap h-auto">
            <TabsTrigger value="growth" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-1.5">
              <Zap className="w-3 h-3" /> Growth Loops
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-1.5">
              <Bot className="w-3 h-3" /> Automações (100)
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-1.5">
              <BarChart3 className="w-3 h-3" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-1.5">
              <Flame className="w-3 h-3" /> Heatmap
            </TabsTrigger>
            <TabsTrigger value="visitors" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-1.5">
              <Globe className="w-3 h-3" /> Visitantes
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-1.5">
              <Key className="w-3 h-3" /> Tokens & IDs
            </TabsTrigger>
            <TabsTrigger value="brisa" className="text-xs data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 gap-1.5">
              <Brain className="w-3 h-3" /> Relatórios da Brisa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <GrowthLoopsModule />
          </TabsContent>

          <TabsContent value="automations">
            <AutomationManagerModule />
          </TabsContent>

          <TabsContent value="analytics">
            <SocialAnalyticsModule />
          </TabsContent>

          <TabsContent value="heatmap">
            <ClickHeatmapModule />
          </TabsContent>

          <TabsContent value="visitors">
            <VisitorTrackingModule />
          </TabsContent>

          <TabsContent value="tokens">
            <TokenManagerModule />
          </TabsContent>

          <TabsContent value="brisa">
            <BrisaReportsModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OmniChannelDashboard;
