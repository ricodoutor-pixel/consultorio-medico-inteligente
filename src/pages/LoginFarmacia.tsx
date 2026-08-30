import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const LoginFarmacia = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const redirectTo = searchParams.get("redirect") || "/lojistas";

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
        toast({ title: "Login realizado com sucesso! 🏪" });
        
        // Always redirect pharmacies to the lojistas dashboard
        navigate(redirectTo);
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
                <Store size={24} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-display font-black text-foreground">
                {forgotMode ? "Recuperar Senha" : "Portal do Lojista"}
              </h1>
            </div>

            <Card className="border-border bg-card shadow-2xl shadow-emerald-900/10">
              <CardContent className="p-6">
                <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground">E-mail Comercial</Label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contato@suafarmacia.com.br"
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

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl" disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {forgotMode ? "Enviar Link de Recuperação" : "Acessar Dashboard"}
                    {!loading && <ArrowRight size={16} className="ml-2" />}
                  </Button>

                  {!forgotMode && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="w-full text-center text-xs text-emerald-500 hover:underline"
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
                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Ainda não é um parceiro?{" "}
                      <Link to="/cadastro-farmacia" className="text-emerald-500 font-bold hover:underline">
                        Cadastrar Farmácia
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
};

export default LoginFarmacia;
