import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gift, Copy, QrCode, Users, DollarSign, TrendingUp, Medal, Share2, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const referralCode = "PLANTA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
const referralLink = `https://plantaeraiz.com.br/cadastro?ref=${referralCode}`;

const leaderboard = [
  { pos: 1, name: "Ana C.", indicacoes: 47, ganhos: "R$ 1.410", badge: "🥇" },
  { pos: 2, name: "Dr. Felipe A.", indicacoes: 38, ganhos: "R$ 1.140", badge: "🥈" },
  { pos: 3, name: "Verde Vida", indicacoes: 31, ganhos: "R$ 930", badge: "🥉" },
  { pos: 4, name: "Marcos T.", indicacoes: 24, ganhos: "R$ 720", badge: "" },
  { pos: 5, name: "Juliana R.", indicacoes: 19, ganhos: "R$ 570", badge: "" },
];

const myReferrals = [
  { name: "Pedro M.", type: "Paciente", date: "22/02/2026", status: "convertido", comissao: "R$ 12,00" },
  { name: "Farmácia Vida", type: "Vendedor", date: "20/02/2026", status: "convertido", comissao: "R$ 45,00" },
  { name: "Lucia F.", type: "Paciente", date: "18/02/2026", status: "pendente", comissao: "—" },
  { name: "Dr. Hugo T.", type: "Profissional", date: "15/02/2026", status: "convertido", comissao: "R$ 15,00" },
];

const Indicacoes = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!", description: "Link de indicação copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 3000);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground">Carregando...</div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <Lock size={48} className="text-primary mx-auto mb-6" />
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Indicação <span className="text-gradient-green">Premiada</span>
            </h1>
            <p className="text-muted-foreground mb-8 font-medium">
              Acesso exclusivo para usuários cadastrados. Faça login ou cadastre-se para participar do programa de indicações.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-8" onClick={() => navigate("/cadastro")}>
                Criar Conta <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Gift size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">PROGRAMA DE INDICAÇÃO</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-3xl md:text-5xl lg:text-6xl font-display font-black text-foreground leading-tight mb-4">
              Indicação <span className="text-gradient-green">Premiada</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-muted-foreground max-w-3xl font-medium text-lg mb-8">
              Indique pacientes, profissionais e farmácias. Ganhe <span className="text-primary font-bold">10% de comissão</span> sobre cada transação realizada pelos seus indicados. Pagamento automático via PIX.
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Indicados", value: "4", icon: Users },
                { label: "Convertidos", value: "3", icon: CheckCircle2 },
                { label: "Ganhos Totais", value: "R$ 72,00", icon: DollarSign },
                { label: "Taxa Conversão", value: "75%", icon: TrendingUp },
              ].map((s, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 text-center">
                    <s.icon size={20} className="text-primary mx-auto mb-2" />
                    <p className="text-2xl font-display font-black text-foreground">{s.value}</p>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</span>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Share Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border border-green/20">
              <CardContent className="p-6">
                <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  <Share2 size={18} className="text-primary" /> Seu Código de Indicação
                </h3>

                <div className="p-4 rounded-2xl bg-gradient-green border border-green mb-4 text-center">
                  <p className="text-3xl font-display font-black text-primary tracking-widest">{referralCode}</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-muted-foreground mb-2 block">Link de indicação</label>
                  <div className="flex gap-2">
                    <Input value={referralLink} readOnly className="bg-muted border-border text-xs font-mono" />
                    <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => handleCopy(referralLink)}>
                      {copied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center p-6 rounded-2xl bg-card border border-border">
                  <div className="w-32 h-32 border-2 border-dashed border-green/50 rounded-2xl flex items-center justify-center">
                    <QrCode size={48} className="text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">QR Code para compartilhar</p>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  <Medal size={18} className="text-[hsl(45,76%,52%)]" /> Ranking de Indicadores
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Atualizado em tempo real</p>

                <div className="space-y-3">
                  {leaderboard.map((l) => (
                    <div key={l.pos} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      l.pos <= 3 ? "bg-gradient-gold border-gold" : "bg-muted/30 border-border"
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black w-8 text-center">{l.badge || `#${l.pos}`}</span>
                        <div>
                          <p className="font-black text-sm text-foreground">{l.name}</p>
                          <p className="text-xs text-muted-foreground">{l.indicacoes} indicações</p>
                        </div>
                      </div>
                      <span className="font-display font-black text-primary text-sm">{l.ganhos}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* My Referrals */}
      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          <h3 className="font-display font-black text-foreground mb-4">Minhas Indicações</h3>
          <div className="space-y-3">
            {myReferrals.map((r, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.type} • {r.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      r.status === "convertido" ? "bg-primary/10 text-primary border-green" : "bg-[hsl(45,76%,52%)]/10 text-[hsl(45,76%,52%)] border-gold"
                    }`}>
                      {r.status === "convertido" ? "Convertido" : "Pendente"}
                    </Badge>
                    <span className="font-bold text-sm text-foreground">{r.comissao}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-gradient-green border border-green">
            <h4 className="font-display font-black text-foreground mb-2">Como funciona?</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Compartilhe", desc: "Envie seu código ou link via WhatsApp, e-mail ou redes sociais." },
                { step: "2", title: "Novo cadastro", desc: "Quando alguém se cadastrar usando seu código, fica vinculado a você." },
                { step: "3", title: "Ganhe 10%", desc: "A cada transação do indicado, você recebe 10% automaticamente via PIX." },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="step-number shrink-0">{s.step}</div>
                  <div>
                    <p className="font-black text-sm text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Indicacoes;
