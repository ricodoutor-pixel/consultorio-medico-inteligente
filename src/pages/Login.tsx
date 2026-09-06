import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Loader2, 
  Store, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  Sparkles,
  KeyRound,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isMasterAdminEmail } from "@/lib/admin-auth";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

type PortalType = "paciente" | "medico" | "farmacia" | "admin";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectTo = searchParams.get("redirect");
  const initialType = (searchParams.get("type") || (redirectTo?.includes("lojista") || redirectTo?.includes("farmacia") ? "farmacia" : redirectTo?.includes("medico") || redirectTo?.includes("consultorio") ? "medico" : redirectTo?.includes("admin") ? "admin" : "paciente")) as PortalType;

  const [selectedPortal, setSelectedPortal] = useState<PortalType>(initialType);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const isMaster = isMasterAdminEmail(email);

  useEffect(() => {
    if (searchParams.get("type")) {
      const t = searchParams.get("type") as PortalType;
      if (["paciente", "medico", "farmacia", "admin"].includes(t)) {
        setSelectedPortal(t);
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast({ title: "E-mail não verificado", description: "Verifique seu e-mail antes de fazer login.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao entrar", description: "E-mail ou senha incorretos.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const userEmail = data.user.email || email;
        const isMasterUser = isMasterAdminEmail(userEmail);

        // Fetch user profile
        const { data: profile } = await (supabase
          .from("profiles") as any)
          .select("user_type, full_name, company_name")
          .eq("id", data.user.id)
          .maybeSingle();

        const name = profile?.full_name || profile?.company_name || userEmail.split("@")[0];

        // Safe redirect handling
        const safeRedirect = (() => {
          if (!redirectTo) return null;
          const d = decodeURIComponent(redirectTo);
          return d.startsWith("/") && !d.startsWith("//") ? d : null;
        })();

        // ── 1. ACESSO CHAVE MESTRA (contato@plantayraiz.com.br / Admins) ──
        if (isMasterUser) {
          toast({
            title: `🔑 Chave Mestra Ativada! Bem-vindo, ${name}`,
            description: `Acesso total concedido ao portal: ${selectedPortal.toUpperCase()}`
          });

          if (safeRedirect) {
            navigate(safeRedirect);
            return;
          }

          if (selectedPortal === "paciente") {
            navigate("/dashboard-paciente");
          } else if (selectedPortal === "medico") {
            navigate("/workspace-medico");
          } else if (selectedPortal === "farmacia") {
            navigate("/lojistas");
          } else if (selectedPortal === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard-paciente");
          }
          return;
        }

        // ── 2. ACESSO DE USUÁRIO REGULAR ──
        const userType = profile?.user_type || "patient";

        // Check if user is a registered doctor
        const { data: doctorData } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        const isDoctor = userType === "doctor" || !!doctorData;
        const isVendor = userType === "vendor" || userType === "lojista" || userType === "dispensario";

        // Check if user is an admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isAdmin = !!roleData;

        // Se o usuário selecionou um portal e tem permissão para ele:
        if (selectedPortal === "medico") {
          if (isDoctor) {
            toast({ title: `Bem-vindo ao Consultório, Dr(a). ${name}! 🩺` });
            navigate(safeRedirect || "/workspace-medico");
          } else {
            toast({
              title: "Acesso Não Permitido",
              description: "Você não possui cadastro médico ativo. Redirecionando para seu portal...",
              variant: "destructive"
            });
            navigate(isVendor ? "/lojistas" : "/dashboard-paciente");
          }
          return;
        }

        if (selectedPortal === "farmacia") {
          if (isVendor) {
            toast({ title: `Bem-vindo ao Portal da Farmácia! 🏪` });
            navigate(safeRedirect || "/lojistas");
          } else {
            toast({
              title: "Acesso Não Permitido",
              description: "Você não possui cadastro de farmácia/lojista. Redirecionando para seu portal...",
              variant: "destructive"
            });
            navigate(isDoctor ? "/workspace-medico" : "/dashboard-paciente");
          }
          return;
        }

        if (selectedPortal === "admin") {
          if (isAdmin) {
            toast({ title: `Painel Administrativo Autorizado 🛡️` });
            navigate(safeRedirect || "/admin");
          } else {
            toast({
              title: "Acesso Negado",
              description: "Esta conta não possui privilégios de administrador.",
              variant: "destructive"
            });
            navigate(isDoctor ? "/workspace-medico" : isVendor ? "/lojistas" : "/dashboard-paciente");
          }
          return;
        }

        // Portal Paciente (padrão)
        toast({ title: `Bem-vindo, ${name}! 🌿` });
        navigate(safeRedirect || "/dashboard-paciente");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha na conexão. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Informe o e-mail", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado! 📧", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setForgotMode(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />

      <section className="flex-1 pt-24 pb-16 md:pt-32 flex items-center justify-center">
        <div className="container mx-auto px-4 flex justify-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="w-full max-w-md">
            
            {/* Cabeçalho */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/30 border border-emerald-500/40 flex items-center justify-center shadow-xl mb-3">
                {selectedPortal === "paciente" && <User size={28} className="text-emerald-400" />}
                {selectedPortal === "medico" && <Stethoscope size={28} className="text-sky-400" />}
                {selectedPortal === "farmacia" && <Store size={28} className="text-amber-400" />}
                {selectedPortal === "admin" && <ShieldAlert size={28} className="text-purple-400" />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground">
                {forgotMode 
                  ? "Recuperar Senha" 
                  : selectedPortal === "paciente" ? "Portal do Paciente"
                  : selectedPortal === "medico" ? "Consultório Médico"
                  : selectedPortal === "farmacia" ? "Portal da Farmácia / Lojista"
                  : "Painel Administrativo"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Acesse sua conta na plataforma Planta y Raíz
              </p>
            </div>

            {/* SELETOR DE PORTAL (4 PERFIS) */}
            {!forgotMode && (
              <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-muted/60 border border-border rounded-2xl mb-5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setSelectedPortal("paciente")}
                  className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition-all flex flex-col items-center gap-1 ${
                    selectedPortal === "paciente"
                      ? "bg-card text-emerald-400 shadow-md border border-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User size={14} /> Paciente
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPortal("medico")}
                  className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition-all flex flex-col items-center gap-1 ${
                    selectedPortal === "medico"
                      ? "bg-card text-sky-400 shadow-md border border-sky-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Stethoscope size={14} /> Médico
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPortal("farmacia")}
                  className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition-all flex flex-col items-center gap-1 ${
                    selectedPortal === "farmacia"
                      ? "bg-card text-amber-400 shadow-md border border-amber-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Store size={14} /> Farmácia
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPortal("admin")}
                  className={`py-2 px-1 text-center rounded-xl font-bold text-[11px] transition-all flex flex-col items-center gap-1 ${
                    selectedPortal === "admin"
                      ? "bg-card text-purple-400 shadow-md border border-purple-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldAlert size={14} /> Admin
                </button>
              </div>
            )}

            {/* Aviso de Chave Mestra quando digitar contato@plantayraiz.com.br */}
            {isMaster && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-pulse">
                <span className="flex items-center gap-1.5 font-bold">
                  <KeyRound size={14} className="text-emerald-400" /> Chave Mestra Ativa
                </span>
                <span className="text-[10px] text-muted-foreground">Acesso Universal a Todos os Portais</span>
              </div>
            )}

            {/* Formulário de Login */}
            <Card className="border-border bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl">
              <CardContent className="p-6">
                <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground">
                      E-mail de Acesso
                    </Label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10 bg-muted border-border rounded-xl text-xs h-10"
                        required
                      />
                    </div>
                  </div>

                  {!forgotMode && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-bold text-muted-foreground">Senha</Label>
                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          className="text-[11px] text-emerald-400 hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-muted border-border rounded-xl text-xs h-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-11 text-xs shadow-lg shadow-emerald-950/20" 
                    disabled={loading}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {forgotMode ? "Enviar Link de Recuperação" : `Entrar no Portal ${selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)}`}
                    {!loading && <ArrowRight size={16} className="ml-2" />}
                  </Button>

                  {forgotMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-xs font-bold text-muted-foreground"
                      onClick={() => setForgotMode(false)}
                    >
                      Voltar ao Login
                    </Button>
                  )}
                </form>

                {/* Atalho para Cadastro */}
                {!forgotMode && (
                  <div className="mt-6 pt-4 border-t border-border/50 text-center">
                    <p className="text-xs text-muted-foreground">
                      Ainda não tem conta?{" "}
                      <Link 
                        to={selectedPortal === "medico" ? "/cadastro-profissional" : selectedPortal === "farmacia" ? "/cadastro-farmacia" : "/cadastro"} 
                        className="text-emerald-400 font-bold hover:underline"
                      >
                        Cadastre-se como {selectedPortal}
                      </Link>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
