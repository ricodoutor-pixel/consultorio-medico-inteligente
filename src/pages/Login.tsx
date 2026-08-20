import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const redirectTo = searchParams.get("redirect");

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
        // Check user type to redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, full_name")
          .eq("id", data.user.id)
          .single();

        const name = profile?.full_name || "usuário";
        toast({ title: `Bem-vindo, ${name}! 🌿` });

        // Alerta WhatsApp ao Dr. Edilson — Modo Cadastro Ativado (login)
        supabase.functions
          .invoke("brisa-signup-alert", { body: { user_id: data.user.id, event: "login" } })
          .catch((e) => console.warn("[brisa-signup-alert] login", e));

        // Redirect: prioritize ?redirect= param (only if safe/relative), then role-based default
        const safeRedirect = (() => {
          if (!redirectTo) return null;
          const d = decodeURIComponent(redirectTo);
          return d.startsWith("/") && !d.startsWith("//") ? d : null;
        })();
        const userType = profile?.user_type || "patient";
        
        const { data: doctorData } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
          
        const isDoctor = userType === "doctor" || !!doctorData;

        if (isDoctor) {
          navigate("/consultorio");
        } else if (safeRedirect) {
          navigate(safeRedirect);
        } else {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleData) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha na conexão. Tente novamente.", variant: "destructive" });
    }
    setLoading(false);
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
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 flex justify-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Leaf size={24} className="text-primary" />
              </div>
              <h1 className="text-2xl font-display font-black text-foreground">
                {forgotMode ? "Recuperar Senha" : "Entrar"}
              </h1>
            </div>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground">E-mail</Label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10 bg-muted border-border"
                        required
                      />
                    </div>
                  </div>

                  {!forgotMode && (
                    <div>
                      <Label htmlFor="password" className="text-xs font-bold text-muted-foreground">Senha</Label>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-muted border-border"
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

                  <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold rounded-xl" disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {forgotMode ? "Enviar Link de Recuperação" : "Entrar"}
                    {!loading && <ArrowRight size={16} className="ml-2" />}
                  </Button>

                  {!forgotMode && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="w-full text-center text-xs text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}

                  {forgotMode && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                    >
                      ← Voltar ao login
                    </button>
                  )}
                </form>

                {!forgotMode && (
                  <>
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-card px-2 text-muted-foreground">ou continue com</span></div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full font-bold h-11 rounded-xl border-border"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: "google",
                          options: {
                            redirectTo: `${window.location.origin}${redirectTo ? decodeURIComponent(redirectTo) : "/dashboard"}`,
                          },
                        });
                        if (error) {
                          toast({ title: "Erro com Google", description: "Não foi possível entrar com Google.", variant: "destructive" });
                          setLoading(false);
                        }
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continuar com Google
                    </Button>

                    <div className="mt-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        Não tem conta?{" "}
                        <Link to={redirectTo ? `/cadastro?redirect=${redirectTo}` : "/cadastro"} className="text-primary font-bold hover:underline">
                          Cadastre-se
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Login;
