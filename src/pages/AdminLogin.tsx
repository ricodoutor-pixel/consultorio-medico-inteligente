import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { verifyAndEnsureAdmin } from "@/lib/admin-auth";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        toast({ title: "Acesso negado", description: "Credenciais inválidas.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check and ensure admin role
      const isAdmin = await verifyAndEnsureAdmin(data.user);

      if (isAdmin) {
        toast({ title: "Acesso autorizado", description: "Bem-vindo ao painel administrativo." });
        navigate("/admin");
      } else {
        toast({ title: "Acesso negado", description: "Você não tem permissão de administrador.", variant: "destructive" });
        await supabase.auth.signOut();
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao conectar. Tente novamente.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-32 pb-20 hero-glow">
        <div className="container mx-auto px-4 flex justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <Card className="border-border">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-gold border border-gold flex items-center justify-center glow-gold">
                    <Shield size={24} className="text-[hsl(45,76%,52%)]" />
                  </div>
                  <div>
                    <h1 className="font-display font-black text-xl text-foreground">Admin</h1>
                    <p className="text-xs text-muted-foreground">Acesso restrito — RBAC</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-bold text-foreground">E-mail</Label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@plantaeraiz.com"
                        className="pl-10 bg-muted border-border"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm font-bold text-foreground">Senha</Label>
                    <div className="relative mt-1">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 bg-muted border-border"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-black h-12 bg-primary text-primary-foreground rounded-xl" disabled={loading}>
                    {loading ? "Verificando..." : "Entrar"}
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

export default AdminLogin;
