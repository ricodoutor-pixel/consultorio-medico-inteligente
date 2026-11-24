import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { reportAccessError } from "@/lib/auth-access";
import { withAccessTimeout } from "@/lib/auth-access-errors";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a recovery session
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValidSession(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await withAccessTimeout(supabase.auth.updateUser({ password }));
      if (error) {
        toast({ title: "Erro", description: reportAccessError(error, "paciente", "update_password"), variant: "destructive" });
      } else {
        setSuccess(true);
        toast({ title: "Senha atualizada! ✅" });
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      toast({ title: "Erro", description: reportAccessError(error, "paciente", "update_password"), variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (!validSession) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-32 pb-20 flex justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Link inválido ou expirado.</p>
            <Button className="mt-4" onClick={() => navigate("/login")}>Voltar ao Login</Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-32 pb-20 flex justify-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center">
            <CheckCircle2 size={64} className="text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-black text-foreground">Senha Atualizada!</h2>
            <p className="text-muted-foreground mt-2">Redirecionando para o login...</p>
          </motion.div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-28 pb-20 hero-glow">
        <div className="container mx-auto px-4 flex justify-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="w-full max-w-md">
            <h1 className="text-2xl font-display font-black text-foreground text-center mb-6">Nova Senha</h1>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Nova senha</Label>
                    <div className="relative mt-1">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10 pr-10 bg-muted border-border"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">Confirmar senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="bg-muted border-border"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold rounded-xl" disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Atualizar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResetPassword;
